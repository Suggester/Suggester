const { colors, developer, main_guild, global_override } = require("../../config.json");
const { dbQuery, checkPermissions, fetchUser } = require("../../coreFunctions");
module.exports = {
	controls: {
		name: "verify",
		permission: 10,
		usage: "verify",
		description: "Shows permissions of a user as they relate to the bot",
		enabled: true,
		docs: "all/verify",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let user = await fetchUser(args[0], client);
		let id;
		user ? id = user.id : id = message.author.id;

		let qUserDB = await dbQuery("User", { id: id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });

		let globalPosArr = [];
		let posArr = [];
		if (developer.includes(id)) globalPosArr.push("<:suggester:621530308592009242> Developer");
		if (developer.includes(id)) globalPosArr.push("<:suggester:621530308592009242> Global Administrator");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get(global_override).members.get(id)) globalPosArr.push("<:suggester:621530308592009242> Global Permissions");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("566029891590422566").members.get(id)) globalPosArr.push("<:suggester:621530308592009242> Suggester Server Moderator");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("566030511840034816").members.get(id)) globalPosArr.push("<:support:643571568638689332> Suggester Support Team");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("657644875499569161").members.get(id)) globalPosArr.push("<:bean:657650134502604811> Global Bean Permissions");

		if (qUserDB.blocked) globalPosArr.push(":no_entry_sign: Blacklisted Globally");

		if (message.guild.members.cache.get(id) && message.guild.members.cache.get(id).hasPermission("MANAGE_GUILD")) {
			posArr.push(":tools: Server Admin");
		} else if (qServerDB && qServerDB.config.admin_roles && message.guild.members.cache.get(id)) {
			let adminRoles = 0;
			qServerDB.config.admin_roles.forEach((roleid) => {
				if (message.guild.members.cache.get(id).roles.cache.has(roleid)) adminRoles++;
			});
			if (adminRoles > 0) posArr.push(":tools: Server Admin");
		}

		if (qServerDB && qServerDB.config.staff_roles && message.guild.members.cache.get(id)) {
			let staffRoles = 0;
			qServerDB.config.staff_roles.forEach((roleid) => {
				if (message.guild.members.cache.get(id).roles.cache.has(roleid)) staffRoles++;
			});
			if (staffRoles > 0) posArr.push(":tools: Server Staff");
		}
		if (qServerDB && qServerDB.config.blacklist.includes(id)) posArr.push(":no_entry_sign: Blacklisted on this server");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("614084573139173389").members.get(id)) globalPosArr.push("<:canary:621530343081508899> Suggester Canary Program");

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
		if (qUserDB.beans) {
			let beans = qUserDB.beans;
			let beanCountTotal = beans.sent.bean+beans.sent.megabean+beans.sent.nukebean+beans.received.bean+beans.received.megabean+beans.received.nukebean;
			if (beanCountTotal > 0) {
				embed.addField("Received Bean Statistics <:bean:657650134502604811>", `<:bean:657650134502604811> ${beans.received.bean} beans\n<:hyperbean:666099809668694066> ${beans.received.megabean} megabeans\n<:nukebean:666102191895085087> ${beans.received.nukebean} nukebeans`)
					.addField("Sent Bean Statistics <:bean:657650134502604811>", `<:bean:657650134502604811> ${beans.sent.bean} beans\n<:hyperbean:666099809668694066> ${beans.sent.megabean} megabeans\n<:nukebean:666102191895085087> ${beans.sent.nukebean} nukebeans`);
				hasAcks = true;
			}
		}

		if (qUserDB.ack) embed.setDescription(qUserDB.ack);
		else if (!hasAcks) embed.setDescription("This user has no acknowledgements");

		return message.channel.send(embed);
	}
};
