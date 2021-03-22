const { dbModify } = require("../../utils/db");
const { serverLog } = require("../../utils/logs");
const { reviewEmbed, logEmbed, fetchUser } = require("../../utils/misc");
const { notifyFollowers, deleteFeedMessage } = require("../../utils/actions");
const { string } = require("../../utils/strings");
const { checkSuggestion, checkDenied, baseConfig, checkReview, checkSuggestions } = require("../../utils/checks");
const { cleanCommand } = require("../../utils/actions");
const { actCard } = require("../../utils/trello");
module.exports = {
	controls: {
		name: "dupe",
		permission: 3,
		usage: "dupe [duplicate suggestion id] [original suggestion id]",
		aliases: ["duplicate", "d"],
		description: "Denies a suggestion as a duplicate of another",
		enabled: true,
		examples: "`{{p}}dupe 1 2`\nDenies suggestion #1 as a duplicate of suggestion #2",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		docs: "staff/dupe"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		const guildLocale = qServerDB.config.locale;

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string(locale, "MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		let deniedCheck = checkDenied(locale, message.guild, qServerDB);
		if (deniedCheck) return message.channel.send(deniedCheck);

		let [fetchSuggestion, dupeSuggestion] = await checkSuggestion(locale, message.guild, args[0]);
		if (fetchSuggestion) return message.channel.send(fetchSuggestion).then(sent => cleanCommand(message, sent, qServerDB));
		let [fetchSuggestionOrig, origSuggestion] = await checkSuggestion(locale, message.guild, args[1]);
		if (fetchSuggestionOrig) return message.channel.send(string(locale, "DUPE_ORIGINAL_INVALID_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let id = dupeSuggestion.suggestionId;

		let suggester = await fetchUser(dupeSuggestion.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		if (dupeSuggestion.status === "denied") return message.channel.send(string(guildLocale, "SUGGESTION_ALREADY_DENIED_DENIED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let reasonInfo = {
			name: "DUPE_REASON",
			replaced: {
				id: origSuggestion.suggestionId
			}
		};

		if (origSuggestion.implemented) reasonInfo.name = "DUPE_REASON_IMPLEMENTED";
		else if (origSuggestion.status === "awaiting_review") reasonInfo.name = "DUPE_REASON_REVIEW";
		else if (origSuggestion.status === "denied") {
			reasonInfo.name = "DUPE_REASON_DENIED";
			if (origSuggestion.denial_reason) {
				reasonInfo.name = "DUPE_REASON_DENIED_WITH_REASON";
				reasonInfo.replaced.reason = origSuggestion.denial_reason;
			}
			if (string(guildLocale, reasonInfo.name, reasonInfo.replaced).length > 1024) {
				reasonInfo.name = "DUPE_REASON_DENIED";
				reasonInfo.replaced.reason = "";
			}
		}
		else reasonInfo.replaced.link = `https://discord.com/channels/${origSuggestion.id}/${origSuggestion.channels.suggestions || qServerDB.config.channels.suggestions}/${origSuggestion.messageId}`;

		let review = dupeSuggestion.status === "awaiting_review";
		dupeSuggestion.status = "denied";
		dupeSuggestion.staff_member = message.author.id;
		dupeSuggestion.denial_reason = string(guildLocale, reasonInfo.name, reasonInfo.replaced);

		if (dupeSuggestion.reviewMessage && (dupeSuggestion.channels.staff || dupeSuggestion.config.channels.staff)) {
			let checkStaff = checkReview(locale, message.guild, qServerDB, dupeSuggestion);
			if (checkStaff) return message.channel.send(checkStaff);
			let returned = await client.channels.cache.get(dupeSuggestion.channels.staff || qServerDB.config.channels.staff).messages.fetch(dupeSuggestion.reviewMessage).then(fetched => {
				let re = reviewEmbed(locale, dupeSuggestion, suggester, "red", string(locale, review ? "DENIED_BY" : "DELETED_BY", {user: message.author.tag}));
				dupeSuggestion.denial_reason ? re.addField(string(locale, "REASON_GIVEN"), dupeSuggestion.denial_reason) : "";
				fetched.edit(re);
				fetched.reactions.removeAll();
			}).catch(() => {
			});
			if (returned) return;
		}

		if (!review) {
			let suggestionsCheck = checkSuggestions(locale, message.guild, qServerDB, dupeSuggestion);
			if (suggestionsCheck) return [suggestionsCheck, qServerDB];
			let deleteMsg = await deleteFeedMessage(locale, dupeSuggestion, qServerDB, client);
			if (deleteMsg[0]) return message.channel.send(deleteMsg[0]).then(sent => cleanCommand(message, sent, qServerDB));
		}

		await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, dupeSuggestion);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, review ? "SUGGESTION_DENIED_TITLE" : "SUGGESTION_DELETED_TITLE"))
			.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", {user: suggester.tag}), suggester.displayAvatarURL({
				format: "png",
				dynamic: true
			}))
			.setFooter(string(locale, review ? "DENIED_BY" : "DELETED_BY", {user: message.author.tag}), message.author.displayAvatarURL({
				format: "png",
				dynamic: true
			}))
			.setDescription(dupeSuggestion.suggestion || string(locale, "NO_SUGGESTION_CONTENT"))
			.setColor(client.colors.red)
			.addField(string(locale, "REASON_GIVEN"), dupeSuggestion.denial_reason);
		if (dupeSuggestion.attachment) {
			replyEmbed.addField(string(locale, "WITH_ATTACHMENT_HEADER"), dupeSuggestion.attachment)
				.setImage(dupeSuggestion.attachment);
		}
		await message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));

		await notifyFollowers(client, qServerDB, dupeSuggestion, "red", { string: review ? "DENIED_DM_TITLE" : "DELETED_DM_TITLE", guild: message.guild.name }, dupeSuggestion.attachment, null,{ header: "REASON_GIVEN", reason: dupeSuggestion.denial_reason });

		if (qServerDB.config.channels.denied) {
			let deniedEmbed = new Discord.MessageEmbed()
				.setTitle(string(guildLocale, review ? "SUGGESTION_DENIED_TITLE" : "SUGGESTION_DELETED_TITLE"))
				.setAuthor(string(guildLocale, "SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(dupeSuggestion.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"))
				.setFooter(string(guildLocale, "SUGGESTION_FOOTER", {id: id.toString()}))
				.setTimestamp(dupeSuggestion.submitted)
				.setColor(client.colors.red)
				.addField(string(locale, "REASON_GIVEN"), dupeSuggestion.denial_reason);
			dupeSuggestion.attachment ? deniedEmbed.setImage(dupeSuggestion.attachment) : "";
			if (dupeSuggestion.anon) deniedEmbed.setAuthor(string(locale, "ANON_SUGGESTION"), client.user.displayAvatarURL({ format: "png" })).setThumbnail("");
			client.channels.cache.get(qServerDB.config.channels.denied).send(deniedEmbed);
		}

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(guildLocale, dupeSuggestion, message.author, review ? "DENIED_LOG" : "DELETED_LOG", "red")
				.setDescription(dupeSuggestion.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));

			logs.addField(string(guildLocale, "REASON_GIVEN"), dupeSuggestion.denial_reason);
			if (dupeSuggestion.attachment) {
				logs.setImage(dupeSuggestion.attachment);
				logs.addField(string(guildLocale, "WITH_ATTACHMENT_HEADER"), dupeSuggestion.attachment);
			}
			serverLog(logs, qServerDB, client);
		}

		await actCard(review ? "deny" : "delete", qServerDB, dupeSuggestion, suggester, `${string(guildLocale, review ? "DENIED_BY" : "DELETED_BY", { user: message.author.tag })}${dupeSuggestion.denial_reason ? `\n${string(guildLocale, "BLOCK_REASON_HEADER")} ${dupeSuggestion.denial_reason}` : ""}`);
	}
};
