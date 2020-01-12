const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "unblacklist <user>",
		aliases: ["allow"],
		description: "Unblacklists a server member from using the bot",
		enabled: true,
		docs: "staff/unblacklist",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {

		if (!client.servers.get(message.guild.id)) return message.channel.send(`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`);

		if (!args[0]) return message.reply("Please specify a member!");
		let member = messge.mentions.member.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.reply(`<:${config.emoji.x}> I couldn't find a member of this server with the ID \`${args[0]}\`.`);

		if (!client.servers.get(message.guild.id, "blacklist")) client.servers.set(message.guild.id, [], "blacklist");
		if (!client.servers.get(message.guild.id, "blacklist").includes(member.id)) return message.channel.send(`<:${config.emoji.x}> This user is not blacklisted from using the bot on this server!`);
		client.servers.remove(message.guild.id, member.id, "blacklist");
		message.channel.send(`<:${config.emoji.check}> **${member.user.tag}** (\`${member.id}\`) is no longer blacklisted from using the bot on this server.`);
		if (client.servers.get(message.guild.id, "channels.log")) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} unblacklisted #${member.user.tag}`, message.author.displayAvatarURL)
				.setDescription(`Tag: ${member.user.tag}\nID: ${member.id}\nMention: <@${member.id}>`)
				.setFooter(`Staff Member ID: ${message.author.id}`)
				.setTimestamp()
				.setColor("#2ecc71");
			core.serverLog(logEmbed, message.guild.id, client);
		}
	}
};
