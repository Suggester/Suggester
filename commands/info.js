const { colors, emoji, prefix } = require("../config.json");
const { dbQuery, fetchUser, dbQueryNoNew } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "info <suggestion id>",
		description: "Shows information about a suggestion",
		enabled: true,
		docs: "staff/info",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let missingConfigs = [];
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		if (!qServerDB.config.admin_roles ||
			qServerDB.config.admin_roles < 1) {
			missingConfigs.push("Server Admin Roles");
		}
		if (!qServerDB.config.staff_roles ||
			qServerDB.config.staff_roles < 1) {
			missingConfigs.push("Server Staff Roles");
		}
		if (!qServerDB.config.channels.suggestions ||
			qServerDB.config.channels.suggestions < 1) {
			missingConfigs.push("Approved Suggestions Channel");
		}
		if (!qServerDB.config.mode === "review" && !qServerDB.config.channels.staff ||
			!client.channels.get(qServerDB.config.channels.staff)) {
			missingConfigs.push("Suggestion Review Channel");
		}

		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed()
				.setDescription(
					`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${qServerDB.config.prefix}config\` command.`
				)
				.addField(
					"Missing Elements",
					`<:${emoji.x}> ${missingConfigs.join(`\n<:${emoji.x}> `)}`
				)
				.setColor(colors.red);
			return message.channel.send(embed);
		}
		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed();
			embed.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${client.servers.get(message.guild.id, "prefix")}config\` command.`);
			embed.addField("Missing Elements", `<:${config.emoji.x}> ${missingConfigs.join(`\n<:${config.emoji.x}> `)}`);
			embed.setColor("#e74c3c");
			return message.channel.send(embed);
		}

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(`<:${emoji.x}> Please provide a valid suggestion id!`);

		let id = qSuggestionDB.suggestionId;

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(`<:${emoji.x}> The suggesting user could not be fetched! Please try again.`);

		let embed = new Discord.RichEmbed()
			.setTitle(`Suggestion Info: #${id.toString()}`)
			.setThumbnail(suggester.displayAvatarURL)
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
		case "denied":
			let denier = await fetchUser(qSuggestionDB.staff_member, client);
			embed.setColor(colors.red)
				.addField("Internal Status", `Denied by ${denier.tag} (${denier.id})`);
			if (qSuggestionDB.denial_reason) {
				embed.addField("Denial Reason", qSuggestionDB.denial_reason);
			}
			break;
		case "approved":
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
			await client.channels.get(qServerDB.config.channels.suggestions).fetchMessage(qSuggestionDB.messageId).then(f => {
				if (f.reactions.get(qSuggestionDB.emojis.up)) {
					f.reactions.get(qSuggestionDB.emojis.up).me ? upCount = f.reactions.get(qSuggestionDB.emojis.up).count-1 : upCount = f.reactions.get(qSuggestionDB.emojis.up);
				}
				if (f.reactions.get(qSuggestionDB.emojis.down)) {
					f.reactions.get(qSuggestionDB.emojis.down).me ? downCount = f.reactions.get(qSuggestionDB.emojis.down).count-1 : downCount = f.reactions.get(qSuggestionDB.emojis.down);
				}
				messageFetched = true;
			}).catch(err => messageFetched = false);

			if (!messageFetched) return message.channel.send(`<:${emoji.x}> There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.`);

			let opinion = upCount - downCount;
			opinion > 0 ? embed.addField("Votes Opinion", `+${opinion.toString()}`) : embed.addField("Votes Opinion", opinion.toString());
			embed.addField("Upvotes", upCount.toString(), true)
				.addField("Downvotes", downCount.toString(), true)
				.addField("Suggestions Feed Post", `[Jump to post](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`);
			break;
		}

		message.channel.send(embed);

	}
};
