const { dbQuery, dbModifyId, fetchUser } = require("../../coreFunctions");
const { string } = require("../../utils/strings");

module.exports = {
	controls: {
		name: "globalban",
		permission: 1,
		usage: "globalban <guild|user> <id> [true|false]",
		description: "Excludes a user or server from using the bot globally",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args) => {
		let type = args.shift();
		switch (type) {
		case "user": {
			if (!args[0]) return message.channel.send(string("INVALID_USER_ERROR", {}, "error"));
			let foundUser = await fetchUser(args[0], client);
			if (!foundUser) return message.channel.send(string("INVALID_USER_ERROR", {}, "error"));
			if (args[1] && !(args[1] === "true" || args[1] === "false")) return message.channel.send(string("INVALID_GLOBALBAN_PARAMS_ERROR", {}, "error"));
			let qUserDB = await dbQuery("User", { id: foundUser.id });
			if (!args[1]) {
				let { blocked } = qUserDB;
				return message.channel.send(string(blocked ? "IS_GLOBALLY_BANNED" : "IS_NOT_GLOBALLY_BANNED", { banned: foundUser.tag }));
			}
			if (qUserDB.flags && qUserDB.flags.includes("PROTECTED")) return message.channel.send(string("USER_PROTECTED_ERROR", {}, "error"));
			if (args[1] === "true") qUserDB.blocked = true;
			else if (args[1] === "false") qUserDB.blocked = false;
			await dbModifyId("User", foundUser.id, qUserDB);
			return message.channel.send(string(qUserDB.blocked ? "IS_GLOBALLY_BANNED" : "IS_NOT_GLOBALLY_BANNED", { banned: foundUser.tag }, "success"));
		}
		case "server":
		case "guild": {
			if (!args[0]) return message.channel.send(string("INVALID_GUILD_ID_ERROR", {}, "error"));
			let foundGuild = client.guilds.cache.get(args[0]);
			if (args[1] && !(args[1] === "true" || args[1] === "false")) return message.channel.send(string("INVALID_GLOBALBAN_PARAMS_ERROR", {}, "error"));
			let qServerDB = await dbQuery("Server", { id: args[0] });
			if (!args[1]) {
				let { blocked } = qServerDB;
				return message.channel.send(blocked ? string("IS_GLOBALLY_BANNED", { banned: foundGuild ? foundGuild.name : args[0] }) : string("IS_NOT_GLOBALLY_BANNED", { banned: foundGuild ? foundGuild.name : args[0] }));
			}
			if (qServerDB.flags && qServerDB.flags.includes("PROTECTED")) return message.channel.send(string("GUILD_PROTECTED_ERROR", {}, "error"));
			if (args[1] === "true") qServerDB.blocked = true;
			else if (args[1] === "false") qServerDB.blocked = false;
			await dbModifyId("Server", args[0], qServerDB);
			if (foundGuild && qServerDB.blocked) foundGuild.leave();
			return message.channel.send(qServerDB.blocked ? string("IS_GLOBALLY_BANNED", { banned: foundGuild ? foundGuild.name : args[0] }, "success") : string("IS_NOT_GLOBALLY_BANNED", { banned: foundGuild ? foundGuild.name : args[0] }, "success"));
		}
		default: {
			return message.channel.send(string("SPECIFY_USER_OR_GUILD_ERROR", {}, "error"));
		}
		}

	}
};
