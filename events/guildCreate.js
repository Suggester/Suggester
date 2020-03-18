const { dbQuery, guildLog } = require("../coreFunctions.js");
const { release } = require("../config.json");
module.exports = async (Discord, client, guild) => {
	let qServerDB = await dbQuery("Server", { id: guild.id });
	if (qServerDB && qServerDB.blocked) {
		await guild.leave();
		return guildLog(`:no_entry: I was added to blacklisted guild **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`) and left`, client);
	}

	let enforceWhitelist = [
		"canary",
		"special",
		"premium"
	];
	if ((enforceWhitelist.includes(release)) && !qServerDB.whitelist) {
		await guild.leave();
		return guildLog(`:no_entry: I was added to non-whitelisted guild **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`) and left`, client);
	}

	await guildLog(`:inbox_tray: New Guild: **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`)\n>>> **Owner:** ${guild.owner && guild.owner.user ? `${guild.owner.user.tag} (\`${guild.owner.id}\`)` : "Owner Tag Unknown"}\n**Member Count:** ${guild.memberCount ? guild.memberCount : "Member Count Unknown"}`, client);
};
