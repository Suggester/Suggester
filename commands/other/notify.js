const { dbQuery, dbModify } = require("../../utils/db");
const { string } = require("../../utils/strings");
const { cleanCommand } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "notify",
		permission: 10,
		aliases: ["notifications"],
		usage: "notify (on|off|toggle)",
		description: "Views/edits your notification settings",
		enabled: true,
		examples: "`{{p}}notify`\nShows your DM notification setting\n\n`{{p}}notify on`\nEnables DM notifications for suggestion changes\n\n`{{p}}notify off`\nDisables DM notifications for suggestion changes\n\n`{{p}}notify toggle`\nToggles DM notifications for suggestion changes",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		dmAvailable: true,
		docs: "sumup"
	},
	do: async (locale, message, client, args) => {
		const qServerDB = message.guild ? await message.guild.db : null;
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(string(locale, qUserDB.notify ? "NOTIFICATIONS_ENABLED" : "NOTIFICATIONS_DISABLED")).then(sent => cleanCommand(message, sent, qServerDB));
		switch (args[0].toLowerCase()) {
		case "enable":
		case "on":
		case "true":
		case "yes": {
			if (qUserDB.notify) return message.channel.send(string(locale, "NOTIFICATIONS_ALREADY_ENABLED", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			qUserDB.notify = true;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "NOTIFICATIONS_ENABLED", {}, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		}
		case "disable":
		case "off":
		case "false":
		case "no": {
			if (!qUserDB.notify) return message.channel.send(string(locale, "NOTIFICATIONS_ALREADY_DISABLED", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			qUserDB.notify = false;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, "NOTIFICATIONS_DISABLED", {}, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		}
		case "toggle":
		case "switch": {
			qUserDB.notify = !qUserDB.notify;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(string(locale, qUserDB.notify ? "NOTIFICATIONS_ENABLED" : "NOTIFICATIONS_DISABLED", {}, "success")).then(sent => cleanCommand(message, sent, qServerDB));
		}
		default:
			return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
		}
	}
};
