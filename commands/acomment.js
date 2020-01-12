const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		aliases: ["anonymouscomment"],
		usage: "acomment <suggestion id> <comment>",
		description: "Adds a comment to an approved suggestion anonymously",
		enabled: true,
		docs: "staff/acomment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {

		let missingConfigs = [];
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
			let perms = core.channelPermissions(client.channels.get(client.servers.get(message.guild.id, "channels.suggestions")).memberPermissions(client.user.id), "suggestions", client);
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

		if (!args[0] || !client.suggestions.find(s => s.id.toString() === args[0] && s.guild === message.guild.id)) return message.channel.send(`<:${config.emoji.x}> Please provide a valid suggestion id!`);

		let suggestion = client.suggestions.find(s => s.id.toString() === args[0] && s.guild === message.guild.id);
		let id = suggestion.id.toString();

		if (suggestion.status !== "approved") return message.channel.send(`<:${config.emoji.x}> Comments can only be added to approved suggestions!`);

		if (!args[1]) return message.channel.send(`<:${config.emoji.x}> Please provide a comment!`);

		if (suggestion.comments && suggestion.comments.filter(c => !c.deleted).length + 1 > 23) return message.channel.send(`<:${config.emoji.x}> Suggestions can only have up to 23 comments.`);

		let comment = args.splice(1).join(" ");

		if (!client.suggestions.get(id, "comments")) client.suggestions.set(id, [], "comments");

		client.suggestions.push(id, {
			"comment": comment,
			"author": 0,
			"id": client.suggestions.get(id, "comments").length + 1
		}, "comments");

		let suggester;
		if (client.users.get(client.suggestions.get(id, "suggester"))) {
			suggester = client.users.get(client.suggestions.get(id, "suggester"));
		} else {
			let found = false;
			let sent = false;
			client.fetchUser(client.users.get(client.suggestions.get(id, "suggester")), true).then(user => {
				suggester = user;
				found = true;
			}).catch(() => {
				found = false;
				sent = true;
				return message.channel.send(`${config.emoji.x} The suggesting user could not be fetched, please try again. If the issue persists, please contact our support team.`);
			});

			if (!suggester && !found && !sent) return message.channel.send(`${config.emoji.x} The suggesting user could not be fetched, please try again. If the issue persists, please contact our support team.`);

		}

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Anonymous Comment Added")
			.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`)
			.addField("Official Comment", comment)
			.setColor("#3498db")
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);

		if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") === true) {
			let dmEmbed = new Discord.RichEmbed()
				.setTitle("A comment was added to your suggestion!")
				.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`)
				.addField("Official Comment", comment)
				.setColor("#3498db")
				.setFooter(`Suggestion ID: ${id.toString()}`);
			suggester.send(dmEmbed);
		}
		client.channels.get(client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")).fetchMessage(client.suggestions.get(id, "messageid")).then(f => f.edit(core.suggestionEmbed(client.suggestions.get(id), client)));

		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} added an anonymous comment to #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", suggestion.suggestion)
				.addField("Comment", comment)
				.setFooter(`Suggestion ID: ${id.toString()} | Commenter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor("#3498db");
			core.serverLog(logEmbed, message.guild.id, client);
		}

	}
};
