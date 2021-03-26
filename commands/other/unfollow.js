const { dbModify, dbQuery } = require("../../utils/db");
const { checkSuggestion } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { cleanCommand } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "unfollow",
		permission: 10,
		aliases: ["unsubscribe", "unsub", "defollow"],
		usage: "unfollow [suggestion id|auto]",
		description: "Unfollows a suggestion",
		enabled: true,
		examples: "`{{p}}unfollow 123`\nUnfollows suggestion #123",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		docs: "topics/unfollow"
	},
	do: async (locale, message, client, args) => {
		const qServerDB = message.guild ? await message.guild.db : null;
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(string(locale, "INVALID_SUGGESTION_ID_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		if (["auto", "automatic"].includes(args[0].toLowerCase())) {
			if (!qUserDB.auto_subscribe) return message.channel.send(string(locale, "AUTOFOLLOW_ALREADY_DISABLED", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			qUserDB.auto_subscribe = false;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "AUTOFOLLOW_DISABLED", {}, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		} else {
			let [fetchSuggestion, qSuggestionDB] = await checkSuggestion(locale, message.guild, args[0]);
			if (fetchSuggestion) return message.channel.send(fetchSuggestion).then(sent => cleanCommand(message, sent, qServerDB));
			if (!qUserDB.subscribed.find(s => s.id === qSuggestionDB.suggestionId)) return message.channel.send(string(locale, "NOT_FOLLOWING_ERROR", { id: qSuggestionDB.suggestionId }, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			let index = qUserDB.subscribed.findIndex(s => s.id === qSuggestionDB.suggestionId);
			qUserDB.subscribed.splice(index, 1);
			qUserDB.save();
			return message.channel.send(string(locale, "UNFOLLOW_SUCCESS", { id: qSuggestionDB.suggestionId }, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		}
	}
};
