const { prefix, colors, emoji } = require("../config.json");
const { dbQueryAll, dbQuery } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		aliases: ["queue", "showqueue"],
		usage: "listqueue",
		description: "Shows the queue of suggestions awaiting review",
		enabled: true,
		docs: "staff/listqueue",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let missingConfigs = [];
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(`<:${emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

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
		let listarray = [];
		let queuedSuggestions = await dbQueryAll("Suggestion", { status: "awaiting_review", id: message.guild.id });
		queuedSuggestions.forEach(suggestion => {
			listarray.push({
				"fieldTitle": `Suggestion #${suggestion.suggestionId.toString()}`,
				"fieldDescription": `[Queue Post](https://discordapp.com/channels/${suggestion.id}/${qServerDB.config.channels.staff}/${suggestion.reviewMessage})`
			});
		});
		if (!listarray[0]) {
			return message.channel.send("There are no suggestions awaiting approval!");
		} else {
			if (listarray.length <= 25) {
				let embed = new Discord.RichEmbed()
					.setTitle("Suggestions Pending Review");
				listarray.forEach(suggestion => {
					embed.addField(suggestion.fieldTitle, suggestion.fieldDescription);
				});
				embed.setColor(colors.yellow);
				return message.channel.send(embed);
			} else if (listarray.length <= 50) {
				let embed = new Discord.RichEmbed()
					.setColor(colors.yellow)
					.setTitle("Suggestions Pending Review");
				let embed2 = new Discord.RichEmbed()
					.setColor(colors.yellow)
					.setTitle("Suggestions Pending Review (continued)");

				let count = 0;
				listarray.forEach(suggestion => {
					if (count < 25) {
						embed.addField(suggestion.fieldTitle, suggestion.fieldDescription);
					} else if (count < 50) {
						embed2.addField(suggestion.fieldTitle, suggestion.fieldDescription);
					}
					count++;
				});
				message.channel.send(embed).then(m => message.channel.send(embed2));
			} else {
				let embed = new Discord.RichEmbed()
					.setColor(colors.yellow)
					.setTitle("Suggestions Pending Review");
				let embed2 = new Discord.RichEmbed()
					.setColor(colors.yellow)
					.setTitle("Suggestions Pending Review (continued)");

				let count = 0;
				let notShown = 0;
				listarray.forEach(suggestion => {
					if (count < 25) {
						embed.addField(suggestion.fieldTitle, suggestion.fieldDescription);
					} else if (count < 49) {
						embed2.addField(suggestion.fieldTitle, suggestion.fieldDescription);
					} else {
						notShown++;
					}
					count++;
				});

				if (notShown > 0) embed2.addField("List Truncated", `There are ${notShown.toString()} other suggestions awaiting review. Only 49 are shown on this list.`);
				message.channel.send(embed).then(m => message.channel.send(embed2));
			}

		}
	}
};
