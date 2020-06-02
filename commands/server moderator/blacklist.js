const { colors } = require("../../config.json");
const { dbQuery, dbModify } = require("../../utils/db");
const { checkPermissions, baseConfig } = require("../../utils/checks");
const { serverLog } = require("../../utils/logs");
const { pages } = require("../../utils/actions");
const { fetchUser } = require("../../utils/misc.js");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "blacklist",
		permission: 3,
		usage: "blacklist <user>",
		aliases: ["disallow", "bl"],
		description: "Blacklists a user from using the bot in the server",
		enabled: true,
		docs: "staff/blacklist",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return message.channel.send(returned);

		if (!args[0]) return message.channel.send(string("BLACKLIST_NO_ARGS_ERROR", {}, "error"));

		if (args[0].toLowerCase() === "list") {
			if (qServerDB.config.blacklist.length < 1) return message.channel.send(string("BLACKLIST_EMPTY"));
			let chunks = qServerDB.config.blacklist.chunk(20);
			let embeds = [];
			for await (let chunk of chunks) {
				let list = [];
				for await (let blacklisted of chunk) {
					let u = await fetchUser(blacklisted, client);
					u ? list.push(`${u.tag} (\`${u.id}\`)`) : "";
				}

				embeds.push(new Discord.MessageEmbed()
					.setDescription(list.join("\n"))
					.setColor(colors.default)
					.setFooter(chunks.length > 1 ? string("PAGINATION_NAVIGATION_INSTRUCTIONS") : ""));
			}
			pages(message, embeds);
			return;
		}

		let user = await fetchUser(args[0], client);
		if (!user || user.id === "0") return message.channel.send(string("INVALID_USER_ERROR", {}, "error"));

		if (user.id === message.author.id) return message.channel.send(string("BLACKLIST_SELF_ERROR", {}, "error"));
		if (user.bot) return message.channel.send(string("BLACKLIST_USER_BOT_ERROR", {}, "error"));

		let qUserDB = await dbQuery("User", {id: user.id});

		await message.guild.members.fetch(user.id).catch(() => {});

		if (qServerDB.config.blacklist.includes(user.id)) return message.channel.send(string("ALREADY_BLACKLISTED_ERROR", {}, "error"));
		if (qUserDB.flags.includes("STAFF")) return message.channel.send(string("BLACKLIST_GLOBAL_STAFF_ERROR", {}, "error"));
		if (message.guild.members.cache.get(user.id)) {
			let memberPermission = await checkPermissions(message.guild.members.cache.get(user.id), client);
			if (memberPermission <= 2) return message.channel.send(string("BLACKLIST_STAFF_ERROR", {}, "error"));
		}

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string("BLACKLIST_REASON_TOO_LONG_ERROR", {}, "error"));
		}

		qServerDB.config.blacklist.push(user.id);
		await dbModify("Server", {id: message.guild.id}, qServerDB);
		message.channel.send(`${string("BLACKLIST_SUCCESS", { user: user.tag, id: user.id }, {}, "check")}${reason ? `\n${string("BLACKLIST_REASON_HEADER")} ${reason}` : ""}`, { disableMentions: "all" });

		if (qServerDB.config.channels.log) {
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string("BLACKLIST_LOG_TITLE", { staff: message.author.tag, user: user.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(string("BLACKLIST_USER_DATA", { tag: user.tag, id: user.id, mention: `<@${user.id}>` }))
				.setFooter(string("STAFF_MEMBER_LOG_FOOTER", { id: message.author.id }))
				.setTimestamp()
				.setColor(colors.red);

			reason ? logEmbed.addField(string("BLACKLIST_REASON_HEADER"), reason) : null;
			serverLog(logEmbed, qServerDB, client);
		}
	}
};
