const { emoji, colors, prefix } = require("../../config.json");
const { dbQuery, dbModify, serverLog, checkPermissions } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "blacklist",
		permission: 3,
		usage: "blacklist <user>",
		aliases: ["disallow"],
		description: "Blacklists a server member from using the bot",
		enabled: true,
		docs: "staff/blacklist",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
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

		let member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.channel.send(`<:${emoji.x}> I couldn't find a member of this server based on your input. Make sure to specify a **user @mention** or **user ID**.`);

		if (member.user.bot) return message.channel.send(`<:${emoji.x}> This user is a bot, and therefore cannot be blacklisted.`);
		let memberPermission = await checkPermissions(member, client);
		if (memberPermission < 3) return message.channel.send(`<:${emoji.x}> This user would not be affected by a blacklist because they are a staff member.`);

		if (qServerDB.config.blacklist.includes(member.id)) return message.channel.send(`<:${emoji.x}> This user is already blacklisted from using the bot on this server!`);
		qServerDB.config.blacklist.push(member.id);
		await dbModify("Server", {id: message.guild.id}, qServerDB);
		message.channel.send(`<:${emoji.check}> **${member.user.tag}** (\`${member.id}\`) has been blacklisted from using the bot on this server.`);

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.RichEmbed()
				.setAuthor(`${message.author.tag} blacklisted ${member.user.tag}`, message.author.displayAvatarURL)
				.setDescription(`Tag: ${member.user.tag}\nID: ${member.id}\nMention: <@${member.id}>`)
				.setFooter(`Staff Member ID: ${message.author.id}`)
				.setTimestamp()
				.setColor(colors.red);
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
