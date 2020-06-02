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
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return message.channel.send(returned);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string("MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error"));

		let listarray = [];
		let queuedSuggestions = await dbQueryAll("Suggestion", { status: "awaiting_review", id: message.guild.id });
		queuedSuggestions.forEach(suggestion => {
			listarray.push({
				"fieldTitle": `${string("SUGGESTION_HEADER")} #${suggestion.suggestionId.toString()}`,
				"fieldDescription": `[${string("QUEUE_POST_LINK")}](https://discordapp.com/channels/${suggestion.id}/${qServerDB.config.channels.staff}/${suggestion.reviewMessage})`
			});
		});
		if (!listarray[0]) return message.channel.send(string("NONE_AWAITING_REVIEW", {}, "success"));

		let chunks = listarray.chunk(10);
		let embeds = [];
		for await (let chunk of chunks) {
			let embed = new Discord.MessageEmbed()
				.setColor(colors.yellow)
				.setTitle(string("PENDING_REVIEW_HEADER"));
			chunk.forEach(smallchunk => {
				embed.addField(smallchunk.fieldTitle, smallchunk.fieldDescription);
			});
			embeds.push(embed);
		}

		return pages(message, embeds);
	}
};
