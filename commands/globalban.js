const { emoji } = require("../config.json");
const { dbQuery, dbModifyId, fetchUser } = require("../coreFunctions");

module.exports = {
	controls: {
		permission: 1,
		usage: "globalban <guild|user> <id> [true|false]",
		description: "Excludes a user or server from using the bot globally",
		enabled: true,
		hidden: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args) => {
		let type = args.shift();
		switch (type) {
		case "user": {
			if (!args[0]) return message.channel.send(`<:${emoji.x}> You must specify a user!`);
			let foundUser = await fetchUser(args[0], client);
			if (!foundUser) return message.channel.send(`<:${emoji.x}> User not found. If this is a valid ID, please try again.`);
			if (args[1] && !(args[1] === "true" || args[1] === "false")) return message.channel.send(`<:${emoji.x}> Invalid setting. Specify \`true\` to block the user and \`false\` to unblock the user.`);
			let qUserDB = await dbQuery("User", { id: foundUser.id });
			if (!args[1]) {
				let { blocked } = qUserDB;
				return message.channel.send(`<:${emoji.check}> \`${foundUser.tag}\`is ${blocked ? "" : "not "}globally blocked.`);
			}

			if (args[1] === "true") qUserDB.blocked = true;
			else if (args[1] === "false") qUserDB.blocked = false;
			await dbModifyId("User", foundUser.id, qUserDB);
			return message.channel.send(`<:${emoji.check}> \`${foundUser.tag}\`is ${!qUserDB.blocked ? "no longer" : "now"} globally blocked.`);
		}
		case "server":
		case "guild": {
			if (!args[0]) return message.channel.send(`<:${emoji.x}> Please specify a guild!`);
			let foundGuild = client.guilds.get(args[0]);
			if (args[1] && !(args[1] === "true" || args[1] === "false")) return message.channel.send(`<:${emoji.x}> Invalid setting. Specify \`true\` to block the server and \`false\` to unblock the server.`);
			let qServerDB = await dbQuery("Server", { id: args[0] });
			if (!args[1]) {
				let { blocked } = qServerDB;
				return message.channel.send(`<:${emoji.check}> \`${foundGuild ? foundGuild.name : args[0]}\`is ${blocked ? "" : "not "}globally blocked.`);
			}
			if (args[1] === "true") qServerDB.blocked = true;
			else if (args[1] === "false") qServerDB.blocked = false;
			await dbModifyId("Server", args[0], qServerDB);
			if (foundGuild && qServerDB.blocked) foundGuild.leave();
			return message.channel.send(`<:${emoji.check}> \`${foundGuild ? foundGuild.name : args[0]}\`is ${qServerDB.blocked ? "now" : "no longer"} globally blocked.`);
		}
		default: {
			return message.reply(`<:${emoji.x}> You must specify either \`user\` or \`guild\`.`);
		}
		}

	}
};
