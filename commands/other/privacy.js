const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "privacy",
		permission: 10,
		usage: "privacy",
		description: "Shows the link to Suggester's Privacy Policy",
		aliases: ["legal"],
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 5,
		dmAvailable: true,
		docs: "legal"
	},
	do: (locale, message) => {
		return message.channel.send(string(locale, "PRIVACY_INFO", { link: "https://suggester.js.org/#/legal" }));
	}
};
