const { joinLeaveLog, guildLog } = require("../utils/logs.js");
module.exports = (Discord, client, guild) => {
	if (process.env.NODE_ENV === "production" || client.config.logServers) {
		joinLeaveLog(guild, "leave");
	}
	guildLog(`📤 Left Guild: **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`)\n>>> **Member Count:** ${guild.memberCount ? guild.memberCount : "Member Count Unknown"}`, {}, client);
};
