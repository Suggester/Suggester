const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "attach <suggestion id> <attachment link>",
		description: "Attaches a file to an approved suggestion",
		enabled: true,
		docs: "staff/attach",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ATTACH_FILES"]
	},
	do: (message, client, args, Discord) => {

		var missingConfigs = [];
		if (!client.servers.get(message.guild.id)) return message.channel.send(`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`.config\` commands.`);
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

		if (!args[0] || !client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id)) return message.channel.send(`<:${config.emoji.x}> Please provide a valid suggestion id!`);

		var suggestion = client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id);
		var id = suggestion.id.toString();

		if (suggestion.status !== "approved") return message.channel.send(`<:${config.emoji.x}> Attachments can only be added to approved suggestions!`);

		if (suggestion.attachment) return message.channel.send(`<:${config.emoji.x}> Due to Discord embed limitations, suggestions can only have 1 attachment.`);

		if (!args[1] && !message.attachments.first()) return message.channel.send(`<:${config.emoji.x}> Please provide an attachment!`);

		var attachment = message.attachments.first() ? message.attachments.first().url : args.splice(1).join(" ");

		/**
       * Check a URL to see if it makes a valid attachment
       * @param {string} url - The string to be checked
       * @returns {boolean}
       */
		function checkURL (url) {
			var noparams = url.split("?")[0];
			return (noparams.match(/\.(jpeg|jpg|gif|png)$/) != null);
		}

		if (!(checkURL(attachment))) return message.channel.send(`<:${config.emoji.x}> Please provide a valid attachment!`);

		if (!client.suggestions.get(id, "attachment")) client.suggestions.set(id, attachment, "attachment");

		var suggester;
		if (client.users.get(client.suggestions.get(id, "suggester"))) {
			suggester = client.users.get(client.suggestions.get(id, "suggester"));
		} else {
			var found = false;
			var sent = false;
			client.fetchUser(client.users.get(client.suggestions.get(id, "suggester")), true)
				.then(user => {
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
			.setTitle("Attachment Added")
			.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`)
			.setImage(attachment)
			.setColor("#3498db")
			.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);

		client.channels.get(client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions"))
			.fetchMessage(client.suggestions.get(id, "messageid"))
			.then(f => f.edit(core.suggestionEmbed(client.suggestions.get(id), client)));

		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} added an attachment to #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", suggestion.suggestion)
				.setImage(attachment)
				.setFooter(`Suggestion ID: ${id.toString()} | Attacher ID: ${message.author.id}`)
				.setTimestamp()
				.setColor("#3498db");
			core.serverLog(logEmbed, message.guild.id, client);
		}
	}
};
