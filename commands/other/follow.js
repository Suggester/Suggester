const { dbQuery, dbModify, dbQueryAll } = require("../../utils/db");
const { checkSuggestion } = require("../../utils/checks");
const { pages } = require("../../utils/actions");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "follow",
		permission: 10,
		aliases: ["subscribe", "sub"],
		usage: "follow [suggestion id|list|auto] (on|off|toggle)",
		description: "Views/edits your following settings",
		enabled: true,
		examples: "`{{p}}follow 123`\nFollows suggestion #123\n\n`{{p}}follow list`\nLists the suggestions you are following\n\n`{{p}}follow auto on`\nEnables following suggestions when you upvote them\n\n`{{p}}notify off`\nDisables following suggestions when you upvote them\n\n`{{p}}notify toggle`\nToggles following suggestions when you upvote them",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "EMBED_LINKS"],
		cooldown: 5,
		dmAvailable: true
	},
	do: async (locale, message, client, args, Discord) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(string(locale, "FOLLOW_NO_PARAMS_ERROR", {}, "error"));
		switch (args[0].toLowerCase()) {
		case "list": {
			let suggestions = await dbQueryAll("Suggestion", { suggestionId: { $in: qUserDB.subscribed.map(s => s.id) } });
			suggestions = suggestions.filter(s => qUserDB.subscribed.find(q => q.id === s.suggestionId && q.guild === s.id));
			let suggestionArr = [];
			for await (let s of suggestions) {
				try {
					let foundApi = await client.api.guilds(s.id).get();
					suggestionArr.push(`#${s.suggestionId} in **${foundApi.name}**`);
					// eslint-disable-next-line no-empty
				} catch (e) {}
			}
			if (suggestionArr.length === 0) return message.channel.send(string(locale, "NONE_FOLLOWED", {}, "error"));
			let chunks = suggestionArr.chunk(20);
			let embeds = [];
			for await (let chunk of chunks) {
				embeds.push(new Discord.MessageEmbed()
					.setDescription(chunk.join("\n"))
					.setColor(client.colors.default)
					.setTitle(string(locale, "FOLLOWING_TITLE"))
					.setAuthor(chunks.length > 1 ? string(locale, "PAGINATION_PAGE_COUNT") : "")
					.setFooter(chunks.length > 1 ? string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS") : ""));
			}

			pages(locale, message, embeds);
			return;
		}
		case "auto":
		case "automatic": {
			if (!args[1]) return message.channel.send(string(locale, qUserDB.auto_subscribe ? "AUTOFOLLOW_ENABLED" : "AUTOFOLLOW_DISABLED"));
			switch (args[1].toLowerCase()) {
			case "enable":
			case "on":
			case "true":
			case "yes": {
				if (qUserDB.auto_subscribe) return message.channel.send(string(locale, "AUTOFOLLOW_ALREADY_ENABLED", {}, "error"));
				qUserDB.auto_subscribe = true;
				await dbModify("User", {id: qUserDB.id}, qUserDB);
				return message.channel.send(string(locale, "AUTOFOLLOW_ENABLED", {}, "success"));
			}
			case "disable":
			case "off":
			case "false":
			case "no": {
				if (!qUserDB.auto_subscribe) return message.channel.send(string(locale, "AUTOFOLLOW_ALREADY_DISABLED", {}, "error"));
				qUserDB.auto_subscribe = false;
				await dbModify("User", {id: qUserDB.id}, qUserDB);
				return message.channel.send(string(locale, "AUTOFOLLOW_DISABLED", {}, "success"));
			}
			case "toggle":
			case "switch": {
				qUserDB.auto_subscribe = !qUserDB.auto_subscribe;
				await dbModify("User", {id: qUserDB.id}, qUserDB);
				return message.channel.send(string(locale, qUserDB.auto_subscribe ? "AUTOFOLLOW_ENABLED" : "AUTOFOLLOW_DISABLED", {}, "success"));
			}
			default:
				return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
			}
		}
		default:
			if (!message.guild) return message.channel.send(string(locale, "COMMAND_SERVER_ONLY", {}, "error"));
			if (!args[0]) return message.channel.send(string(locale, "INVALID_SUGGESTION_ID_ERROR", {}, "error"));
			// eslint-disable-next-line no-case-declarations
			let [fetchSuggestion, qSuggestionDB] = await checkSuggestion(locale, message.guild, args[0]);
			if (fetchSuggestion) return message.channel.send(fetchSuggestion);
			if (qUserDB.subscribed.find(s => s.id === qSuggestionDB.suggestionId)) return message.channel.send(string(locale, "ALREADY_FOLLOWING_ERROR", { id: qSuggestionDB.suggestionId }, "error"));
			qUserDB.subscribed.push({
				id: qSuggestionDB.suggestionId,
				guild: message.guild.id,
				auto: false
			});
			qUserDB.save();
			return message.channel.send(string(locale, "FOLLOW_SUCCESS", { id: qSuggestionDB.suggestionId }, "success"));
		}
	}
};
