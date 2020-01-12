const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "delete <suggestion id> (reason)",
		description: "Deletes a suggestion",
		enabled: true,
		docs: "staff/delete",
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

		if (client.servers.get(message.guild.id, "channels.denied")) {
			if (client.channels.get(client.servers.get(message.guild.id, "channels.denied"))) {
				var perms = core.channelPermissions(client.channels.get(client.servers.get(message.guild.id, "channels.denied")).memberPermissions(client.user.id), "denied", client);
				if (perms.length > 0) {
					let embed = new Discord.RichEmbed()
						.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${client.servers.get(message.guild.id, "channels.denied")}> channel:`)
						.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
						.addField("How to Fix", `In the channel settings for <#${client.servers.get(message.guild.id, "channels.denied")}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
						.setColor("#e74c3c");
					return message.channel.send(embed);
				}
			} else {
				return message.channel.send(`<:${config.emoji.x}> Could not find your denied suggestions channel, even though there is one set!`);
			}
		}
		if (!args[0] || !client.suggestions.find(s => s.id.toString() === args[0] && s.guild === message.guild.id)) return message.channel.send(`<:${config.emoji.x}> Please provide a valid suggestion id!`);

		var suggestion = client.suggestions.find(s => s.id.toString() === args[0] && s.guild === message.guild.id);
		var id = suggestion.id;

		if (suggestion.reviewMessage && client.channels.get(client.servers.get(message.guild.id, "channels.staff"))) {
			if (client.channels.get(client.servers.get(message.guild.id, "channels.staff"))) {
				var perms = core.channelPermissions(client.channels.get(client.servers.get(message.guild.id, "channels.staff")).memberPermissions(client.user.id), "staff", client);
				if (perms.length > 0) {
					let embed = new Discord.RichEmbed()
						.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${client.servers.get(message.guild.id, "channels.staff")}> channel:`)
						.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
						.addField("How to Fix", `In the channel settings for <#${client.servers.get(message.guild.id, "channels.staff")}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
						.setColor("#e74c3c");
					return message.channel.send(embed);
				}
			} else {
				return message.channel.send(`<:${config.emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
			}
		}

		if (suggestion.status !== "approved") return message.channel.send(`<:${config.emoji.x}> Only approved suggestions can be deleted!`);

		client.suggestions.set(id, "denied", "status");
		client.suggestions.set(id, message.author.id, "staff_member");

		if (args[1]) {
			var reason = args.splice(1).join(" ");
			client.suggestions.set(id, reason, "denial_reason");
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

		client.channels.get(client.servers.get(message.guild.id, "channels.suggestions")).fetchMessage(suggestion.messageid).then(m => m.delete()).catch(e => {});

		let replyEmbed = new Discord.RichEmbed()
			.setAuthor(`Suggestion from ${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
			.setFooter(`Deleted by ${message.author.tag}`, message.author.displayAvatarURL)
			.setDescription(client.suggestions.get(id, "suggestion"))
			.setColor("#e74c3c");
		if (reason) {
			replyEmbed.addField("Reason Given", reason);
		}
		message.channel.send(replyEmbed);

		if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") == true) {
			let dmEmbed = new Discord.RichEmbed()
				.setTitle("Your Suggestion Was Deleted")
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setDescription(suggestion.suggestion)
				.setColor("#e74c3c");
			reason ? dmEmbed.addField("Reason Given", reason) : "";
			suggester.send(dmEmbed).catch((err) => console.log(err));
		}

		if (suggestion.reviewMessage && client.channels.get(client.servers.get(message.guild.id, "channels.staff"))) {
			let updateEmbed = new Discord.RichEmbed()
				.setTitle(`Suggestion Awaiting Review (#${id.toString()})`)
				.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
				.setDescription(suggestion.suggestion)
				.setColor("#e74c3c")
				.addField("A change was processed on this suggestion", "This suggestion has been deleted");
			client.channels.get(client.servers.get(message.guild.id, "channels.staff")).fetchMessage(client.suggestions.get(id, "reviewMessage")).then(fetched => fetched.edit(updateEmbed));
		}

		if (client.servers.get(suggestion.guild, "channels.denied")) {
			let deniedEmbed = new Discord.RichEmbed()
				.setTitle("Suggestion Deleted")
				.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
				.setThumbnail(suggester.displayAvatarURL)
				.setDescription(suggestion.suggestion)
				.setFooter(`Suggestion ID: ${id.toString()}`)
				.setColor("#e74c3c");
			reason ? deniedEmbed.addField("Reason Given:", reason) : "";
			client.channels.get(client.servers.get(suggestion.guild, "channels.denied")).send(deniedEmbed);
		}

		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} deleted #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", suggestion.suggestion)
				.setFooter(`Suggestion ID: ${id.toString()} | Deleter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor("#e74c3c");
			reason ? logEmbed.addField("Deletion Reason", reason) : "";
			core.serverLog(logEmbed, message.guild.id, client);
		}

	}
};
