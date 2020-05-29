const { coreLog } = require("../../utils/logs");
const { confirmation } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "reboot",
		permission: 0,
		aliases: ["refresh", "shutdown", "restart"],
		usage: "reboot",
		description: "Reboots the bot by exiting the process",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async (message, client) => {
		if ((
			await confirmation(
				message,
				`:warning: Are you sure you would like to reboot **${client.user.username}**?`,
				{
					deleteAfterReaction: true
				}
			)
		)) {
			await coreLog(`🔌 ${message.author.tag} (\`${message.author.id}\`) initiated a reboot`, client);
			await message.channel.send("Shutting down...");
			return process.exit(0);
		}
	}
};
