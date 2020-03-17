const { emoji } = require("../../config.json");
const { dbQuery, dbModify } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "notify",
		permission: 10,
		aliases: ["notifications"],
		usage: "notify <on|off|toggle>",
		description: "Changes your notification settings",
		enabled: true,
		docs: "all/notify",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let qUserDB = await dbQuery("User", { id: message.author.id });
		if (!args[0]) return message.channel.send(`You currently have notifications ${qUserDB.notify ? "**enabled**.\nYou will receive a DM when an action is taken on any of your suggestions": "**disabled**.\nYou will not receive a DM when an action is taken on any of your suggestions."}`);
		switch (args[0].toLowerCase()) {
		case "enable":
		case "on":
		case "true":
		case "yes": {
			if (qUserDB.notify) return message.channel.send(`<:${emoji.x}> You already have notifications enabled!`);
			qUserDB.notify = true;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(`<:${emoji.check}> Notifications have been **enabled**. You will receive a DM when an action is taken on any of your suggestions.`);
		}
		case "disable":
		case "off":
		case "false":
		case "no": {
			if (!qUserDB.notify) return message.channel.send(`<:${emoji.x}> You already have notifications disabled!`);
			qUserDB.notify = false;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(`<:${emoji.check}> Notifications have been **disabled**. You will not receive a DM when an action is taken on any of your suggestions.`);
		}
		case "toggle":
		case "switch": {
			qUserDB.notify = !qUserDB.notify;
			await dbModify("User", {id: qUserDB.id}, qUserDB);
			return message.channel.send(`<:${emoji.check}> Notifications have been ${qUserDB.notify ? "**enabled**. You will receive a DM when an action is taken on any of your suggestions": "**disabled**. You will not receive a DM when an action is taken on any of your suggestions."}`);
		}
		default:
			return message.channel.send(`<:${emoji.x}> You must specify \`on\`, \`off\`, or \`toggle\`.`);
		}
	}
};
