const { support_invite } = require("../../config.json");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "support",
		permission: 10,
		usage: "support",
		description: "Shows the link to the support server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 5,
		dmAvailable: true,
		docs: "sumup"
	},
	do: (locale, message) => {
		return message.channel.send(string(locale, "SUPPORT_INVITE", { link: `https://discord.gg/${support_invite}` }));
	}
};
