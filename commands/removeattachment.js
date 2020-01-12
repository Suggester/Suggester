const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		aliases: ["rmattachment", "rmattach", "delattachment", "deleteattachment"],
		usage: "removeattachment <suggestion id>",
		description: "Removes a file from a suggestion",
		enabled: true,
		docs: "staff/removeattachment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {

		var missingConfigs = [];
		if (!client.servers.get(message.guild.id)) return message.channel.send(`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`);
		if (!client.servers.get(message.guild.id, "admin_roles") || client.servers.get(message.guild.id, "admin_roles").length < 1) missingConfigs.push("Server Admin Roles");
		if (!client.servers.get(message.guild.id, "staff_roles") || client.servers.get(message.guild.id, "staff_roles").length < 1) missingConfigs.push("Server Staff Roles");
		if (!client.servers.get(message.guild.id, "channels.suggestions") || !client.channels.get(client.servers.get(message.guild.id, "channels.suggestions"))) missingConfigs.push("Approved Suggestions Channel");
		if (client.servers.get(message.guild.id, "mode") === "review" && (!client.servers.get(message.guild.id, "channels.staff") || !client.channels.get(client.servers.get(message.guild.id, "channels.staff")))) missingConfigs.push("Suggestion Review Channel");
  
		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed();
			embed.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${client.servers.get(message.guild.id, "prefix")}config\` command.`);
			embed.addField("Missing Elements", `<:${config.emoji.x}> ${missingConfigs.join(`\n<:${config.emoji.x}> `)}`);
			embed.setColor("#e74c3c");
			return message.channel.send(embed);
		}

		if (client.channels.get(client.servers.get(message.guild.id, "channels.suggestions"))) {
			var perms = core.channelPermissions(client.channels.get(client.servers.get(message.guild.id, "channels.suggestions")).memberPermissions(client.user.id), "suggestions", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed();
				embed.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${client.servers.get(message.guild.id, "channels.suggestions")}> channel:`);
				embed.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`);
				embed.addField("How to Fix", `In the channel settings for <#${client.servers.get(message.guild.id, "channels.suggestions")}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`);
				embed.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else return message.channel.send(`<:${config.emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestion channel.`);
    
		if (!args[0] || !client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id)) return message.channel.send(`<:${config.emoji.x}> Please provide a valid suggestion id!`);

		var suggestion = client.suggestions.find(s => s.id.toString() == args[0] && s.guild == message.guild.id);
		var id = suggestion.id.toString();

		if (!suggestion.attachment) return message.channel.send(`<:${config.emoji.x}> This suggestion does not have an attachment!`);
		var oldAttachment = suggestion.attachment;
		client.suggestions.delete(id, "attachment");
    
  
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
  
		let replyEmbed = new Discord.RichEmbed();
		replyEmbed.setTitle("Attachment Removed");
		replyEmbed.setDescription(`${suggestion.suggestion}\n[Suggestions Feed Post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${client.suggestions.get(id, "messageid")})`);
		replyEmbed.setImage(oldAttachment);
		replyEmbed.setColor("#e74c3c");
		replyEmbed.setFooter(`Suggestion ID: ${id.toString()}`);
		message.channel.send(replyEmbed);
  
		client.channels.get(client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")).fetchMessage(client.suggestions.get(id, "messageid")).then(f => f.edit(core.suggestionEmbed(client.suggestions.get(id), client)));
  
    
		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed();
			logEmbed.setAuthor(`${message.author.tag} removed attachment from #${id.toString()}`, message.author.displayAvatarURL);
			logEmbed.addField("Suggestion", suggestion.suggestion);
			logEmbed.setImage(oldAttachment);
			logEmbed.setFooter(`Suggestion ID: ${id.toString()} | Staff Member ID: ${message.author.id}`);
			logEmbed.setTimestamp();
			logEmbed.setColor("#e74c3c");
			core.serverLog(logEmbed, message.guild.id, client);
		}
	}
};