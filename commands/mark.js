const core = require("../coreFunctions.js");
const config = require("../config.json");
module.exports = {
	controls: {
		permission: 3,
		aliases: ["status"],
		usage: "mark <suggestion id> <status>",
		description: "Marks a status for a suggestion",
		enabled: true,
		docs: "staff/mark",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {
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

		if (client.channels.get(client.servers.get(message.guild.id, "channels.suggestions"))) {
			var perms = core.channelPermissions(client.channels.get(client.servers.get(message.guild.id, "channels.suggestions")).memberPermissions(client.user.id), "suggestions", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${client.servers.get(message.guild.id, "channels.suggestions")}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${client.servers.get(message.guild.id, "channels.suggestions")}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${config.emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestion channel.`);
		}

		if (!args[0] || !client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id)) return message.channel.send(`<:${config.emoji.x}> Please provide a valid suggestion id!`);

		var suggestion = client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id);
		var id = suggestion.id.toString();

		if (suggestion.status !== "approved") return message.channel.send(`<:${config.emoji.x}> Statuses can only be marked on approved suggestions!`);
		if (!args[1]) return message.channel.send(`<:${config.emoji.x}> Please provide a valid status.`);
		var statusArr = [];
		switch (args[1].toLowerCase()) {
		case "implemented":
		case "done":
			if (client.suggestions.get(id, "display_status") && "implemented" === client.suggestions.get(id, "display_status")) return message.channel.send(`<:${config.emoji.x}> This suggestion is already marked as implemented.`);
			client.suggestions.set(id, "implemented", "display_status");
			statusArr = ["#2ecc71", "Implemented"];
			break;
		case "working":
		case "progress":
			if (client.suggestions.get(id, "display_status") && "working" === client.suggestions.get(id, "display_status")) return message.channel.send(`<:${config.emoji.x}> This suggestion is already marked as in progress.`);
			client.suggestions.set(id, "working", "display_status");
			statusArr = ["#e67e22", "In Progress"];
			break;
		case "no":
			if (client.suggestions.get(id, "display_status") && "no" === client.suggestions.get(id, "display_status")) return message.channel.send(`<:${config.emoji.x}> This suggestion is already marked as not happening.`);
			client.suggestions.set(id, "no", "display_status");
			statusArr = ["#979c9f", "Not Happening"];
			break;
		case "default":
		case "none":
			if (!client.suggestions.get(id, "display_status") || "default" === client.suggestions.get(id, "display_status")) return message.channel.send(`<:${config.emoji.x}> This suggestion already has the default status.`);
			client.suggestions.set(id, "default", "display_status");
			statusArr = [config.default_color];
			break;
		default:
			return message.channel.send(`<:${config.emoji.x}> Please provide a valid status.`);
		}

		var suggester;
		if (client.users.get(client.suggestions.get(id, "suggester"))) {
			suggester = client.users.get(client.suggestions.get(id, "suggester"));
		} else {
			var found = false;
			var sent = false;
			client.fetchUser(client.users.get(client.suggestions.get(id, "suggester")), true).then(user => {
				suggester = user;
				found = true;
			}).catch(notFound => {
				found = false;
				sent = true;
				return message.channel.send(`${config.emoji.x} The suggesting user could not be fetched, please try again. If the issue persists, please contact our support team.`);
			});

			if (!suggester && !found && !sent) return message.channel.send(`${config.emoji.x} The suggesting user could not be fetched, please try again. If the issue persists, please contact our support team.`);

		}

		client.channels.get(client.servers.get(suggestion.guild, "channels.suggestions")).fetchMessage(suggestion.messageid).then(f => f.edit(core.suggestionEmbed(client.suggestions.get(id), client)));

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Status Edited")
			.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`)
			.setColor(statusArr[0])
			.setFooter(`Suggestion ID: ${id.toString()}`);
		statusArr[1] ? replyEmbed.addField("Status", statusArr[1]) : replyEmbed.addField("Status", "Default");
		message.channel.send(replyEmbed);

		if (statusArr[1]) {
			if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") == true) {
				let dmEmbed = new Discord.RichEmbed()
					.setTitle("The status of your suggestion has been edited!")
					.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`)
					.addField("Status", statusArr[1])
					.setColor(statusArr[0])
					.setFooter(`Suggestion ID: ${id.toString()}`);
				suggester.send(dmEmbed);
			}
		}

		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} set a status for #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", suggestion.suggestion)
				.setColor(statusArr[0])
				.setFooter(`Suggestion ID: ${id.toString()} | Staff Member ID: ${message.author.id}`)
				.setTimestamp();
			statusArr[1] ? logEmbed.addField("New Status", statusArr[1]) : logEmbed.addField("New Status", "Default");
			core.serverLog(logEmbed, message.guild.id, client);
		}

	}
};
