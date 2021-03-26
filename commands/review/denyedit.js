const { string } = require("../../utils/strings");
const { fetchUser, logEmbed, reviewEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbQueryNoNew } = require("../../utils/db");
const { notifyFollowers } = require("../../utils/actions");
const { baseConfig, checkSuggestions, checkReview } = require("../../utils/checks");
const { cleanCommand } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "denyedit",
		permission: 3,
		aliases: ["rejectedit", "refuseedit", "refusedit"],
		usage: "denyedit [suggestion id]",
		description: "Denies a pending suggestion edit",
		examples: "`{{p}}denyedit 1`\nDenies a pending edit on suggestion #123",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		docs: "topics/denyedit"
	},
	do: async (locale, message, client, args, Discord, noCommand=false) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string(locale, "MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(string(locale, "INVALID_SUGGESTION_ID_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let checkSuggest = checkSuggestions(locale, message.guild, qServerDB, qSuggestionDB);
		if (checkSuggest) return message.channel.send(checkSuggest).then(sent => cleanCommand(message, sent, qServerDB));

		let id = qSuggestionDB.suggestionId;
		if (!qSuggestionDB.pending_edit.content) return message.channel.send(string(locale, "NO_PENDING_EDIT_ERROR", { prefix: qServerDB.config.prefix, id: id.toString() }, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let embedReview = reviewEmbed(qServerDB.config.locale, { 
			suggestionId: qSuggestionDB.suggestionId,
			suggestion: qSuggestionDB.pending_edit.content,
			submitted: qSuggestionDB.submitted,
			attachment: qSuggestionDB.attachment,
			edit: true
		}, suggester, "red", string(qServerDB.config.locale, "DENIED_BY", { user: message.author.tag }));

		let checkStaff = checkReview(locale, message.guild, qServerDB, qSuggestionDB, true);
		if (checkStaff) return message.channel.send(checkStaff);
		let reviewReturn = await client.channels.cache.get(qSuggestionDB.pending_edit.channelid || qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.pending_edit.messageid).then(fetched => {
			fetched.edit(embedReview);
			fetched.reactions.removeAll();
		}).catch(() => {});
		if (reviewReturn) return;

		if (!noCommand) {
			let replyEmbed = new Discord.MessageEmbed()
				.setTitle(string(locale, "SUGGESTION_EDIT_DENIED_TITLE"))
				.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setFooter(string(locale, "DENIED_BY", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT"))
				.setColor(client.colors.red);

			await message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));
		}

		qSuggestionDB.pending_edit = {};
		await qSuggestionDB.save();

		await notifyFollowers(client, qServerDB, qSuggestionDB, "red", { string: "EDIT_DENY_DM_TITLE", guild: message.guild.name }, qSuggestionDB.attachment, null, null, null, { follow: false });

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "LOG_EDIT_DENY_TITLE", "red")
				.setDescription(qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));

			serverLog(embedLog, qServerDB, client);
		}
	}
};
