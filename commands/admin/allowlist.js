const { dbModifyId, dbQuery } = require("../../utils/db");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "allowlist",
		permission: 1,
		aliases: ["al"],
		usage: "allowlist [add/remove] [guild id]",
		description: "Adds a server to the allowed list",
		examples: "`{{p}}allowlist add 681490407862829073`\nAdds server 681490407862829073 to the allowed list\n\n`{{p}}allowlist remove 681490407862829073`\nRemoves server 681490407862829073 from the allowed list",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (locale, message, client, args) => {
		switch (args[0]) {
		case "add":
		case "+": {
			if (!args[1]) return message.channel.send(string(locale, "INVALID_GUILD_ID_ERROR", {}, "error"));
			let qServerDB = await dbQuery("Server", {id: args[1]});
			qServerDB.allowlist = true;
			await dbModifyId("Server", qServerDB.id, qServerDB);
			return message.channel.send(string(locale, "GUILD_ALLOWLIST_ADD_SUCCESS", { guild: qServerDB.id }, "success"));
		}
		case "remove":
		case "rm":
		case "-": {
			if (!args[1]) return message.channel.send(string(locale, "INVALID_GUILD_ID_ERROR", {}, "error"));
			let qServerDB = await dbQuery("Server", {id: args[1]});
			qServerDB.allowlist = false;
			await dbModifyId("Server", qServerDB.id, qServerDB);
			return message.channel.send(string(locale, "GUILD_ALLOWLIST_REMOVE_SUCCESS", { guild: qServerDB.id }, "success"));
		}
		default:
			return message.channel.send(string(locale, "ADD_REMOVE_INVALID_ACTION_ERROR", {}, "error"));
		}
	}
};
