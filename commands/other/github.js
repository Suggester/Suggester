const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "github",
		permission: 10,
		usage: "github",
		description: "Shows the link to Suggester's GitHub repository",
		aliases: ["source", "src"],
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		cooldown: 5,
		dmAvailable: true,
		docs: "sumup"
	},
	do: (locale, message) => {
		return message.channel.send(string(locale, "GITHUB_REPO", { link: "https://github.com/Suggester/Suggester" }));
	}
};
