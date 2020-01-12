const core = require("../coreFunctions.js");
const config = require("../config.json");
module.exports = {
	controls: {
		permission: 3,
		aliases: ["delcomment", "dcomment", "rmcomment"],
		usage: "deletecomment <comment id>",
		description: "Deletes a comment on a suggestion",
		enabled: true,
		docs: "staff/deletecomment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {
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

		if (!args[0]) return message.channel.send(`<:${config.emoji.x}> You must specify a comment ID!`);
		var idsections = args[0].split("_");
		if (!idsections[0] || !idsections[1]) return message.channel.send(`<:${config.emoji.x}> You must specify a valid comment ID!`);
		if (!client.suggestions.get(idsections[0])) return message.channel.send(`<:${config.emoji.x}> You must specify a valid comment ID!`);
		var suggestion = client.suggestions.get(idsections[0]);
		var id = suggestion.id;
		if (!suggestion.comments.find(c => c.id == idsections[1])) return message.channel.send(`<:${config.emoji.x}> You must specify a valid comment ID!`);
		var comment = suggestion.comments.find(c => c.id == idsections[1]);

		if (comment.deleted && comment.deleted == true) return message.channel.send(`<:${config.emoji.x}> This comment has already been deleted!`);

		let embed = new Discord.RichEmbed()
			.setTitle("Comment Deleted")
			.setDescription(comment.comment)
			.setColor("#e74c3c")
			.setFooter(`Comment ID: ${id}_${comment.id}`);

		suggestion.comments.find(c => c.id == idsections[1]).deleted = true;
		client.suggestions.set(id, suggestion);
		client.channels.get(client.servers.get(suggestion.guild, "channels.suggestions")).fetchMessage(suggestion.messageid).then(f => f.edit(core.suggestionEmbed(client.suggestions.get(id), client)));

		message.channel.send(embed);

		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} deleted comment #${comment.id} from suggestion #${id.toString()}`, message.author.displayAvatarURL)
				.addField("Suggestion", suggestion.suggestion)
				.addField("Comment", comment.comment)
				.setFooter(`Suggestion ID: ${id.toString()} | Deleter ID: ${message.author.id}`)
				.setTimestamp()
				.setColor("#e74c3c");
			core.serverLog(logEmbed, message.guild.id, client);
		}
	}
};
