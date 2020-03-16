const { colors, emoji, prefix } = require("../../config.json");
const { dbQuery, fetchUser, dbQueryNoNew, checkConfig } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "info",
		permission: 3,
		usage: "info <suggestion id>",
		description: "Shows information about a suggestion",
		enabled: true,
		docs: "staff/info",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion id!`);

		let id = qSuggestionDB.suggestionId;

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		let embed = new Discord.MessageEmbed()
			.setTitle(`Suggestion Info: #${id.toString()}`)
			.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion)
			.addField("Author", `${suggester.tag} (${suggester.id})`)
			.setColor(colors.blue);
		if (qSuggestionDB.comments && qSuggestionDB.comments.length > 0) {
			if (qSuggestionDB.comments.filter(c => c.deleted).length > 0) {
				embed.addField("Comment Count", `${qSuggestionDB.comments.filter(c => !c.deleted).length} (+${qSuggestionDB.comments.filter(c => c.deleted).length} deleted)`);
			} else {
				embed.addField("Comment Count", `${qSuggestionDB.comments.filter(c => !c.deleted).length}`);
			}
		}
		switch (qSuggestionDB.status) {
		case "awaiting_review":
			embed.setColor(colors.yellow)
				.addField("Internal Status", `Awaiting Staff Review ([Queue Post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.staff}/${qSuggestionDB.reviewMessage}))`);
			break;
		case "denied": {
			let denier = await fetchUser(qSuggestionDB.staff_member, client);
			embed.setColor(colors.red)
				.addField("Internal Status", `Denied by ${denier.tag} (${denier.id})`);
			if (qSuggestionDB.denial_reason) {
				embed.addField("Denial Reason", qSuggestionDB.denial_reason);
			}
			break;
		}
		case "approved": {
			if (qSuggestionDB.displayStatus) {
				let statusArr = [];
				switch (qSuggestionDB.displayStatus) {
				case "implemented":
					statusArr = [colors.green, "Implemented"];
					break;
				case "working":
					statusArr = [colors.orange, "In Progress"];
					break;
				case "no":
					statusArr = [colors.gray, "Not Happening"];
					break;
				}
				if (statusArr[0]) {
					embed.addField("Public Status", statusArr[1])
						.setColor(statusArr[0]);
				}
			}

			let approver = await fetchUser(qSuggestionDB.staff_member, client);
			embed.addField("Internal Status", `Approved by ${approver.tag} (${approver.id})`);

			let upCount = "Unknown";
			let downCount = "Unknown";
			let messageFetched;
			await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
				if (qSuggestionDB.emojis.up !== "none" && f.reactions.cache.get(qSuggestionDB.emojis.up)) {
					f.reactions.cache.get(qSuggestionDB.emojis.up).me ? upCount = f.reactions.cache.get(qSuggestionDB.emojis.up).count-1 : upCount = f.reactions.cache.get(qSuggestionDB.emojis.up);
				}
				if (qSuggestionDB.emojis.down !== "none" && f.reactions.cache.get(qSuggestionDB.emojis.down)) {
					f.reactions.cache.get(qSuggestionDB.emojis.down).me ? downCount = f.reactions.cache.get(qSuggestionDB.emojis.down).count-1 : downCount = f.reactions.cache.get(qSuggestionDB.emojis.down);
				}
				messageFetched = true;
			}).catch(() => messageFetched = false);

			if (!messageFetched) return message.channel.send(`<:${emoji.x}> There was an error fetching the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

			if (!isNaN(upCount) && !isNaN(downCount)) {
				let opinion = upCount - downCount;
				opinion > 0 ? embed.addField("Votes Opinion", `+${opinion.toString()}`) : embed.addField("Votes Opinion", opinion.toString());
				embed.addField("Upvotes", upCount.toString(), true)
					.addField("Downvotes", downCount.toString(), true);
			}
			embed.addField("Suggestions Feed Post", `[Jump to post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`);
			break;
		}
		}

		message.channel.send(embed);

	}
};
