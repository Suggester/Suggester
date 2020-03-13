const { emoji, colors, prefix, main_guild } = require("../../config.json");
const { dbQuery, dbModify, serverLog, checkConfig, checkPermissions, fetchUser } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "blacklist",
		permission: 3,
		usage: "blacklist <user>",
		aliases: ["disallow"],
		description: "Blacklists a user from using the bot in the server",
		enabled: true,
		docs: "staff/blacklist",
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

		if (user.bot) return message.channel.send(`<:${emoji.x}> This user is a bot, and therefore cannot be blacklisted.`);
		if (message.guild.members.cache.get(user.id)) {
			let memberPermission = await checkPermissions(message.guild.members.cache.get(user.id), client);
			if (memberPermission < 3) return message.channel.send(`<:${emoji.x}> This user would not be affected by a blacklist because they are a staff member.`);
		} else if (client.guilds.cache.get(main_guild).members.cache.get(user.id)) {
			let permissionInMainGuild = await checkPermissions(client.guilds.cache.get(main_guild).members.cache.get(user.id), client);
			if (permissionInMainGuild <= 1) return message.channel.send(`<:${emoji.x}> This user would not be affected by a blacklist because they are a global Suggester staff member.`);
		}

		if (qServerDB.config.blacklist.includes(user.id)) return message.channel.send(`<:${emoji.x}> This user is already blacklisted from using the bot on this server!`);
		qServerDB.config.blacklist.push(user.id);
		await dbModify("Server", {id: message.guild.id}, qServerDB);
		message.channel.send(`<:${emoji.check}> **${Discord.Util.removeMentions(user.tag)}** (\`${user.id}\`) has been blacklisted from using the bot on this server.`);

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(`${message.author.tag} blacklisted ${user.tag}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(`Tag: ${user.tag}\nID: ${user.id}\nMention: <@${user.id}>`)
				.setFooter(`Staff Member ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);
			serverLog(logEmbed, qServerDB);
		}
	}
};
