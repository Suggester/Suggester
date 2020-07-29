const { dbQueryAll } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { checkVotes } = require("../../utils/actions");
const { baseConfig } = require("../../utils/checks");
module.exports = {
	controls: {
		name: "top",
		permission: 3,
		aliases: ["topvoted"],
		usage: "top",
		description: "Shows the top 10 most highly voted suggestions",
		enabled: true,
		docs: "staff/top",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 60
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);

		let m = await message.channel.send(string(locale, "TOP_LOADING"));
		message.channel.startTyping();

		let listArray = [];
		let embedArray = [];
		let approvedSuggestions = await dbQueryAll("Suggestion", { status: "approved", implemented: false, id: message.guild.id });
		console.log(approvedSuggestions.length);
		for await (let suggestion of approvedSuggestions) {
			await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(suggestion.messageId).then(f => {
				let votes = checkVotes(locale, suggestion, f);
				listArray.push({
					suggestion,
					opinion: votes[2]
				});
			}).catch(() => {});
		}
		console.log(listArray);
		for await (let i of listArray.filter(i => i.opinion && !isNaN(i.opinion)).sort((a, b) => b.opinion - a.opinion).splice(0, 10)) {
			embedArray.push({
				"fieldTitle": `${string(locale, "SUGGESTION_HEADER")} #${i.suggestion.suggestionId.toString()} (${string(locale, "SUGGESTION_VOTES")} ${i.opinion})`,
				"fieldDescription": `[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${i.suggestion.id}/${qServerDB.config.channels.suggestions}/${i.suggestion.messageId})`
			});
		}
		if (!embedArray[0]) return message.channel.send(string(locale, "NO_TOP_FOUND", {}, "error"));

		let embed = new Discord.MessageEmbed()
			.setTitle(string(locale, "TOP_TITLE"))
			.setColor(client.colors.green);
		embedArray.forEach(f => embed.addField(f.fieldTitle, f.fieldDescription));
		message.channel.stopTyping();
		m.edit(embed);
	}
};
