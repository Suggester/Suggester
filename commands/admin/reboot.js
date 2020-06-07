const { coreLog } = require("../../utils/logs");
const { confirmation } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "reboot",
		permission: 0,
		aliases: ["refresh", "shutdown", "restart"],
		usage: "reboot (shard id)",
		description: "Reboots the bot by exiting the process",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async (locale, message, client, args) => {
		let toReboot = args[0] || "all";
		if ((
			await confirmation(
				message,
				`:warning: Are you sure you would like to reboot ${toReboot !== "all" ? `__shard ${toReboot}__` : "__all shards__"} of **${client.user.username}**?`,
				{
					deleteAfterReaction: true
				}
			)
		)) {
			await coreLog(`🔌 ${message.author.tag} (\`${message.author.id}\`) initiated a reboot`, client);
			await message.channel.send(`Rebooting ${toReboot !== "all" ? `shard ${toReboot}` : "all shards"}...`);
			if (toReboot === "all") return client.shard.respawnAll();
			client.shard.broadcastEval(`if (this.shard.ids[0] === ${toReboot}) process.exit()`);
		}
	}
};
