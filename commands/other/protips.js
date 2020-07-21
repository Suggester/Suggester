const { dbQuery, dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "protips",
		permission: 10,
		aliases: ["tip", "tips", "protip"],
		usage: "protips <on|off|toggle>",
		description: "Changes your protip settings",
		enabled: true,
		docs: "all/protips",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		dmAvailable: true
	},
	do: async (locale, message, client, args) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(string(locale, qUserDB.protips ? "PROTIPS_ENABLED" : "PROTIPS_DISABLED"));
		switch (args[0].toLowerCase()) {
		case "enable":
		case "on":
		case "true":
		case "yes": {
			if (qUserDB.protips) return message.channel.send(string(locale, "PROTIPS_ALREADY_ENABLED", {}, "error"));
			qUserDB.protips = true;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "PROTIPS_ENABLED", {}, "success"));
		}
		case "disable":
		case "off":
		case "false":
		case "no": {
			if (!qUserDB.protips) return message.channel.send(string(locale, "PROTIPS_ALREADY_DISABLED", {}, "error"));
			qUserDB.protips = false;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "PROTIPS_DISABLED", {}, "success"));
		}
		case "toggle":
		case "switch": {
			qUserDB.protips = !qUserDB.protips;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, qUserDB.protips ? "PROTIPS_ENABLED" : "PROTIPS_DISABLED", {}, "success"));
		}
		default:
			return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
		}
	}
};
