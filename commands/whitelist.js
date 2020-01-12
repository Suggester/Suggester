const { emoji } = require("../config.json");
const { dbModifyId, dbDeleteOne } = require("../coreFunctions");
module.exports = {
	controls: {
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
			await dbModifyId("Server", args[1], { whitelist: true });
			return message.channel.send(`<:${emoji.check}> Whitelisted guild with ID \`${args[1]}\``);
		}
		case "remove":
		case "rm":
		case "-": {
			if (!args[1]) return message.channel.send(`<:${emoji.x}> You must specify a guild!`);
			await dbModifyId("Server", args[1], { whitelist: false });
			return message.channel.send(`<:${emoji.check}> Unwhitelisted guild with ID \`${args[1]}\``);
		}
		}
	}
};
