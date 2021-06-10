const { emoji } = require("../../config.json");
const { reviewEmbed, logEmbed, fetchUser } = require("../../utils/misc");
const { dbQuery } = require("../../utils/db");
const { checkPermissions, checkSuggestions, checkConfig, checkReview, checkSuggestion } = require("../../utils/checks");
const { serverLog, } = require("../../utils/logs");
const { cleanCommand, editFeedMessage, notifyFollowers } = require("../../utils/actions");
const { string } = require("../../utils/strings");
const { initTrello } = require("../../utils/trello");

module.exports = {
	controls: {
		name: "edit",
		permission: 10,
		aliases: ["change", "revise"],
		usage: "edit [suggestion id] [new content]",
		description: "Edits a suggestion",
		enabled: true,
		examples: "`{{p}}edit 1234 This is an edit suggestion`\nEdits suggestion #1234 to have the content of \"This is an edit suggestion\"",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20,
		docs: "topics/suggestion-editing"
	},
	do: async (locale, message, client, args, Discord, noCommand=false) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(string(locale, "UNCONFIGURED_ERROR", {}, "error"));
		const guildLocale = qServerDB.config.locale;

		let missingConfig = await checkConfig(locale, qServerDB, client);
		if (missingConfig) return message.channel.send(missingConfig);

		let permission = await checkPermissions(message.member, client);

		let channels = qServerDB.config.channels.commands_new;
		if (qServerDB.config.channels.commands) channels.push(qServerDB.config.channels.commands);
		if (channels.length > 0 && !channels.includes(message.channel.id) && !noCommand && permission > 3) {
			return message.channel.send(string(locale, "EDIT_NOT_COMMAND_CHANNEL_ERROR", { channels: channels.map(c => `<#${c}>`).join(", ") }, "error")).then(sent => cleanCommand(message, sent, qServerDB, noCommand));
		}

		let [fetchSuggestion, qSuggestionDB] = await checkSuggestion(locale, message.guild, args[0]);
		if (fetchSuggestion) return message.channel.send(fetchSuggestion).then(sent => cleanCommand(message, sent, qServerDB));

		if (qSuggestionDB.status === "denied") return message.channel.send(string(locale, "SUGGESTION_DENIED_EDIT_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB, noCommand));
		if (qSuggestionDB.implemented) return message.channel.send(string(locale, "SUGGESTION_IMPLEMENTED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB, noCommand));

		if (permission > 3 && qSuggestionDB.suggester !== message.author.id) return message.channel.send(string(locale, "EDIT_NOT_AUTHOR_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB, noCommand));

		let newSuggestion = args.splice(1).join(" ");
		if (!newSuggestion) return message.channel.send(string(locale, "EDIT_NO_CONTENT_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB, noCommand));
		if (newSuggestion.length > 1900) return message.channel.send(string(locale, "TOO_LONG_SUGGESTION_ERROR_NEW", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB, noCommand));

		let suggester = await fetchUser(qSuggestionDB.suggester, client);

		if (qSuggestionDB.status === "awaiting_review") {
			//Suggestion in-review
			let checkStaff = checkReview(locale, message.guild, qServerDB, qSuggestionDB);
			if (checkStaff) return message.channel.send(checkStaff);

			qSuggestionDB.edited_by = suggester.id !== message.author.id ? message.author.id : null;
			qSuggestionDB.suggestion = newSuggestion;
			await qSuggestionDB.save();
			let embedReview = reviewEmbed(guildLocale, qSuggestionDB, suggester, "yellow", null, suggester.id !== message.author.id ? message.author : null);
			embedReview.addField(string(guildLocale, "APPROVE_DENY_HEADER"), string(guildLocale, "REVIEW_COMMAND_INFO_NEW", { approve: `<:${emoji.check}>`, deny: `<:${emoji.x}>`, channel: `<#${qServerDB.config.channels.suggestions}>` }));
			if (qSuggestionDB.reviewMessage && (qSuggestionDB.channels.staff || qServerDB.config.channels.staff)) client.channels.cache.get(qSuggestionDB.channels.staff || qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(qServerDB.config.ping_role ? (qServerDB.config.ping_role === message.guild.id ? "@everyone" : `<@&${qServerDB.config.ping_role}>`) : "", { embed: embedReview, disableMentions: "none" })).catch(() => {});
			if (qServerDB.config.channels.log) {
				let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "LOG_EDIT_SUBMITTED_ON_APPROVED_TITLE", "yellow")
					.setDescription(newSuggestion);

				serverLog(embedLog, qServerDB, client);
			}

			if (qServerDB.config.trello.board && qSuggestionDB.trello_card) {
				const t = initTrello();
				t.updateCardName(qSuggestionDB.trello_card, newSuggestion).catch(() => {});
			}

			return message.channel.send(string(locale, message.author.id === suggester.id ? "SUGGESTION_UPDATED_SELF" : "SUGGESTION_UPDATED_NOT_SELF"), new Discord.MessageEmbed().setAuthor(string(locale, qSuggestionDB.anon ? "ANON_SUGGESTION" : "SUGGESTION_FROM_TITLE", { user: suggester.tag }), (qSuggestionDB.anon ? client.user : suggester).displayAvatarURL({dynamic: true, format: "png"})).setColor(client.colors.yellow).setDescription(newSuggestion).setFooter(string(locale, "SUGGESTION_FOOTER", { id: qSuggestionDB.suggestionId.toString() })).setTimestamp(qSuggestionDB.submitted)).then(sent => cleanCommand(message, sent, qServerDB));
		} else {
			//Suggestion has been approved
			let checkSugg = checkSuggestions(locale, message.guild, qServerDB, qSuggestionDB);
			if (checkSugg) return message.channel.send(checkSugg);

			if (permission > 3 && qServerDB.config.mode !== "autoapprove") {
				//Either update feed message on autoapprove or send for review on review
				let embedReview = reviewEmbed(guildLocale, {
					suggestionId: qSuggestionDB.suggestionId,
					suggestion: newSuggestion,
					attachment: qSuggestionDB.attachment,
					submitted: new Date(),
					edit: true
				}, message.author, "yellow");
				embedReview.addField(string(guildLocale, "APPROVE_DENY_HEADER"), string(guildLocale, "REVIEW_COMMAND_INFO_NEW", { approve: `<:${emoji.check}>`, deny: `<:${emoji.x}>`, channel: `<#${qServerDB.config.channels.suggestions}>` }));
				let reviewMessage = await client.channels.cache.get(qServerDB.config.channels.staff).send(qServerDB.config.ping_role ? (qServerDB.config.ping_role === message.guild.id ? "@everyone" : `<@&${qServerDB.config.ping_role}>`) : "", { embed: embedReview, disableMentions: "none" });
				client.reactInProgress = true;
				await reviewMessage.react(emoji.check).then(() => qSuggestionDB.pending_edit.reviewEmojis.approve = emoji.check);
				await reviewMessage.react(emoji.x).then(() => qSuggestionDB.pending_edit.reviewEmojis.deny = emoji.x);
				qSuggestionDB.pending_edit.messageid = reviewMessage.id;
				qSuggestionDB.pending_edit.channelid = reviewMessage.channel.id;
				qSuggestionDB.pending_edit.content = newSuggestion;
				await qSuggestionDB.save();
				client.reactInProgress = false;
				if (qServerDB.config.channels.log) {
					let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "LOG_EDIT_SUBMITTED_REVIEW_TITLE", "yellow")
						.setDescription(newSuggestion);

					serverLog(embedLog, qServerDB, client);
				}
				return message.channel.send(string(locale, "SUGGESTION_UPDATED_REVIEW"), new Discord.MessageEmbed().setAuthor(string(locale, qSuggestionDB.anon ? "ANON_SUGGESTION" : "SUGGESTION_FROM_TITLE", { user: suggester.tag }), (qSuggestionDB.anon ? client.user : suggester).displayAvatarURL({dynamic: true, format: "png"})).setColor(client.colors.yellow).setDescription(newSuggestion).setFooter(string(locale, "SUGGESTION_FOOTER", { id: qSuggestionDB.suggestionId.toString() })).setTimestamp(qSuggestionDB.submitted)).then(sent => cleanCommand(message, sent, qServerDB));
			} else {
				//Admin, don't send for review
				qSuggestionDB.edited_by = suggester.id !== message.author.id ? message.author.id : null;
				qSuggestionDB.suggestion = newSuggestion;
				await qSuggestionDB.save();

				let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client);
				if (editFeed) return message.channel.send(editFeed).then(sent => cleanCommand(message, sent, qServerDB));

				await notifyFollowers(client, qServerDB, qSuggestionDB, "blue", { string: "SUGGESTION_EDIT_DM_TITLE", guild: message.guild.name }, qSuggestionDB.attachment, qServerDB.config.channels.suggestions, null, null, { author: message.author.id !== suggester.id });

				if (qServerDB.config.channels.log) {
					let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "LOG_EDIT_TITLE", "blue")
						.setDescription(newSuggestion);

					serverLog(embedLog, qServerDB, client);
				}

				if (qServerDB.config.trello.board && qSuggestionDB.trello_card) {
					const t = initTrello();
					t.updateCardName(qSuggestionDB.trello_card, newSuggestion).catch(() => {});
				}
				return message.channel.send(string(locale, message.author.id === suggester.id ? "SUGGESTION_UPDATED_SELF" : "SUGGESTION_UPDATED_NOT_SELF"), new Discord.MessageEmbed().setAuthor(string(locale, qSuggestionDB.anon ? "ANON_SUGGESTION" : "SUGGESTION_FROM_TITLE", { user: suggester.tag }), (qSuggestionDB.anon ? client.user : suggester).displayAvatarURL({dynamic: true, format: "png"})).setColor(client.colors.blue).setDescription(newSuggestion).setFooter(string(locale, "SUGGESTION_FOOTER", { id: qSuggestionDB.suggestionId.toString() })).setTimestamp(qSuggestionDB.submitted)).then(sent => cleanCommand(message, sent, qServerDB));
			}
		}
	}
};
