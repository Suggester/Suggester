const { dbQueryAll } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { checkVotes } = require("../../utils/actions");
const { baseConfig } = require("../../utils/checks");
const ms = require("ms");
const humanizeDuration = require("humanize-duration");
function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = {
	controls: {
		name: "down",
		permission: 3,
		aliases: ["downvoted", "worst", "lowest"],
		usage: "down (time)",
		description: "Shows the top 10 lowest voted suggestions",
		examples: "`{{p}}down`\nShows the top 10 lowest voted suggestions\n\n`{{p}}down 1w`\nShows the top 10 lowest voted suggestions from the last week",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 60
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);

		let m = await message.channel.send(string(locale, "SUGGESTION_LOADING"));

		let time = (args[0] ? ms(args[0]) : null) || null;
		message.channel.startTyping();

		let listArray = [];
		let embedArray = [];
		let approvedSuggestions = await dbQueryAll("Suggestion", { status: "approved", implemented: false, id: message.guild.id });

		if (approvedSuggestions.length > 40) await m.edit(`${m.content}\n${string(locale, "TOP_ESTIMATED_TIME", { time: humanizeDuration(2500*approvedSuggestions.length, { language: locale, fallbacks: ["en"] }) })}`);

		for await (let suggestion of approvedSuggestions) {
			if (time && new Date(suggestion.submitted).getTime()+time < Date.now()) continue;
			await client.channels.cache.get(suggestion.channels.suggestions || qServerDB.config.channels.suggestions).messages.fetch(suggestion.messageId).then(f => {
				let votes = checkVotes(locale, suggestion, f);
				if (votes[2]) listArray.push({
					suggestion,
					opinion: votes[2]
				});
			}).catch(() => {});
			if (approvedSuggestions.length > 40) await timeout(2500);
		}
		for await (let i of listArray.filter(i => i.opinion && !isNaN(i.opinion)).sort((a, b) => a.opinion - b.opinion).splice(0, 10)) {
			embedArray.push({
				"fieldTitle": `${string(locale, "SUGGESTION_HEADER")} #${i.suggestion.suggestionId.toString()} (${string(locale, "SUGGESTION_VOTES")} ${i.opinion})`,
				"fieldDescription": `[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${i.suggestion.id}/${qServerDB.config.channels.suggestions}/${i.suggestion.messageId})`
			});
		}
		if (!embedArray[0]) return message.channel.send(string(locale, "NO_SUGGESTIONS_FOUND", {}, "error"));

		let embed = new Discord.MessageEmbed()
			.setTitle(string(locale, "DOWN_TITLE"))
			.setColor(client.colors.red);
		if (time) embed.setDescription(string(locale, "TOP_TIME_INFO", { time: humanizeDuration(time, { language: locale, fallbacks: ["en"] }) }));
		embedArray.forEach(f => embed.addField(f.fieldTitle, f.fieldDescription));
		message.channel.stopTyping(true);
		return m.edit("", embed);
	}
};
