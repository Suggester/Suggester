const { guildLog } = require("../coreFunctions.js");
module.exports = (Discord, client, guild) => {
	guildLog(`:outbox_tray: Left Guild: **${guild.name}** (${guild.id})\n>>> **Owner:** ${guild.owner.user.tag}\n**Member Count:** ${guild.memberCount}`, client);
};
