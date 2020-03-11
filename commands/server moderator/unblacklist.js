const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, dbModify, serverLog, checkConfig, fetchUser } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "unblacklist",
		permission: 3,
		usage: "unblacklist <user>",
		aliases: ["allow"],
		description: "Unblacklists a server member from using the bot",
		enabled: true,
		docs: "staff/unblacklist",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let user = await fetchUser(args[0], client);
		if (!user) return message.channel.send("You must specify a valid user!");

		if (!qServerDB.config.blacklist.includes(user.id)) return message.channel.send(`<:${emoji.x}> This user is not blacklisted from using the bot on this server!`);
		qServerDB.config.blacklist.splice(qServerDB.config.blacklist.findIndex(u => u === user.id), 1);
		await dbModify("Server", {id: message.guild.id}, qServerDB);
		message.channel.send(`<:${emoji.check}> **${Discord.Util.escapeMarkdown(user.tag)}** (\`${user.id}\`) is no longer blacklisted from using the bot on this server.`);
		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} unblacklisted ${user.tag}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(`Tag: ${user.tag}\nID: ${user.id}\nMention: <@${user.id}>`)
				.setFooter(`Staff Member ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.green);
			serverLog(logEmbed, qServerDB);
		}
	}
};
