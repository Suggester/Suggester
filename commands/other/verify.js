const { colors, developer } = require("../../config.json");
const { dbQuery, checkPermissions, fetchUser } = require("../../coreFunctions");
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
		let id;
		if (user) id = user.id;
		else {
			user = message.author;
			id = message.author.id;
		}

		let qUserDB = await dbQuery("User", { id: id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });

		await message.guild.members.fetch(id).catch(() => {});

		let globalPosArr = [];
		let posArr = [];
		if (developer.includes(id)) globalPosArr.push("<:suggesterdev:689121648099459078> Developer", "<:suggesteradmin:689138045122773006> Global Administrator");

		if (qUserDB && qUserDB.flags.includes("STAFF")) globalPosArr.push("<:suggesterglobal:689121762952216625> Suggester Staff Team");

		if (qUserDB.blocked) globalPosArr.push(":no_entry_sign: Blacklisted Globally");

		if (message.guild.members.cache.get(id) && message.guild.members.cache.get(id).hasPermission("MANAGE_GUILD")) {
			posArr.push("🛠️ Server Admin");
		} else if (qServerDB && qServerDB.config.admin_roles && message.guild.members.cache.get(id)) {
			let adminRoles = 0;
			qServerDB.config.admin_roles.forEach((roleid) => {
				if (message.guild.members.cache.get(id).roles.cache.has(roleid)) adminRoles++;
			});
			if (adminRoles > 0) posArr.push("🛠️ Server Admin");
		}

		if (qServerDB && qServerDB.config.staff_roles && message.guild.members.cache.get(id)) {
			let staffRoles = 0;
			qServerDB.config.staff_roles.forEach((roleid) => {
				if (message.guild.members.cache.get(id).roles.cache.has(roleid)) staffRoles++;
			});
			if (staffRoles > 0) posArr.push("🛠️ Server Staff");
		}
		if (qServerDB && qServerDB.config.blacklist.includes(id)) posArr.push(":no_entry_sign: Blacklisted on this server");

		let hasAcks = false;
		let permissionLevel = await checkPermissions(message.guild.members.cache.get(id), client);
		let embed = new Discord.MessageEmbed()
			.setAuthor(user.tag, user.displayAvatarURL({format: "png", dynamic: true}))
			.setColor(colors.default)
			.setFooter(`Permission Level: ${permissionLevel}`);
		if (globalPosArr.length > 0) {
			embed.addField("Global Acknowledgements", `${globalPosArr.join("\n")}`);
			hasAcks = true;
		}
		if (posArr.length > 0) {
			embed.addField("Server Acknowledgements", `${posArr.join("\n")}`);
			hasAcks = true;
		}

		if (args[0] && args[args.length-1].toLowerCase() === "--flags") embed.addField("User Flags", `${qUserDB.flags.join(", ")}`);


		if (qUserDB.ack) embed.setDescription(qUserDB.ack);
		else if (!hasAcks) embed.setDescription("This user has no acknowledgements");

		return message.channel.send(embed);
	}
};
