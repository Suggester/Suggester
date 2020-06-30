const { colors } = require("../../config.json");
const { dbQueryAll } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { pages } = require("../../utils/actions");
const { baseConfig } = require("../../utils/checks");
module.exports = {
	controls: {
		name: "listqueue",
		permission: 3,
		aliases: ["queue", "showqueue"],
		usage: "listqueue",
		description: "Shows the queue of suggestions awaiting review",
		image: "images/Listqueue.gif",
		enabled: true,
		docs: "staff/listqueue",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 25
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild.id);
		if (returned) return message.channel.send(returned);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string(locale, "MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error"));

		let listarray = [];
		let queuedSuggestions = await dbQueryAll("Suggestion", { status: "awaiting_review", id: message.guild.id });
		queuedSuggestions.forEach(suggestion => {
			listarray.push({
				"fieldTitle": `${string(locale, "SUGGESTION_HEADER")} #${suggestion.suggestionId.toString()}`,
				"fieldDescription": `[${string(locale, "QUEUE_POST_LINK")}](https://discordapp.com/channels/${suggestion.id}/${qServerDB.config.channels.staff}/${suggestion.reviewMessage})`
			});
		});
		if (!listarray[0]) return message.channel.send(string(locale, "NONE_AWAITING_REVIEW", {}, "success"));

		let chunks = listarray.chunk(10);
		let embeds = [];
		for await (let chunk of chunks) {
			let embed = new Discord.MessageEmbed()
				.setColor(colors.yellow)
				.setTitle(string(locale, "PENDING_REVIEW_HEADER"));
			chunk.forEach(smallchunk => {
				embed.addField(smallchunk.fieldTitle, smallchunk.fieldDescription);
			});
			if (chunks.length > 1) embed.setFooter(string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS"))
				.setAuthor(string(locale, "PAGINATION_PAGE_COUNT"));
			embeds.push(embed);
		}

		return pages(locale, message, embeds);
	}
};
