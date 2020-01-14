const { emoji, colors, prefix } = require("../config.json");
const { dbQuery, channelPermissions, serverLog, fetchUser, dbModify, suggestionEmbed } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "comment <suggestion id> <comment>",
		description: "Adds a comment to an approved suggestion",
		enabled: true,
		docs: "staff/comment",
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

		if (client.channels.get(qServerDB.config.channels.suggestions)) {
			let perms = channelPermissions(client.channels.get(qServerDB.config.channels.suggestions).memberPermissions(client.user.id), "suggestions", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${qServerDB.config.channels.suggestions}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${qServerDB.config.channels.suggestions}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestions channel.`);
		}

		if (!args[0] || !client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id)) return message.channel.send(`<:${config.emoji.x}> Please provide a valid suggestion id!`);

		var suggestion = client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id);
		var id = suggestion.id.toString();

		if (suggestion.status !== "approved") return message.channel.send(`<:${config.emoji.x}> Comments can only be added to approved suggestions!`);

		if (!args[1]) return message.channel.send(`<:${config.emoji.x}> Please provide a comment!`);

		if (suggestion.comments && suggestion.comments.filter(c => !c.deleted).length + 1 > 23) return message.channel.send(`<:${config.emoji.x}> Suggestions can only have up to 23 comments.`);

		var comment = args.splice(1).join(" ");

		if (!client.suggestions.get(id, "comments")) client.suggestions.set(id, [], "comments");

		client.suggestions.push(id, {
			"comment": comment,
			"author": message.author.id,
			"id": client.suggestions.get(id, "comments").length + 1
		}, "comments");

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

		let replyEmbed = new Discord.RichEmbed()
			.setTitle("Comment Added")
			.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`)
			.addField(`Official Comment from ${message.author.tag}`, comment)
			.setColor("#3498db")
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);

		if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") == true) {
			let dmEmbed = new Discord.RichEmbed()
				.setTitle("A comment was added to your suggestion!")
				.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`)
				.addField(`Official Comment from ${message.author.tag}`, comment)
				.setColor("#3498db")
				.setFooter(`Suggestion ID: ${id.toString()}`);
			suggester.send(dmEmbed);
		}

		client.channels.get(client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")).fetchMessage(client.suggestions.get(id, "messageid")).then(f => f.edit(core.suggestionEmbed(client.suggestions.get(id), client)));

		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} added a comment to #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", suggestion.suggestion)
				.addField("Comment", comment)
				.setFooter(`Suggestion ID: ${id.toString()} | Commenter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor("#3498db");
			core.serverLog(logEmbed, message.guild.id, client);
		}
	}
};
