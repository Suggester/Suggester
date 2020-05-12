const { colors } = require("../../config.json");
const { dbQuery, checkPermissions, fetchUser } = require("../../coreFunctions");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "verify",
		permission: 10,
		usage: "verify",
		description: "Shows permissions of a user as they relate to the bot",
		enabled: true,
		docs: "all/verify",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 10
	},
	do: async (message, client, args, Discord) => {
		let user = await fetchUser(args[0] ? args[0] : message.author.id, client);
		if (!user) user = message.author;

		let qUserDB = await dbQuery("User", { id: user.id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });

		await message.guild.members.fetch(user.id).catch(() => {});

		let globalPosArr = [];
		let posArr = [];
		if (client.admins.has(user.id)) globalPosArr.push(`<:suggesterdev:689121648099459078> ${string("VERIFY_ACK_DEVELOPER")}`, `<:suggesteradmin:689138045122773006> ${string("VERIFY_ACK_GLOBAL_ADMIN")}`);

		if (qUserDB && qUserDB.flags.includes("STAFF")) globalPosArr.push(`<:suggesterglobal:689121762952216625> ${string("VERIFY_ACK_GLOBAL_STAFF")}`);

		if (qUserDB.blocked) globalPosArr.push(`🚫 ${string("VERIFY_ACK_GLOBAL_BLACKLIST")}`);

		if (message.guild.members.cache.get(user.id)) {
			let member = message.guild.members.cache.get(user.id);
			if (member.hasPermission("MANAGE_GUILD") || qServerDB.config.admin_roles.some(r => member.roles.cache.has(r))) posArr.push(`🛠️ ${string("VERIFY_ACK_SERVER_ADMIN")}`);
			if (qServerDB.config.staff_roles.some(r => member.roles.cache.has(r))) posArr.push(`🛠️ ${string("VERIFY_ACK_SERVER_STAFF")}`);
		}
		if (qServerDB.config.blacklist.includes(user.id)) posArr.push(`🚫 ${string("VERIFY_ACK_SERVER_BLACKLIST")}`);

		let permissionLevel = await checkPermissions(message.guild.members.cache.get(user.id), client);
		let embed = new Discord.MessageEmbed()
			.setAuthor(user.tag, user.displayAvatarURL({format: "png", dynamic: true}))
			.setColor(colors.default)
			.setFooter(string("VERIFY_PERMISSION_LEVEL_FOOTER", { level: permissionLevel.toString() }));
		if (globalPosArr.length > 0) embed.addField(string("VERIFY_TITLE_GLOBAL_ACKS"), `${globalPosArr.join("\n")}`);
		if (posArr.length > 0) embed.addField(string("VERIFY_TITLE_SERVER_ACKS"), `${posArr.join("\n")}`);

		if (args[0] && args[args.length-1].toLowerCase() === "--flags" && permissionLevel <= 1) embed.addField(string("VERIFY_FLAGS_TITLE"), `${qUserDB.flags.length > 0 ? qUserDB.flags.join(", ") : string("NO_FLAGS_SET")}`);
		if (qUserDB.ack) embed.setDescription(qUserDB.ack);
		if (!embed.description && embed.fields.length < 1) embed.setDescription(string("VERIFY_NO_ACKS"));

		return message.channel.send(embed);
	}
};
