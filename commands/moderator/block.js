const { dbQuery, dbModify } = require("../../utils/db");
const { checkPermissions, baseConfig } = require("../../utils/checks");
const { serverLog } = require("../../utils/logs");
const { pages } = require("../../utils/actions");
const { fetchUser } = require("../../utils/misc.js");
const { string } = require("../../utils/strings");
const ms = require("ms");
const humanizeDuration = require("humanize-duration");
module.exports = {
	controls: {
		name: "bl",
		permission: 3,
		usage: "block [user] (duration) (reason)",
		aliases: ["disallow", "block", "bl"],
		description: "Blocks a user from using the bot in this server",
		enabled: true,
		examples: "`{{p}}block @Brightness™`\nBlocks Brightness™ from using the bot in this server\n\n`{{p}}block 255834596766253057 Spamming suggestions`\nBlocks a user with ID 255834596766253057 from using the bot in this server for \"Spamming suggestions\"\n\n`{{p}}block @Brightness™ 1h`\nBlocks Brightness™ from using the bot in this server for 1 hour\n\n`{{p}}block 255834596766253057 2h Spamming suggestions`\nBlocks a user with ID 255834596766253057 from using the bot in this server for 2 hours with reason \"Spamming suggestions\"",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "EMBED_LINKS", "ADD_REACTIONS"],
		cooldown: 5,
		docs: "staff/block"
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (!args[0]) return message.channel.send(string(locale, "BLOCK_NO_ARGS_ERROR", {}, "error"));

		qServerDB.config.blocklist = qServerDB.config.blocklist.filter(b => typeof b === "string" || b.expires > Date.now());

		if (args[0].toLowerCase() === "list") {
			if (qServerDB.config.blocklist.length < 1) return message.channel.send(string(locale, "BLOCKLIST_EMPTY"));
			let chunks = qServerDB.config.blocklist.chunk(20);
			let embeds = [];
			for await (let chunk of chunks) {
				let list = [];
				for await (let blocked of chunk) {
					let u = await fetchUser(typeof blocked === "string" ? blocked : blocked.id, client);
					u ? list.push(`${u.tag} (\`${u.id}\`)`) : "";
				}

				embeds.push(new Discord.MessageEmbed()
					.setDescription(list.join("\n"))
					.setColor(client.colors.default)
					.setAuthor(chunks.length > 1 ? string(locale, "PAGINATION_PAGE_COUNT") : "")
					.setFooter(chunks.length > 1 ? string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS") : ""));
			}
			qServerDB.save();
			pages(locale, message, embeds);
			return;
		}

		let user = await fetchUser(args[0], client);
		if (!user || user.id === "0") return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));

		if (user.id === message.author.id) return message.channel.send(string(locale, "BLOCK_SELF_ERROR", {}, "error"));
		if (user.bot) return message.channel.send(string(locale, "BLOCK_USER_BOT_ERROR", {}, "error"));

		let qUserDB = await dbQuery("User", {id: user.id});

		await message.guild.members.fetch(user.id).catch(() => {});

		if (qServerDB.config.blocklist.includes(user.id) || qServerDB.config.blocklist.find(u => u.id === user.id)) return message.channel.send(string(locale, "ALREADY_BLOCKED_ERROR", {}, "error"));
		if (qUserDB.flags.includes("STAFF")) return message.channel.send(string(locale, "BLOCK_GLOBAL_STAFF_ERROR", {}, "error"));
		if (message.guild.members.cache.get(user.id)) {
			let memberPermission = await checkPermissions(message.guild.members.cache.get(user.id), client);
			if (memberPermission <= 2) return message.channel.send(string(locale, "BLOCK_STAFF_ERROR", {}, "error"));
		}

		let duration = (args[1] ? ms(args[1]) : null) || null;

		let reason;
		if (args[duration ? 2 : 1]) {
			reason = args.splice(duration ? 2 : 1).join(" ");
			if (reason.length > 1024) return message.channel.send(string(locale, "BLOCK_REASON_TOO_LONG_ERROR", {}, "error"));
		}

		qServerDB.config.blocklist.push(duration ? {
			id: user.id,
			expires: Date.now()+duration
		} : user.id);
		await dbModify("Server", {id: message.guild.id}, qServerDB);
		message.channel.send(`${string(locale, "BLOCK_SUCCESS", { user: user.tag, id: user.id }, "success")}${duration ? `\n> ${string(locale, "BLOCK_DURATION_HEADER")} ${humanizeDuration(duration, { language: locale, fallbacks: ["en"] })}` : ""}${reason ? `\n> ${string(locale, "BLOCK_REASON_HEADER")} ${reason}` : ""}`, { disableMentions: "all" });

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string(guildLocale, "BLOCK_LOG_TITLE", { staff: message.author.tag, user: user.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(string(guildLocale, "BLOCK_USER_DATA", { tag: user.tag, id: user.id, mention: `<@${user.id}>` }))
				.setFooter(string(guildLocale, "STAFF_MEMBER_LOG_FOOTER", { id: message.author.id }))
				.setTimestamp()
				.setColor(client.colors.red);

			reason ? logEmbed.addField(string(guildLocale, "BLOCK_REASON_HEADER"), reason) : null;
			duration ? logEmbed.addField(string(guildLocale, "BLOCK_DURATION_HEADER"), humanizeDuration(duration, { language: guildLocale, fallbacks: ["en"] })) : null;
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
