const { joinLeaveLog, guildLog } = require("../coreFunctions.js");
module.exports = (Discord, client, guild) => {
	joinLeaveLog(guild, "leave");
	guildLog(`:outbox_tray: Left Guild: **${guild.name ? guild.name : "Name Unknown"}** (\`${guild.id ? guild.id : "ID Unknown"}\`)\n>>> **Owner:** ${guild.owner && guild.owner.user ? `${guild.owner.user.tag} (\`${guild.owner.id}\`)` : "Owner Tag Unknown"}\n**Member Count:** ${guild.memberCount ? guild.memberCount : "Member Count Unknown"}`, client);
};
