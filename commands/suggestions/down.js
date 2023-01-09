const { dbQueryAll } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { checkVotes, pages } = require("../../utils/actions");
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
		description: "Shows the top 20 lowest voted suggestions",
		examples: "`{{p}}down`\nShows the top 20 lowest voted suggestions\n\n`{{p}}down 1w`\nShows the top 20 lowest voted suggestions from the last week",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 60,
		docs: "staff/top-n-down"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);

		let m = await message.channel.send(string(locale, "SUGGESTION_LOADING"));

		let time = (args[0] ? ms(args[0]) : null) || null;
		client.topInProgress = true;
		message.channel.startTyping();

		let listArray = [];
		let embedArray = [];
		let approvedSuggestions = await dbQueryAll("Suggestion", { status: "approved", implemented: false, id: message.guild.id });

		for await (let suggestion of approvedSuggestions) {
			if (time && new Date(suggestion.submitted).getTime()+time < Date.now()) continue;
			if (!suggestion.votes.up && !suggestion.votes.down && !suggestion.votes.cached) {
				await client.channels.cache.get(suggestion.channels.suggestions || qServerDB.config.channels.suggestions).messages.fetch(suggestion.messageId).then(f => {
					let votes = checkVotes(locale, suggestion, f);
					if (votes[2]) {
						listArray.push({
							suggestion,
							opinion: votes[2]
						});
					}
					if (votes[0]) suggestion.votes.up = votes[0];
					if (votes[1]) suggestion.votes.down = votes[1];
					if ((votes[0] || votes[0] === 0) || (votes[1] || votes[1] === 0)) {
						suggestion.votes.cached = true;
						suggestion.save();
					}
				}).catch(() => {});
				await timeout(750);
			} else {
				if (!suggestion.votes.cached) {
					suggestion.votes.cached = true;
					suggestion.save();
				}
				listArray.push({
					suggestion,
					opinion: suggestion.votes.up-suggestion.votes.down
				});
			}
		}
		let index = 1;
		for await (let i of listArray.filter(i => i.opinion && !isNaN(i.opinion)).sort((a, b) => a.opinion - b.opinion).splice(0, qServerDB.flags.includes("LARGE") ? 50 : 20)) {
			embedArray.push({
				"fieldTitle": `${string(locale, "SUGGESTION_HEADER")} #${i.suggestion.suggestionId.toString()} (${string(locale, "SUGGESTION_VOTES")} ${i.opinion})`,
				"fieldDescription": `[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${i.suggestion.id}/${qServerDB.config.channels.suggestions}/${i.suggestion.messageId})`,
				index
			});
			index++;
		}
		if (!embedArray[0]) {
			client.topInProgress = false;
			message.channel.stopTyping(true);
			return message.channel.send(string(locale, "NO_SUGGESTIONS_FOUND", {}, "error"));
		}

		if (!qServerDB.flags.includes("LARGE") && !qServerDB.flags.includes("MORE_TOP")) {
			let embed = new Discord.MessageEmbed()
				.setTitle(string(locale, "DOWN_TITLE_NEW", { number: embedArray.length, min: 1, max: embedArray[embedArray.length-1].index }))
				.setColor(client.colors.red);
			if (time) embed.setDescription(string(locale, "TOP_TIME_INFO", {
				time: humanizeDuration(time, {
					language: locale,
					fallbacks: ["en"]
				})
			}));
			embedArray.forEach(f => embed.addField(f.fieldTitle, f.fieldDescription));
			client.topInProgress = false;
			message.channel.stopTyping(true);
			return m.edit("", embed);
		} else {
			let chunks = embedArray.chunk(20);
			let embeds = [];
			for await (let chunk of chunks) {
				let embed = new Discord.MessageEmbed()
					.setTitle(string(locale, "DOWN_TITLE_NEW", { number: embedArray.length, min: chunk[0].index, max: chunk[chunk.length-1].index }))
					.setColor(client.colors.red)
					.setAuthor(chunks.length > 1 ? string(locale, "PAGINATION_PAGE_COUNT") : "")
					.setFooter(chunks.length > 1 ? string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS") : "");
				if (time) embed.setDescription(string(locale, "TOP_TIME_INFO", {
					time: humanizeDuration(time, {
						language: locale,
						fallbacks: ["en"]
					})
				}));
				chunk.forEach(f => embed.addField(f.fieldTitle, f.fieldDescription));
				embeds.push(embed);
			}
			client.topInProgress = false;
			message.channel.stopTyping(true);
			pages(locale, message, embeds);
			return m.delete();
		}
	}
};
