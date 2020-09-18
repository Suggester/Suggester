const { dbQuery } = require("../../utils/db");
const { checkSuggestion } = require("../../utils/checks");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "unfollow",
		permission: 10,
		aliases: ["unsubscribe", "unsub"],
		usage: "unfollow [suggestion id]",
		description: "Unfollows a suggestion",
		enabled: true,
		examples: "`{{p}}unfollow 123`\nUnfollows suggestion #123",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (locale, message, client, args) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(string(locale, "INVALID_SUGGESTION_ID_ERROR", {}, "error"));
		let [fetchSuggestion, qSuggestionDB] = await checkSuggestion(locale, message.guild, args[0]);
		if (fetchSuggestion) return message.channel.send(fetchSuggestion);
		if (!qUserDB.subscribed.find(s => s.id === qSuggestionDB.suggestionId)) return message.channel.send(string(locale, "NOT_FOLLOWING_ERROR", { id: qSuggestionDB.suggestionId }, "error"));
		let index = qUserDB.subscribed.findIndex(s => s.id === qSuggestionDB.suggestionId);
		qUserDB.subscribed.splice(index, 1);
		qUserDB.save();
		return message.channel.send(string(locale, "UNFOLLOW_SUCCESS", { id: qSuggestionDB.suggestionId }, "success"));
	}
};
