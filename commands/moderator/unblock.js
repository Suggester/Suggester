const { dbModify } = require("../../utils/db");
const { baseConfig } = require("../../utils/checks");
const { serverLog } = require("../../utils/logs");
const { fetchUser } = require("../../utils/misc.js");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "unblock",
		permission: 3,
		usage: "unblock [user]",
		aliases: ["allow", "unbl"],
		description: "Unblocks a user from using the bot in this server",
		enabled: true,
		examples: "`{{p}}unblock @Brightness™`\nUnblocks Brightness™ from using the bot in this server\n\n`{{p}}unblock 255834596766253057 Accidentally blocked`\nUnblocks a user with ID 255834596766253057 from using the bot in this server with reason \"Accidentally blocked\"",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		docs: "staff/unblock"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (!args[0]) return message.channel.send(string(locale, "BLOCK_NO_ARGS_ERROR", {}, "error"));

		let user = await fetchUser(args[0], client);
		if (!user || user.id === "0") return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));

		if (!qServerDB.config.blocklist.includes(user.id) && !qServerDB.config.blocklist.find(b => b.id === user.id && b.expires > Date.now())) return message.channel.send(string(locale, "USER_NOT_BLOCKED_ERROR", {}, "error"));

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string(locale, "BLOCK_REASON_TOO_LONG_ERROR", {}, "error"));
		}

		qServerDB.config.blocklist.splice(qServerDB.config.blocklist.findIndex(u => typeof u === "object" ? u.id === user.id : u === user.id), 1);
		await dbModify("Server", { id: message.guild.id }, qServerDB);
		message.channel.send(`${string(locale, "UNBLOCK_SUCCESS", { user: user.tag, id: user.id },"success")}${reason ? `\n> ${string(locale, "BLOCK_REASON_HEADER")} ${reason}` : ""}`, { disableMentions: "all" });

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string(guildLocale, "UNBLOCK_LOG_TITLE", { staff: message.author.tag, user: user.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(string(guildLocale, "BLOCK_USER_DATA", { tag: user.tag, id: user.id, mention: `<@${user.id}>` }))
				.setFooter(string(guildLocale, "STAFF_MEMBER_LOG_FOOTER", { id: message.author.id }))
				.setTimestamp()
				.setColor(client.colors.green);

			reason ? logEmbed.addField(string(guildLocale, "BLOCK_REASON_HEADER"), reason) : null;
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
