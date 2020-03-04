const { emoji } = require("../../config.json");
const { dbModifyId, dbQuery } = require("../../coreFunctions");
module.exports = {
	controls: {
		name: "whitelist",
		permission: 1,
		aliases: ["wl"],
		usage: "whitelist <guild id>",
		description: "Whitelists a server",
		enabled: true,
		hidden: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args) => {
		switch (args[0]) {
		case "add":
		case "+": {
			if (!args[1]) return message.channel.send(`<:${emoji.x}> You must specify a guild!`);
			let qServerDB = await dbQuery("Server", {id: args[1]});
			qServerDB.whitelist = true;
			await dbModifyId("Server", qServerDB.id, qServerDB);
			return message.channel.send(`<:${emoji.check}> Whitelisted guild with ID \`${qServerDB.id}\``);
		}
		case "remove":
		case "rm":
		case "-": {
			if (!args[1]) return message.channel.send(`<:${emoji.x}> You must specify a guild!`);
			let qServerDB = await dbQuery("Server", {id: args[1]});
			qServerDB.whitelist = false;
			await dbModifyId("Server", qServerDB.id, qServerDB);
			return message.channel.send(`<:${emoji.check}> Unwhitelisted guild with ID \`${args[1]}\``);
		}
		}
	}
};
