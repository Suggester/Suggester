const { dbQuery, dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { cleanCommand } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "protips",
		permission: 10,
		aliases: ["tip", "tips", "protip", "hint", "hints"],
		usage: "protips (on|off|toggle)",
		description: "Views/edits your protip setting",
		enabled: true,
		examples: "`{{p}}protips`\nShows your protips setting\n\n`{{p}}protips on`\nEnables showing protips\n\n`{{p}}protips off`\nDisables showing protips\n\n`{{p}}protips toggle`\nToggles showing protips",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		dmAvailable: true
	},
	do: async (locale, message, client, args) => {
		const qServerDB = message.guild ? await message.guild.db : null;
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(string(locale, qUserDB.protips ? "PROTIPS_ENABLED" : "PROTIPS_DISABLED")).then(sent => cleanCommand(message, sent, qServerDB));
		switch (args[0].toLowerCase()) {
		case "enable":
		case "on":
		case "true":
		case "yes": {
			if (qUserDB.protips) return message.channel.send(string(locale, "PROTIPS_ALREADY_ENABLED", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			qUserDB.protips = true;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "PROTIPS_ENABLED", {}, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		}
		case "disable":
		case "off":
		case "false":
		case "no": {
			if (!qUserDB.protips) return message.channel.send(string(locale, "PROTIPS_ALREADY_DISABLED", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			qUserDB.protips = false;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "PROTIPS_DISABLED", {}, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		}
		case "toggle":
		case "switch": {
			qUserDB.protips = !qUserDB.protips;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, qUserDB.protips ? "PROTIPS_ENABLED" : "PROTIPS_DISABLED", {}, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		}
		default:
			return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		}
	}
};
