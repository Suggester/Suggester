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
		usage: "mark <suggestion id> <status>",
		description: "Marks a status for a suggestion",
		image: "images/Mark.gif",
		enabled: true,
		docs: "staff/mark",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(message, args);
		if (returned) return message.channel.send(returned);

		if (!args[1]) return message.channel.send(string("NO_STATUS_ERROR", {}, "error"));

		function status (input) {
			switch (input.toLowerCase()) {
			case "implemented":
			case "done":
				return [["implemented"], string("STATUS_IMPLEMENTED"), colors.green];
			case "working":
			case "progress":
			case "in":
				return [["working"], string("STATUS_PROGRESS"), colors.orange];
			case "no":
			case "not":
				return [["no"], string("STATUS_NO"), colors.gray];
			case "default":
			case "none":
			case "reset":
				return [[null, "default"], string("STATUS_DEFAULT"), colors.default];
			default:
				return [null];
			}
		}

		let [checkFor, str, color] = status(args[1]);
		if (!checkFor) return message.channel.send(string("NO_STATUS_ERROR", {}, "error"));
		if (checkFor.includes(qSuggestionDB.displayStatus)) return message.channel.send(string("STATUS_ALREADY_SET_ERROR", { status: str }, "error"));

		qSuggestionDB.displayStatus = checkFor[0];

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string("ERROR", {}, "error"));

		if (qSuggestionDB.displayStatus === "implemented" && qServerDB.config.channels.archive) {
			if (message.guild.channels.cache.get(qServerDB.config.channels.archive)) {
				let perms = channelPermissions( "denied", message.guild.channels.cache.get(qServerDB.config.channels.archive), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string("NO_ARCHIVE_CHANNEL_ERROR", {}, "error"));

			let suggestionNewEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
			let deleteMsg = await deleteFeedMessage(qSuggestionDB, qServerDB, client);
			if (deleteMsg[0]) return message.channel.send(deleteMsg[0]);

			let votes = checkVotes(qSuggestionDB, deleteMsg[1]);
			if (votes[0] || votes[1]) suggestionNewEmbed.addField(string("VOTE_TOTAL_HEADER"), `${string("VOTE_COUNT_OPINION")} ${isNaN(votes[2]) ? string("UNKNOWN") : (votes[2] > 0 ? `+${votes[2]}` : votes[2])}\n${string("VOTE_COUNT_UP")} ${votes[0]}\n${string("VOTE_COUNT_DOWN")} ${votes[1]}`);

			qSuggestionDB.implemented = true;

			client.channels.cache.get(qServerDB.config.channels.archive).send(suggestionNewEmbed).then(async sent => {
				let replyEmbed = new Discord.MessageEmbed()
					.setTitle(string("STATUS_EDITED_TITLE"))
					.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("IMPLEMENTED_LINK")}](https://discordapp.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`)
					.setColor(color)
					.setFooter(string("SUGGESTION_FOOTER", {id: id.toString()}))
					.setTimestamp(qSuggestionDB.submitted)
					.addField(string("INFO_PUBLIC_STATUS_HEADER"), str);
				message.channel.send(replyEmbed);

				let qUserDB = await dbQuery("User", { id: suggester.id });
				if (qServerDB.config.notify && qUserDB.notify) suggester.send((dmEmbed(qSuggestionDB, color, { string: "STATUS_MARK_DM_TITLE", guild: message.guild.name }, null, null, { header: string("INFO_PUBLIC_STATUS_HEADER"), reason: str })).addField(string("IMPLEMENTED_LINK"), `[${string("IMPLEMENTED_LINK")}](https://discordapp.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`)).catch(() => {});

				if (qServerDB.config.channels.log) {
					let logs = logEmbed(qSuggestionDB, message.author, "STATUS_MARK_LOG", color)
						.addField(string("INFO_PUBLIC_STATUS_HEADER"), str)
						.addField(string("IMPLEMENTED_LINK"), `[${string("IMPLEMENTED_LINK")}](https://discordapp.com/channels/${sent.guild.id}/${sent.channel.id}/${sent.id})`);

					serverLog(logs, qServerDB, client);
				}
			});
			await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);
			return;
		}

		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let editFeed = await editFeedMessage(qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string("STATUS_EDITED_TITLE"))
			.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.setColor(color)
			.setFooter(string("SUGGESTION_FOOTER", {id: id.toString()}))
			.setTimestamp(qSuggestionDB.submitted)
			.addField(string("INFO_PUBLIC_STATUS_HEADER"), str);
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (![null, "default"].includes(qSuggestionDB.displayStatus) && qServerDB.config.notify && qUserDB.notify) suggester.send((dmEmbed(qSuggestionDB, color, { string: "STATUS_MARK_DM_TITLE", guild: message.guild.name }, null, qServerDB.config.channels.suggestions, { header: string("INFO_PUBLIC_STATUS_HEADER"), reason: str }))).catch(() => {});

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(qSuggestionDB, message.author, "STATUS_MARK_LOG", color)
				.addField(string("INFO_PUBLIC_STATUS_HEADER"), str);

			serverLog(logs, qServerDB, client);
		}
	}
};
