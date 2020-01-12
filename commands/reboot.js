const { coreLog } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 0,
		aliases: ["refresh", "shutdown", "restart"],
		usage: "reboot",
		description: "Reboots the bot by exiting the process",
		enabled: true,
		hidden: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async (message, client) => {
		await message.channel.send("Shutting down...");
		await coreLog(`🔌 ${message.author.tag} (\`${message.author.id}\`) initiated a reboot`);
		return process.exit(0);
	}
};
