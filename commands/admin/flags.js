const { fetchUser } = require("../../utils/misc");
const { dbModifyId, dbQuery } = require("../../utils/db");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "flags",
		permission: 0,
		usage: "flags <guild|user> <id> (add|remove) (flag)",
		aliases: ["flag"],
		description: "Sets internal flags for a user",
		enabled: true,
		docs: "",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args) => {
		if (!args[0]) return message.channel.send(string("SPECIFY_USER_OR_GUILD_ERROR", {}, "error"));
		switch (args[0].toLowerCase()) {
		case "user":
			// eslint-disable-next-line no-case-declarations
			let user = await fetchUser(args[1], client);
			if (!user || user.id === "0") user = message.author;
			// eslint-disable-next-line no-case-declarations
			let dbUser = await dbQuery("User", { id: user.id });
			// eslint-disable-next-line no-case-declarations
			let flags = dbUser ? dbUser.flags : null;
			if (!args[2]) return message.channel.send(string("USER_FLAGS_LIST", { user: user.tag, flags: flags.length > 0 ? flags.join("`, `") : string("NO_FLAGS_SET") }));

			if (!args[3]) return message.channel.send(string("NO_FLAG_SPECIFIED_ERROR", {}, "error"));
			// eslint-disable-next-line no-case-declarations
			let flag = args[3].toUpperCase();

			switch(args[2]) {
			case "add":
			case "+": {
				if (flags && flags.includes(flag)) return message.channel.send(string("FLAG_ALREADY_PRESENT_ERROR", { flag: flag }, "error"));
				dbUser.flags.push(flag);
				await dbModifyId("User", user.id, dbUser);
				return message.channel.send(string("FLAG_ADDED_USER_SUCCESS", { user: user.tag, flag: flag }, "success"));
			}
			case "remove":
			case "delete":
			case "rm":
			case "-": {
				if (!flags || !flags.includes(flag)) return message.channel.send(string("FLAG_NOT_PRESENT_ERROR", { flag: flag }, "error"));
				dbUser.flags.splice(dbUser.flags.findIndex(r => r === flag), 1);
				await dbModifyId("User", user.id, dbUser);
				return message.channel.send(string("FLAG_REMOVED_USER_SUCCESS", { user: user.tag, flag: flag }, "success"));
			}
			default:
				return message.channel.send(string("ADD_REMOVE_INVALID_ACTION_ERROR", {}, "error"));
			}
		case "guild":
		case "server":
			if (!args[1]) return message.channel.send(string("INVALID_GUILD_ID_ERROR", {}, "error"));
			// eslint-disable-next-line no-case-declarations
			let guild = args[1];
			// eslint-disable-next-line no-case-declarations
			let dbGuild = await dbQuery("Server", { id: guild });
			// eslint-disable-next-line no-case-declarations
			let guildFlags = dbGuild ? dbGuild.flags : null;
			if (!args[2]) return message.channel.send(string("GUILD_FLAGS_LIST", { guild: guild, flags: guildFlags.length > 0 ? guildFlags.join("`, `") : string("NO_FLAGS_SET") }));

			if (!args[3]) return message.channel.send(string("NO_FLAG_SPECIFIED_ERROR", {}, "error"));
			// eslint-disable-next-line no-case-declarations
			let guildFlag = args[3].toUpperCase();

			switch(args[2]) {
			case "add":
			case "+": {
				if (guildFlags && guildFlags.includes(guildFlag)) return message.channel.send(string("FLAG_ALREADY_PRESENT_ERROR", { flag: guildFlag }, "error"));
				dbGuild.flags.push(guildFlag);
				await dbModifyId("Server", guild, dbGuild);
				return message.channel.send(string("FLAG_ADDED_GUILD_SUCCESS", { flag: guildFlag, guild: guild }, "success"));
			}
			case "remove":
			case "delete":
			case "rm":
			case "-": {
				if (!guildFlags || !guildFlags.includes(guildFlag)) return message.channel.send(string("FLAG_NOT_PRESENT_ERROR", { flag: guildFlag }, "error"));
				dbGuild.flags.splice(dbGuild.flags.findIndex(r => r === guildFlag), 1);
				await dbModifyId("Server", guild, dbGuild);
				return message.channel.send(string("FLAG_REMOVED_GUILD_SUCCESS", { flag: guildFlag, guild: guild }, "success"));
			}
			default:
				return message.channel.send(string("ADD_REMOVE_INVALID_ACTION_ERROR", {}, "error"));
			}
		default:
			return message.channel.send(string("SPECIFY_USER_OR_GUILD_ERROR", {}, "error"));
		}
	}
};
