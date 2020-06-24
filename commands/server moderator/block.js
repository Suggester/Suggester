const { colors } = require("../../config.json");
const { dbQuery, dbModify } = require("../../utils/db");
const { checkPermissions, baseConfig } = require("../../utils/checks");
const { serverLog } = require("../../utils/logs");
const { pages } = require("../../utils/actions");
const { fetchUser } = require("../../utils/misc.js");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "block",
		permission: 3,
		usage: "block <user>",
		aliases: ["disallow", "block"],
		description: "Blocks a user from using the bot in the server",
		enabled: true,
		docs: "staff/block",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild.id);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (!args[0]) return message.channel.send(string(locale, "BLOCK_NO_ARGS_ERROR", {}, "error"));

		if (args[0].toLowerCase() === "list") {
			if (qServerDB.config.blocklist.length < 1) return message.channel.send(string(locale, "BLOCKLIST_EMPTY"));
			let chunks = qServerDB.config.blocklist.chunk(20);
			let embeds = [];
			for await (let chunk of chunks) {
				let list = [];
				for await (let blocked of chunk) {
					let u = await fetchUser(blocked, client);
					u ? list.push(`${u.tag} (\`${u.id}\`)`) : "";
				}

				embeds.push(new Discord.MessageEmbed()
					.setDescription(list.join("\n"))
					.setColor(colors.default)
					.setFooter(chunks.length > 1 ? string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS") : ""));
			}
			pages(locale, message, embeds);
			return;
		}

		let user = await fetchUser(args[0], client);
		if (!user || user.id === "0") return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));

		if (user.id === message.author.id) return message.channel.send(string(locale, "BLOCK_SELF_ERROR", {}, "error"));
		if (user.bot) return message.channel.send(string(locale, "BLOCK_USER_BOT_ERROR", {}, "error"));

		let qUserDB = await dbQuery("User", {id: user.id});

		await message.guild.members.fetch(user.id).catch(() => {});

		if (qServerDB.config.blocklist.includes(user.id)) return message.channel.send(string(locale, "ALREADY_BLOCKED_ERROR", {}, "error"));
		if (qUserDB.flags.includes("STAFF")) return message.channel.send(string(locale, "BLOCK_GLOBAL_STAFF_ERROR", {}, "error"));
		if (message.guild.members.cache.get(user.id)) {
			let memberPermission = await checkPermissions(message.guild.members.cache.get(user.id), client);
			if (memberPermission <= 2) return message.channel.send(string(locale, "BLOCK_STAFF_ERROR", {}, "error"));
		}

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string(locale, "BLOCK_REASON_TOO_LONG_ERROR", {}, "error"));
		}

		qServerDB.config.blocklist.push(user.id);
		await dbModify("Server", {id: message.guild.id}, qServerDB);
		message.channel.send(`${string(locale, "BLOCK_SUCCESS", { user: user.tag, id: user.id }, "success")}${reason ? `\n${string(locale, "BLOCK_REASON_HEADER")} ${reason}` : ""}`, { disableMentions: "all" });

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string(guildLocale, "BLOCK_LOG_TITLE", { staff: message.author.tag, user: user.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(string(guildLocale, "BLOCK_USER_DATA", { tag: user.tag, id: user.id, mention: `<@${user.id}>` }))
				.setFooter(string(guildLocale, "STAFF_MEMBER_LOG_FOOTER", { id: message.author.id }))
				.setTimestamp()
				.setColor(colors.red);

			reason ? logEmbed.addField(string(guildLocale, "BLOCK_REASON_HEADER"), reason) : null;
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
