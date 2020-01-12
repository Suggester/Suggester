const config = require("../config.json");
const core = require("../coreFunctions.js");
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
	do: (message, client, args, Discord) => {
		if (client.servers.get(message.guild.id, "mode") === "autoapprove") return message.channel.send(`<:${config.emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

		var missingConfigs = [];
		if (!client.servers.get(message.guild.id)) return message.channel.send(`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`);
		if (!client.servers.get(message.guild.id, "admin_roles") || client.servers.get(message.guild.id, "admin_roles").length < 1) missingConfigs.push("Server Admin Roles");
		if (!client.servers.get(message.guild.id, "staff_roles") || client.servers.get(message.guild.id, "staff_roles").length < 1) missingConfigs.push("Server Staff Roles");
		if (!client.servers.get(message.guild.id, "channels.suggestions") || !client.channels.get(client.servers.get(message.guild.id, "channels.suggestions"))) missingConfigs.push("Approved Suggestions Channel");
		if (client.servers.get(message.guild.id, "mode") === "review" && (!client.servers.get(message.guild.id, "channels.staff") || !client.channels.get(client.servers.get(message.guild.id, "channels.staff")))) missingConfigs.push("Suggestion Review Channel");

		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${client.servers.get(message.guild.id, "prefix")}config\` command.`)
				.addField("Missing Elements", `<:${config.emoji.x}> ${missingConfigs.join(`\n<:${config.emoji.x}> `)}`)
				.setColor("#e74c3c");
			return message.channel.send(embed);
		}
		var listarray = [];
		client.suggestions.filter(s => s.guild == message.guild.id).array().forEach(suggestion => {
			var id = suggestion.id;
			if (suggestion.status === "awaiting_review") {
				listarray.push({
					"fieldTitle": `Suggestion #${id.toString()}`,
					"fieldDescription": `[Queue Post](https://discordapp.com/channels/${suggestion.guild}/${client.servers.get(suggestion.guild, "channels.staff")}/${suggestion.reviewMessage})`
				});
			}
		});
		if (!listarray[0]) {
			return message.channel.send("There are no suggestions awaiting approval!");
		} else {
			if (listarray.length <= 25) {
				let embed = new Discord.RichEmbed();
				embed.setTitle("Suggestions Pending Review");
				listarray.forEach(piece => {
					embed.addField(piece.fieldTitle, piece.fieldDescription);
				});
				embed.setColor("#f1c40f");
				return message.channel.send(embed);
			} else if (listarray.length <= 50) {
				let embed = new Discord.RichEmbed();
				let embed2 = new Discord.RichEmbed();
				embed.setTitle("Suggestions Pending Review");
				embed2.setTitle("Suggestions Pending Review (continued)");
				var count = 0;
				listarray.forEach(piece => {
					if (count < 25) {
						embed.addField(piece.fieldTitle, piece.fieldDescription);
					} else if (count < 50) {
						embed2.addField(piece.fieldTitle, piece.fieldDescription);
					}
					count++;
				});
				embed.setColor("#f1c40f");
				embed2.setColor("#f1c40f");
				message.channel.send(embed).then(m => message.channel.send(embed2));
			} else {
				let embed = new Discord.RichEmbed();
				let embed2 = new Discord.RichEmbed();
				embed.setTitle("Suggestions Pending Review");
				embed2.setTitle("Suggestions Pending Review (continued)");
				var count = 0;
				var notShown = 0;
				listarray.forEach(piece => {
					if (count < 25) {
						embed.addField(piece.fieldTitle, piece.fieldDescription);
					} else if (count < 49) {
						embed2.addField(piece.fieldTitle, piece.fieldDescription);
					} else {
						notShown++;
					}
					count++;
				});
				embed.setColor("#f1c40f");
				embed2.setColor("#f1c40f");
				if (notShown > 0) embed.addField("List Truncated", `There are ${notShown.toString()} other suggestions awaiting review. Only 50 are shown on this list.`);
				message.channel.send(embed).then(m => message.channel.send(embed2));
			}

		}
	}
};
