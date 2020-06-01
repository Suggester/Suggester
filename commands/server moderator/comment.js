const { colors } = require("../../config.json");
const { string } = require("../../utils/strings");
const { fetchUser } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbQuery, dbModify } = require("../../utils/db");
const { suggestionEditCommandCheck } = require("../../utils/checks");
const { editFeedMessage } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "comment",
		permission: 3,
		usage: "comment <suggestion id> <comment>",
		description: "Adds a comment to an approved suggestion",
		image: "images/Comment.gif",
		enabled: true,
		docs: "staff/comment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB, qSuggestionDB, id] = await suggestionEditCommandCheck(message, args);
		if (returned) return message.channel.send(returned);

		if (!args[1]) return message.channel.send(string("NO_COMMENT_ERROR", {}, "error"));

		if (qSuggestionDB.comments && qSuggestionDB.comments.filter(c => !c.deleted).length + 1 > 23) return message.channel.send(string("TOO_MANY_COMMENTS_ERROR", {}, "error"));

		let comment = args.splice(1).join(" ");

		if (comment.length > 1024) return message.channel.send(string("COMMENT_TOO_LONG_ERROR", {}, "error"));

		qSuggestionDB.comments.push({
			comment: comment,
			author: message.author.id,
			id: qSuggestionDB.comments.length+1,
			created: new Date()
		});

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string("ERROR", {}, "error"));

		let editFeed = await editFeedMessage(qSuggestionDB, qServerDB, client);
		if (editFeed) return message.channel.send(editFeed);

		await dbModify("Suggestion", {suggestionId: id}, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string("COMMENT_ADDED_TILE"))
			.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
			.addField(string("COMMENT_TITLE", { user: message.author.tag, id: message.author.id }), comment)
			.setColor(colors.blue)
			.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }))
			.setTimestamp(qSuggestionDB.submitted);
		message.channel.send(replyEmbed);

		let qUserDB = await dbQuery("User", { id: suggester.id });
		if (qServerDB.config.notify && qUserDB.notify) {
			let dmEmbed = new Discord.MessageEmbed()
				.setTitle(string("COMMENT_ADDED_DM_TITLE", { server: message.guild.name }))
				.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`)
				.addField(string("COMMENT_TITLE", { user: message.author.tag, id: message.author.id }), comment)
				.setColor(colors.blue)
				.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }))
				.setTimestamp(qSuggestionDB.submitted);
			suggester.send(dmEmbed).catch(() => {});
		}

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string("COMMENT_ADDED_LOG", { user: message.author.tag, id: id.toString() }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField(string("SUGGESTION"), qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
				.addField(string("COMMENT_TITLE", { user: message.author.tag, id: message.author.id }), comment)
				.setFooter(string("LOG_SUGGESTION_SUBMITTED_FOOTER", { id: id.toString(), user: message.author.id }))
				.setTimestamp()
				.setColor(colors.blue);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
