const { emoji } = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "blacklist <user>",
		aliases: ["disallow"],
		description: "Blacklists a server member from using the bot",
		enabled: true,
		docs: "staff/blacklist",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {
		if (!client.servers.get(message.guild.id)) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`);

		var member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.reply(`<:${emoji.x}> I couldn't find a member of this server with the ID \`${args[0]}\`.`);

		if (!client.servers.get(message.guild.id, "blacklist")) client.servers.set(message.guild.id, [], "blacklist");
		if (client.servers.get(message.guild.id, "blacklist").includes(member.id)) return message.channel.send(`<:${emoji.x}> This user is already blacklisted from using the bot on this server!`);
		client.servers.push(message.guild.id, member.id, "blacklist");
		message.channel.send(`<:${emoji.check}> **${member.user.tag}** (\`${member.id}\`) has been blacklisted from using the bot on this server.`);

		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} blacklisted #${member.user.tag}`, message.author.displayAvatarURL)
				.setDescription(`Tag: ${member.user.tag}\nID: ${member.id}\nMention: <@${member.id}>`)
				.setFooter(`Staff Member ID: ${message.author.id}`)
				.setTimestamp()
				.setColor("#e74c3c");
			core.serverLog(logEmbed, message.guild.id, client);
		}
	}
};
