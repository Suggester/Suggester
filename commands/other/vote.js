module.exports = {
	controls: {
		name: "vote",
		permission: 10,
		usage: "vote",
		description: "Shows the link to info about voting",
		enabled: true,
		docs: "all/vote",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async message => {
		return message.reply("You can find more info about voting and the cool perks here: https://suggester.js.org/#/supporting/info");
	}
};
