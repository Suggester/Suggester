const { guildLog, joinLeaveLog } = require("../utils/logs");
const { dbQuery } = require("../utils/db");
const { release, prefix, support_invite, colors } = require("../config.json");
const { string } = require("../utils/strings");
module.exports = async (Discord, client, guild) => {
	if (process.env.NODE_ENV === "production" || client.config.logServers) {
		joinLeaveLog(guild, "join");
	}

	if (!guild.available) return;

	let qServerDB = await dbQuery("Server", { id: guild.id });
	if (qServerDB && qServerDB.blocked) {
		await guild.leave();
		return guildLog(`⛔ I was added to blacklisted guild **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`) and left`, {}, client);
	}

	let enforceWhitelist = [
		"special",
		"premium"
	];
	if ((enforceWhitelist.includes(release)) && (!qServerDB || !qServerDB.whitelist)) {
		await guild.leave();
		return guildLog(`⛔ I was added to non-whitelisted guild **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`) and left`, {}, client);
	}

	await guildLog(`📥 New Guild: **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`)\n>>> **Member Count:** ${guild.memberCount ? guild.memberCount : "Member Count Unknown"}`, {}, client);

	await guild.members.fetch(client.user.id);
	if (guild.me.joinedTimestamp+60000<Date.now()) return;

	let locale = "en";

	let embed = new Discord.MessageEmbed()
		.setAuthor(string(locale, "TUTORIAL_HEADER"), client.user.displayAvatarURL({format: "png"}))
		.setColor(colors.default)
		.setDescription(string(locale, "TUTORIAL_DESC", { prefix: prefix }))
		.addField(string(locale, "TUTORIAL_GET_STARTED_HEADER"), string(locale, "TUTORIAL_GET_STARTED_DESCRIPTION", { prefix: prefix }))
		.addField(string(locale, "TUTORIAL_NEXT_HEADER"), string(locale, "TUTORIAL_NEXT_DESCRIPTION", { prefix: prefix, invite: `https://discord.gg/${support_invite}` }));
	let names = ["staff", "admin", "mod", "bot", "general"];
	let channelsFetch = guild.channels.cache.filter(c => names.filter(a => c.name.includes(a)).length > 0 && c.type === "text" && c.permissionsFor(client.user.id).has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]) && !c.name.includes("log"));
	if (channelsFetch.size > 0) return channelsFetch.first().send(embed);
	let notNames = ["rules", "announcements", "news", "info", "welcome", "log"];
	let channelsFetch2 = guild.channels.cache.filter(c => notNames.filter(a => c.name.includes(a)).length === 0 && c.type === "text" && c.permissionsFor(client.user.id).has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"]));
	if (channelsFetch2.size > 0) return channelsFetch2.first().send(embed);
};
