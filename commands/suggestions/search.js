const { baseConfig } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { dbQueryAll } = require("../../utils/db");
const { pages } = require("../../utils/actions");
const timestring = require("timestring");
module.exports = {
	controls: {
		name: "search",
		permission: 3,
		usage: "search [query]",
		aliases: ["details", "suggestion"],
		description: "Searches suggestions on this server",
		image: "images/Info.gif",
		enabled: true,
		examples: "`{{p}}info 1`\nShows information about suggestion #1",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		docs: "staff/info"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);

		function escapeRegExp(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
		}

		function handleSymbol (value, voteArr) {
			switch (voteArr[0]) {
			case ">":
				return value > voteArr[1];
			case "<":
				return value < voteArr[1];
			case ":":
				return value === voteArr[1];
			case "!":
				return value !== voteArr[1];
			}
		}

		function handleQuoteInput (input) {
			console.log(input);
			input = input.toLowerCase();
			return input.match(/['"“”‘’„”«»]?([\s\S]+)['"“”‘’„”«»]/) ? input.match(/['"“”‘’„”«»]?([\s\S]+)['"“”‘’„”«»]/)[1] : input;
		}

		let qString = args.join(" ").match(/(status|mark|votes|author|staff|time|content)(>|<|!|:)("[^"]+"|[\S]+)/g);
		if (!qString || !qString.length) return message.channel.send(string(locale, "SEARCH_BAD_QUERY_ERROR", {}, "error"));
		let m = await message.channel.send(string(locale, "SUGGESTION_LOADING"));
		let query = { id: message.guild.id };
		let voteQuery = [];
		let timeQuery = [];
		for (let q of qString) {
			q = q.match(/(status|mark|votes|author|staff|time|content)(>|<|!|:)("[^"]+"|[\S]+)/);
			switch (q[1].toLowerCase()) {
			case "status":
				// eslint-disable-next-line no-case-declarations
				let status;
				switch (handleQuoteInput(q[3])) {
				case "approved":
					status = "approved";
					break;
				case "denied":
				case "deleted":
					status = "denied";
					break;
				case "awaiting_review":
				case "review":
				case "awaiting review":
					status = "awaiting_review";
					break;
				}
				if (status) query["status"] = q[2] !== "!" ? status : { $not: status };
				break;
			case "mark":
				// eslint-disable-next-line no-case-declarations
				let mark;
				switch (handleQuoteInput(q[3])) {
				case "implemented":
				case "done":
					mark = "implemented";
					break;
				case "working":
				case "progress":
				case "inprogress":
				case "in progress":
					mark = "working";
					break;
				case "consideration":
				case "consider":
				case "considered":
				case "inconsideration":
				case "in consideration":
					mark = "consideration";
					break;
				case "no":
				case "not":
				case "nothappening":
				case "not happening":
					mark = "no";
					break;
				case "none":
				case "reset":
				case "default":
					mark = null;
				}
				query["displayStatus"] = q[2] !== "!" ? mark : { $not: mark };
				break;
			case "votes":
				// eslint-disable-next-line no-case-declarations
				let votes = parseInt(handleQuoteInput(q[3]));
				if (votes || votes === 0) voteQuery = [q[2], votes];
				break;
			case "author":
				query["suggester"] = q[2] !== "!" ? handleQuoteInput(q[3]) : { $not: handleQuoteInput(q[3]) };
				break;
			case "staff":
				query["staff_member"] = q[2] !== "!" ? handleQuoteInput(q[3]) : { $not: handleQuoteInput(q[3]) };
				break;
			case "time":
				let time = (handleQuoteInput(q[3]) ? timestring(handleQuoteInput(q[3]), "ms") : null) || null;
				if (time) timeQuery = [q[2], time];
				//time && new Date(suggestion.submitted).getTime()+time < Date.now()
				break;
			case "content":
				query["suggestion"] = q[2] !== "!" ? { "$regex": escapeRegExp(handleQuoteInput(q[3])) } : { $not: { "$regex": escapeRegExp(handleQuoteInput(q[3])) } };
				break;
			}
		}
		let suggestions = await dbQueryAll("Suggestion", query);
		if (voteQuery[0]) suggestions = suggestions.filter(s => s.status === "approved" && handleSymbol(s.votes.up - s.votes.down, voteQuery));
		if (timeQuery[0]) suggestions = suggestions.filter(s => handleSymbol(Date.now()-new Date(s.submitted).getTime(), timeQuery))
		if (!suggestions.length) return message.channel.send(string(locale, "NO_SUGGESTIONS_FOUND", {}, "error"));
		let embedArray = [];
		let index = 1;
		for await (let i of suggestions) {
			let description;
			switch (i.status) {
			case "approved":
				description = i.implemented ? string(locale, "NO_LINK_SEARCH", { p: qServerDB.config.prefix, id: i.suggestionId }) : `[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${i.id}/${i.channels.suggestions || qServerDB.config.channels.suggestions}/${i.messageId})`;
				break;
			case "denied":
				description = string(locale, "NO_LINK_SEARCH", { p: qServerDB.config.prefix, id: i.suggestionId });
				break;
			case "awaiting_review":
				description = `[${string(locale, "QUEUE_POST_LINK")}](https://discord.com/channels/${i.id}/${i.channels.staff || qServerDB.config.channels.staff}/${i.reviewMessage})`;
				break;
			}
			embedArray.push({
				"fieldTitle": `${index}: ${string(locale, "SUGGESTION_HEADER")} #${i.suggestionId.toString()}`,
				"fieldDescription": description,
				index
			});
			index++;
		}

		let chunks = embedArray.chunk(10);
		let embeds = [];
		for await (let chunk of chunks) {
			let embed = new Discord.MessageEmbed()
				.setTitle(string(locale, "PENDING_REVIEW_HEADER_NUM", { min: chunk[0].index, max: chunk[chunk.length-1].index, total: embedArray.length }))
				.setColor(client.colors.blue)
				.setAuthor(chunks.length > 1 ? string(locale, "PAGINATION_PAGE_COUNT") : "")
				.setFooter(chunks.length > 1 ? string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS") : "");
			chunk.forEach(f => embed.addField(f.fieldTitle, f.fieldDescription));
			embeds.push(embed);
		}
		message.channel.stopTyping(true);
		m.delete();
		return pages(locale, message, embeds);
	}
};
