const { suggestionEmbed, fetchUser, logEmbed } = require("../../utils/misc.js");
const { dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { serverLog } = require("../../utils/logs");
const { channelPermissions, suggestionEditCommandCheck } = require("../../utils/checks");
const { emoji } = require("../../config.json");
const { deleteFeedMessage, editFeedMessage, notifyFollowers } = require("../../utils/actions");
const { cleanCommand } = require("../../utils/actions");
const { actCard, trelloComment } = require("../../utils/trello");
module.exports = {
	controls: {
		name: "status",
		permission: 3,
		aliases: ["mark"],
		usage: "mark [suggestion id] [status] (comment)",
		description: "Marks a status on a suggestion",
		image: "images/Mark.gif",
		enabled: true,
		examples: "`{{p}}mark 1 implemented`\nMarks suggestion #1 as implemented\n\n`{{p}}mark 1 working This will be released soon!`\nMarks suggestion #1 as in progress and adds a comment saying \"This will be released soon!\"\n\n>>> **Status List:**\n<:simplementednum:822458050161147914> Implemented (`implemented`)\n<:sworkingnum:822458050374795295> In Progress (`working`)\n<:sconsider:822458050111340544> In Consideration (`considered`)\n<:sdefault1:822457150507974666> Default (`default`)\n<:snonum:822458049801355315> Not Happening (`no`)",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS", "MANAGE_MESSAGES"],
		cooldown: 10,
		docs: "staff/mark"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(locale, message, args);
		if (returned) return message.channel.send(returned).then(sent => returned instanceof Discord.MessageEmbed ? null : cleanCommand(message, sent, qServerDB));
		let guildLocale = qServerDB.config.locale;

		function status (input) {
			switch (input ? input.toLowerCase() : "") {
			case "implemented":
			case "done":
				return [["implemented"], string(locale, "STATUS_IMPLEMENTED"), string(guildLocale, "STATUS_IMPLEMENTED"), client.colors.green];
			case "working":
			case "progress":
			case "inprogress":
				return [["working"], string(locale, "STATUS_PROGRESS"), string(guildLocale, "STATUS_PROGRESS"), client.colors.orange];
			case "consideration":
			case "consider":
			case "considered":
			case "inconsideration":
				return [["consideration"], string(locale, "STATUS_CONSIDERATION"), string(guildLocale, "STATUS_CONSIDERATION"), client.colors.teal];
			case "no":
			case "not":
				return [["no"], string(locale, "STATUS_NO"), string(guildLocale, "STATUS_NO"), client.colors.gray];
			case "default":
			case "none":
			case "reset":
				return [[null, "default"], string(locale, "STATUS_DEFAULT"), string(guildLocale, "STATUS_DEFAULT"), client.colors.default];
			default:
				return [null];
			}
		}

		let statusInput = args[1];
		let shifted = false;
		if (!status(args[1])[0]) {
			let m = await message.channel.send(`${string(locale, "NONE_OR_INVALID_STATUS_ERROR", { x: `<:${emoji.x}>`, list: `<:simplemented:822458050161147914> ${string(locale, "STATUS_IMPLEMENTED")}\n<:sprogress:822458050374795295> ${string(locale, "STATUS_PROGRESS")}\n<:sconsider:822458050111340544> ${string(locale, "STATUS_CONSIDERATION")}\n<:sdefault:822457150507974666> ${string(locale, "STATUS_DEFAULT")}\n<:sno:822458049801355315> ${string(locale, "STATUS_NO")}` })}`);
			let emotes = [["simplementednum:822458050161147914", "implemented"], ["sworkingnum:822458050374795295", "working"], ["sconsidernum:822458050111340544", "consider"], ["sdefaultnum:822457150507974666", "default"], ["snonum:822458049801355315", "no"], [emoji.x, "cancel"]];
			const filter = ({ emoji }, { id }) => emotes.find(em => em[0] === `${emoji.name}:${emoji.id}`) && id === message.author.id;

			for await (let emote of emotes) await m.react(emote[0]);

			const e = (await m.awaitReactions(filter, { max: 1, time: 300000 })).first();
			await m.reactions.removeAll();
			if (!e) {
				return m.edit(string(locale, "MARK_TIMEOUT_ERROR")).then(sent => cleanCommand(message, sent, qServerDB));
			}

			let emote = emotes.find(em => em[0] === `${e.emoji.name}:${e.emoji.id}`);
			if (emote[1] === "cancel") {
				return m.edit(string(locale, "CANCELLED", {}, "success"));
			}
			await m.delete();
			statusInput = emote[1];
			shifted = true;
		}

		let [checkFor, str, guildstr, color] = status(statusInput);
		if (!checkFor) return message.channel.send(string(locale, "NO_STATUS_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		if (checkFor.includes(qSuggestionDB.displayStatus)) return message.channel.send(string(locale, "STATUS_ALREADY_SET_ERROR", { status: str }, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let isComment = args.slice(2).join(" ").trim();
		let comment;
		if (isComment) {
			comment = args.splice(shifted ? 1 : 2).join(" ");
			if (comment.length > 1024) return message.channel.send(string(locale, "COMMENT_TOO_LONG_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			let commentId = qSuggestionDB.comments.length+1;
			isComment = commentId;
			let trello_comment = await trelloComment(qServerDB, message.author, qSuggestionDB, comment);
			qSuggestionDB.comments.push({
				comment: comment,
				author: message.author.id,
				id: commentId,
				created: new Date(),
				trello_comment
			});
		}

		qSuggestionDB.displayStatus = checkFor[0];

		if (qSuggestionDB.displayStatus === "implemented" && qServerDB.config.channels.archive) {
			if (message.guild.channels.cache.get(qServerDB.config.channels.archive)) {
				let perms = channelPermissions(locale,  "denied", message.guild.channels.cache.get(qServerDB.config.channels.archive), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string(locale, "NO_ARCHIVE_CHANNEL_ERROR", {}, "error"));

			let suggestionNewEmbed = await suggestionEmbed(guildLocale, qSuggestionDB, qServerDB, client);
			let deleteMsg = await deleteFeedMessage(locale, qSuggestionDB, qServerDB, client);
			if (deleteMsg[0]) return message.channel.send(deleteMsg[0]).then(sent => cleanCommand(message, sent, qServerDB));

			qSuggestionDB.implemented = true;

			client.channels.cache.get(qServerDB.config.channels.archive).send(suggestionNewEmbed).then(async sent => {
				let replyEmbed = new Discord.MessageEmbed()
					.setTitle(string(locale, "STATUS_EDITED_TITLE"))
					.setDescription(`${qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, "IMPLEMENTED_LINK")}](https://discord.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`)
					.setColor(color)
					.setFooter(string(locale, "SUGGESTION_FOOTER", {id: id.toString()}))
					.setTimestamp(qSuggestionDB.submitted)
					.addField(string(locale, "INFO_PUBLIC_STATUS_HEADER"), str);

				if (comment) replyEmbed.addField(string(locale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
				message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));

				if (qServerDB.config.channels.log) {
					let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "STATUS_MARK_LOG", color)
						.addField(string(guildLocale, "INFO_PUBLIC_STATUS_HEADER"), guildstr)
						.addField(string(guildLocale, "IMPLEMENTED_LINK"), `[${string(guildLocale, "IMPLEMENTED_LINK")}](https://discord.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`);

					if (comment) logs.addField(string(guildLocale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
					serverLog(logs, qServerDB, client);
				}

				if (qServerDB.config.implemented_role && message.guild.roles.cache.get(qServerDB.config.implemented_role) && message.guild.members.cache.get(suggester.id) && message.guild.me.permissions.has("MANAGE_ROLES")) await message.guild.members.cache.get(suggester.id).roles.add(qServerDB.config.implemented_role, string(locale, "STATUS_IMPLEMENTED"));

				await notifyFollowers(client, qServerDB, qSuggestionDB, color, { string: "STATUS_MARK_DM_TITLE", guild: message.guild.name }, null, null, { header: "INFO_PUBLIC_STATUS_HEADER", reason: str }, function(e, l) {
					if (comment) e.addField(string(l, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
					e.addField(string(l, "IMPLEMENTED_LINK"), `[${string(l, "IMPLEMENTED_LINK")}](https://discord.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`);
					return e;
				});
			});

			await actCard("implemented", qServerDB, qSuggestionDB, suggester, `${string(guildLocale, "INFO_PUBLIC_STATUS_HEADER")}: ${guildstr}`);
			await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, qSuggestionDB);
			return;
		}

		await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, qSuggestionDB);

		let editFeed = await editFeedMessage({ guild: guildLocale, user: locale }, qSuggestionDB, qServerDB, client, qSuggestionDB.displayStatus === "no" && !qServerDB.config.channels.denied);
		if (editFeed) return message.channel.send(editFeed).then(sent => cleanCommand(message, sent, qServerDB));

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string(locale, "STATUS_EDITED_TITLE"))
			.setDescription(`${qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT")}\n[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${qSuggestionDB.id}/${qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setColor(color)
			.setFooter(string(locale, "SUGGESTION_FOOTER", {id: id.toString()}))
			.setTimestamp(qSuggestionDB.submitted)
			.addField(string(locale, "INFO_PUBLIC_STATUS_HEADER"), str);

		if (comment) replyEmbed.addField(string(locale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
		message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(guildLocale, qSuggestionDB, message.author, "STATUS_MARK_LOG", color)
				.addField(string(guildLocale, "INFO_PUBLIC_STATUS_HEADER"), guildstr);

			if (comment) logs.addField(string(guildLocale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
			serverLog(logs, qServerDB, client);
		}

		await actCard({ working: "progress", consideration: "consider", no: "nothappening" }[qSuggestionDB.displayStatus] || qSuggestionDB.displayStatus, qServerDB, qSuggestionDB, suggester, `${string(guildLocale, "INFO_PUBLIC_STATUS_HEADER")}: ${guildstr}`);

		if (qSuggestionDB.displayStatus === "implemented" && qServerDB.config.implemented_role && message.guild.roles.cache.get(qServerDB.config.implemented_role) && message.guild.members.cache.get(suggester.id) && message.guild.me.permissions.has("MANAGE_ROLES")) await message.guild.members.cache.get(suggester.id).roles.add(qServerDB.config.implemented_role, string(locale, "STATUS_IMPLEMENTED"));

		if (![null, "default"].includes(qSuggestionDB.displayStatus)) await notifyFollowers(client, qServerDB, qSuggestionDB, color, { string: "STATUS_MARK_DM_TITLE", guild: message.guild.name }, null, qServerDB.config.channels.suggestions, { header: "INFO_PUBLIC_STATUS_HEADER", reason: str }, function(e, l) {
			if (comment) e.addField(string(l, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_${isComment}` }), comment);
			return e;
		});
		return { protip: { command: "mark", not: [comment ? "markcomment" : null] } };
	}
};
