const { suggestionEmbed, fetchUser, logEmbed, dmEmbed } = require("../../utils/misc.js");
const { dbQuery, dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { serverLog } = require("../../utils/logs");
const { colors } = require("../../config.json");
const { channelPermissions, suggestionEditCommandCheck } = require("../../utils/checks");
const { deleteFeedMessage, checkVotes, editFeedMessage } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "mark",
		permission: 3,
		aliases: ["status"],
		usage: "mark <suggestion id> <status> (comment)",
		description: "Marks a status for a suggestion",
		image: "images/Mark.gif",
		enabled: true,
		docs: "staff/mark",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(locale, message, args);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (!args[1]) return message.channel.send(string(locale, "NO_STATUS_ERROR", {}, "error"));

		function status (input) {
			switch (input.toLowerCase()) {
			case "implemented":
			case "done":
				return [["implemented"], string(locale, "STATUS_IMPLEMENTED"), string(guildLocale, "STATUS_IMPLEMENTED"), colors.green];
			case "working":
			case "progress":
			case "in":
				return [["working"], string(locale, "STATUS_PROGRESS"), string(guildLocale, "STATUS_PROGRESS"), colors.orange];
			case "no":
			case "not":
				return [["no"], string(locale, "STATUS_NO"), string(guildLocale, "STATUS_NO"), colors.gray];
			case "default":
			case "none":
			case "reset":
				return [[null, "default"], string(locale, "STATUS_DEFAULT"), string(guildLocale, "STATUS_DEFAULT"), colors.default];
			default:
				return [null];
			}
		}

		let [checkFor, str, guildstr, color] = status(args[1]);
		if (!checkFor) return message.channel.send(string(locale, "NO_STATUS_ERROR", {}, "error"));
		if (checkFor.includes(qSuggestionDB.displayStatus)) return message.channel.send(string(locale, "STATUS_ALREADY_SET_ERROR", { status: str }, "error"));

		let isComment = args[2];

		let comment;
		if (isComment) {
			comment = args.splice(2).join(" ");
			if (comment.length > 1024) return message.channel.send(string(locale, "COMMENT_TOO_LONG_ERROR", {}, "error"));
			let commentId = qSuggestionDB.comments.length+1;
			isComment = commentId;
			qSuggestionDB.comments.push({
				comment: comment,
				author: message.author.id,
				id: commentId,
				created: new Date()
			});
		}

		qSuggestionDB.displayStatus = checkFor[0];

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error"));

		if (qSuggestionDB.displayStatus === "implemented" && qServerDB.config.channels.archive) {
			if (message.guild.channels.cache.get(qServerDB.config.channels.archive)) {
				let perms = channelPermissions(locale,  "denied", message.guild.channels.cache.get(qServerDB.config.channels.archive), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string(locale, "NO_ARCHIVE_CHANNEL_ERROR", {}, "error"));

			let suggestionNewEmbed = await suggestionEmbed(guildLocale, qSuggestionDB, qServerDB, client);
			let deleteMsg = await deleteFeedMessage(locale, qSuggestionDB, qServerDB, client);
			if (deleteMsg[0]) return message.channel.send(deleteMsg[0]);

			let votes = checkVotes(guildLocale, qSuggestionDB, deleteMsg[1]);
			if (votes[0] || votes[1]) suggestionNewEmbed.addField(string(guildLocale, "VOTE_TOTAL_HEADER"), `${string(guildLocale, "VOTE_COUNT_OPINION")} ${isNaN(votes[2]) ? string(guildLocale, "UNKNOWN") : (votes[2] > 0 ? `+${votes[2]}` : votes[2])}\n${string(guildLocale, "VOTE_COUNT_UP")} ${votes[0]}\n${string(guildLocale, "VOTE_COUNT_DOWN")} ${votes[1]}`);

			qSuggestionDB.implemented = true;

			client.channels.cache.get(qServerDB.config.channels.archive).send(suggestionNewEmbed).then(async sent => {
				let replyEmbed = new Discord.MessageEmbed()
					.setTitle(string(locale, "STATUS_EDITED_TITLE"))
					.setDescription(`${qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, "IMPLEMENTED_LINK")}](https://discordapp.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`)
					.setColor(color)
					.setFooter(string(locale, "SUGGESTION_FOOTER", {id: id.toString()}))
					.setTimestamp(qSuggestionDB.submitted)
					.addField(string(locale, "INFO_PUBLIC_STATUS_HEADER"), str);

				if (isComment) replyEmbed.addField(string(locale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
				message.channel.send(replyEmbed);

				let qUserDB = await dbQuery("User", { id: suggester.id });
				let notify = dmEmbed(qUserDB.locale || guildLocale, qSuggestionDB, color, { string: "STATUS_MARK_DM_TITLE", guild: message.guild.name }, null, null, { header: string(qUserDB.locale || guildLocale, "INFO_PUBLIC_STATUS_HEADER"), reason: str });
				if (isComment) notify.addField(string(qUserDB.locale || guildLocale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
				notify.addField(string(qUserDB.locale || guildLocale, "IMPLEMENTED_LINK"), `[${string(qUserDB.locale || guildLocale, "IMPLEMENTED_LINK")}](https://discordapp.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`);
				if (qServerDB.config.notify && qUserDB.notify) suggester.send(notify).catch(() => {});

				if (qServerDB.config.channels.log) {
					let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "STATUS_MARK_LOG", color)
						.addField(string(guildLocale, "INFO_PUBLIC_STATUS_HEADER"), guildstr)
						.addField(string(guildLocale, "IMPLEMENTED_LINK"), `[${string(guildLocale, "IMPLEMENTED_LINK")}](https://discordapp.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`);

					if (isComment) logs.addField(string(guildLocale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
					serverLog(logs, qServerDB, client);
				}
			});
			await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);
			return;
		}

		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let editFeed = await editFeedMessage(guildLocale, qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "STATUS_EDITED_TITLE"))
			.setDescription(`${qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, "SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setColor(color)
			.setFooter(string(locale, "SUGGESTION_FOOTER", {id: id.toString()}))
			.setTimestamp(qSuggestionDB.submitted)
			.addField(string(locale, "INFO_PUBLIC_STATUS_HEADER"), str);

		if (isComment) replyEmbed.addField(string(locale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		let notify = dmEmbed(qUserDB.locale || guildLocale, qSuggestionDB, color, { string: "STATUS_MARK_DM_TITLE", guild: message.guild.name }, null, qServerDB.config.channels.suggestions, { header: string(qUserDB.locale || guildLocale, "INFO_PUBLIC_STATUS_HEADER"), reason: str });
		if (isComment) notify.addField(string(qUserDB.locale || guildLocale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
		if (![null, "default"].includes(qSuggestionDB.displayStatus) && qServerDB.config.notify && qUserDB.notify) suggester.send(notify).catch(() => {});

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "STATUS_MARK_LOG", color)
				.addField(string(guildLocale, "INFO_PUBLIC_STATUS_HEADER"), guildstr);

			if (isComment) logs.addField(string(guildLocale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
			serverLog(logs, qServerDB, client);
		}
	}
};
