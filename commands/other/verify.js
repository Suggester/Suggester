const { fetchUser } = require("../../utils/misc");
const { checkPermissions } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { dbQuery } = require("../../utils/db");
module.exports = {
	controls: {
		name: "verify",
		permission: 10,
		usage: "verify",
		description: "Shows permissions of a user as they relate to the bot",
		image: "images/Verify.gif",
		enabled: true,
		docs: "all/verify",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (locale, message, client, args, Discord) => {
		let user = await fetchUser(args[0] ? args[0] : message.author.id, client);
		if (!user || user.id === "0") user = message.author;

		let qUserDB = await dbQuery("User", { id: user.id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });

		await message.guild.members.fetch(user.id).catch(() => {});

		let globalPosArr = [];
		let posArr = [];
		if (client.admins.has(user.id)) globalPosArr.push(`<:suggesterdev:689121648099459078> ${string(locale, "VERIFY_ACK_DEVELOPER")}`, `<:suggesteradmin:689138045122773006> ${string(locale, "VERIFY_ACK_GLOBAL_ADMIN")}`);

		if (qUserDB && qUserDB.flags.includes("STAFF")) globalPosArr.push(`<:suggesterglobal:689121762952216625> ${string(locale, "VERIFY_ACK_GLOBAL_STAFF")}`);

		if (qUserDB.blocked) globalPosArr.push(`🚫 ${string(locale, "VERIFY_ACK_GLOBAL_BLOCK")}`);

		if (message.guild.members.cache.get(user.id)) {
			let member = message.guild.members.cache.get(user.id);
			if (member.hasPermission("MANAGE_GUILD") || qServerDB.config.admin_roles.some(r => member.roles.cache.has(r))) posArr.push(`🛠️ ${string(locale, "VERIFY_ACK_SERVER_ADMIN")}`);
			if (qServerDB.config.staff_roles.some(r => member.roles.cache.has(r))) posArr.push(`🛠️ ${string(locale, "VERIFY_ACK_SERVER_STAFF")}`);
			if (qServerDB.config.blocked_roles.some(r => member.roles.cache.has(r)) || qServerDB.config.blocklist.includes(user.id)) posArr.push(`🚫 ${string(locale, "VERIFY_ACK_SERVER_BLOCK")}`);
		} else if (qServerDB.config.blocklist.includes(user.id)) posArr.push(`🚫 ${string(locale, "VERIFY_ACK_SERVER_BLOCK")}`);

		let permissionLevel = await checkPermissions(message.guild.members.cache.get(user.id), client);
		let senderPermissionLevel = await checkPermissions(message.member, client);
		let embed = new Discord.MessageEmbed()
			.setAuthor(user.tag, user.displayAvatarURL({format: "png", dynamic: true}))
			.setColor(client.colors.default)
			.setFooter(string(locale, "VERIFY_PERMISSION_LEVEL_FOOTER", { level: permissionLevel.toString() }));
		if (globalPosArr.length > 0) embed.addField(string(locale, "VERIFY_TITLE_GLOBAL_ACKS"), `${globalPosArr.join("\n")}`);
		if (posArr.length > 0) embed.addField(string(locale, "VERIFY_TITLE_SERVER_ACKS"), `${posArr.join("\n")}`);

		if (args[0] && args[args.length-1].toLowerCase() === "--flags" && senderPermissionLevel <= 1) {
			embed.addField(string(locale, "VERIFY_FLAGS_TITLE"), `${qUserDB.flags.length > 0 ? qUserDB.flags.join(", ") : string(locale, "NO_FLAGS_SET")}`)
				.addField(string(locale, "HELP_ADDITIONAL_INFO"), `${string(locale, "CFG_LOCALE_TITLE")} ${qUserDB.locale ? client.locales.find(l => l.settings.code === qUserDB.locale).settings.native : string(locale, "NONE_CONFIGURED")}\n${string(locale, "CFG_NOTIFICATIONS_TITLE")} ${qUserDB.notify ? string(locale, "ENABLED") : string(locale, "DISABLED")}\n${string(locale, "PROTIPS_TITLE")} ${qUserDB.protips ? string(locale, "ENABLED") : string(locale, "DISABLED")}\n${string(locale, "PROTIPS_SHOWN_TITLE")} ${qUserDB.displayed_protips.join(", ")}`);
		}
		if (qUserDB.ack) embed.setDescription(qUserDB.ack);
		if (!embed.description && embed.fields.length < 1) embed.setDescription(string(locale, "VERIFY_NO_ACKS"));

		return message.channel.send(embed);
	}
};
