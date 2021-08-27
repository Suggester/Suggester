const { fetchUser } = require("../../utils/misc");
const { checkPermissions } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { dbQuery } = require("../../utils/db");
module.exports = {
	controls: {
		name: "verify",
		permission: 10,
		usage: "verify (user)",
		description: "Shows permissions of a user as they relate to the bot",
		image: "images/Verify.gif",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		examples: "`{{p}}verify`\nShows information about you\n\n`{{p}}verify @Brightness™`\nShows Brightness™'s information",
		cooldown: 10,
		docs: "sumup"
	},
	do: async (locale, message, client, args, Discord) => {
		let user = await fetchUser(args[0] ? args[0] : message.author.id, client);
		if (!user || user.id === "0") user = message.author;

		let qUserDB = await dbQuery("User", { id: user.id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });

		await message.guild.members.fetch(user.id).catch(() => {});

		const DEV_BADGE = "<:new_dev1:880747651115655189>";
		const DONATOR_BADGE = "<:new_donator:880747316980645939>";
		const GLOBAL_STAFF_BADGE = "<:new_globalstaff:880747347083157525>";
		const NO_COOLDOWN_BADGE = "<:new_nocooldown:880747397624528896>";
		const SERVER_ADMIN_BADGE = "<:new_serveradmin:880747442528714752>";
		const SERVER_STAFF_BADGE = "<:new_serverstaff:880747424694534205>";
		const TRANSLATOR_BADGE = "<:new_translator:880914243472457788>";
		const BLOCKED_BADGE = "<:red_lock:880896793175523328>";
		const PROTECTED_BADGE = "<:yellow_lock:880896842974511134>";

		let globalPosArr = [];
		let posArr = [];
		if (client.admins.has(user.id)) globalPosArr.push(`${DEV_BADGE} ${string(locale, "VERIFY_ACK_DEVELOPER_GA")}`);

		if (qUserDB) {
			if (qUserDB.flags.includes("STAFF")) globalPosArr.push(`${GLOBAL_STAFF_BADGE}  ${string(locale, "VERIFY_ACK_GLOBAL_STAFF")}`);
			if (qUserDB.flags.includes("DONATOR")) globalPosArr.push(`${DONATOR_BADGE}  ${string(locale, "VERIFY_ACK_DONATOR")}`);
			if (qUserDB.flags.includes("TRANSLATOR")) globalPosArr.push(`${TRANSLATOR_BADGE}  ${string(locale, "VERIFY_ACK_TRANSLATOR")}`);
			if (qUserDB.flags.includes("NO_COOLDOWN")) globalPosArr.push(`${NO_COOLDOWN_BADGE} ${string(locale, "VERIFY_ACK_GLOBAL_NO_COOLDOWN")}`);
			if (qUserDB.flags.includes("PROTECTED")) globalPosArr.push(`${PROTECTED_BADGE} ${string(locale, "VERIFY_ACK_GLOBAL_PROTECTED")}`);
			if (qUserDB.blocked) globalPosArr.push(`${BLOCKED_BADGE} ${string(locale, "VERIFY_ACK_GLOBAL_BLOCK")}`);
		}
		if (message.guild.members.cache.get(user.id)) {
			let member = message.guild.members.cache.get(user.id);
			if (member.hasPermission("MANAGE_GUILD") || qServerDB.config.admin_roles.some(r => member.roles.cache.has(r))) posArr.push(`${SERVER_ADMIN_BADGE} ${string(locale, "VERIFY_ACK_SERVER_ADMIN")}`);
			if (qServerDB.config.staff_roles.some(r => member.roles.cache.has(r))) posArr.push(`${SERVER_STAFF_BADGE} ${string(locale, "VERIFY_ACK_SERVER_STAFF")}`);
			if (qServerDB.config.blocked_roles.some(r => member.roles.cache.has(r)) || (qServerDB.config.blocklist.includes(user.id) || qServerDB.config.blocklist.find(b => b.id === user.id && b.expires > Date.now()))) posArr.push(`${BLOCKED_BADGE} ${string(locale, "VERIFY_ACK_SERVER_BLOCK")}`);
		} else if (qServerDB.config.blocklist.includes(user.id) || qServerDB.config.blocklist.find(b => b.id === user.id && b.expires > Date.now())) posArr.push(`${BLOCKED_BADGE} ${string(locale, "VERIFY_ACK_SERVER_BLOCK")}`);

		let permissionLevel = await checkPermissions(message.guild.members.cache.get(user.id), client);
		let senderPermissionLevel = await checkPermissions(message.member, client);
		let embed = new Discord.MessageEmbed()
			.setAuthor(user.tag, user.displayAvatarURL({format: "png", dynamic: true}))
			.setColor(qUserDB.verifyColor || client.colors.default)
			.setFooter(string(locale, "VERIFY_PERMISSION_LEVEL_FOOTER", { level: permissionLevel.toString() }));
		if (globalPosArr.length > 0) embed.addField(string(locale, "VERIFY_TITLE_GLOBAL_ACKS"), `${globalPosArr.join("\n")}`);
		if (posArr.length > 0) embed.addField(string(locale, "VERIFY_TITLE_SERVER_ACKS"), `${posArr.join("\n")}`);

		if (args[0] && ["--flags", "-flags"].some(e => e === args[args.length-1].toLowerCase()) && senderPermissionLevel <= 1) {
			embed.addField(string(locale, "VERIFY_FLAGS_TITLE"), `${qUserDB.flags.length > 0 ? qUserDB.flags.join(", ") : string(locale, "NO_FLAGS_SET")}`)
				.addField(string(locale, "HELP_ADDITIONAL_INFO"), `**${string(locale, "CONFIG_NAME:LOCALE")}:** ${qUserDB.locale && client.locales.find(l => l.settings.code === qUserDB.locale) ? client.locales.find(l => l.settings.code === qUserDB.locale).settings.native : string(locale, "NONE_CONFIGURED")}\n**${string(locale, "CONFIG_NAME:NOTIFY")}:** ${qUserDB.notify ? string(locale, "ENABLED") : string(locale, "DISABLED")}\n${string(locale, "PROTIPS_TITLE")} ${qUserDB.protips ? string(locale, "ENABLED") : string(locale, "DISABLED")}\n${string(locale, "PROTIPS_SHOWN_TITLE")} ${qUserDB.displayed_protips.join(", ")}`);
		}
		if (qUserDB.ack) embed.setDescription(qUserDB.ack);
		if (!embed.description && embed.fields.length < 1) embed.setDescription(string(locale, "VERIFY_NO_ACKS"));

		return message.channel.send(embed);
	}
};
