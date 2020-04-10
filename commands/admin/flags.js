const { emoji } = require("../../config.json");
const { dbModifyId, dbQuery, fetchUser } = require("../../coreFunctions");
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
		if (!args[0]) return message.channel.send(`<:${emoji.x}> You must specify \`user\` or \`guild\``);
		switch (args[0].toLowerCase()) {
		case "user":
			// eslint-disable-next-line no-case-declarations
			let user = await fetchUser(args[1], client);
			if (!user) user = message.author;
			// eslint-disable-next-line no-case-declarations
			let dbUser = await dbQuery("User", { id: user.id });
			// eslint-disable-next-line no-case-declarations
			let flags = dbUser ? dbUser.flags : null;
			if (!args[2]) return message.channel.send(`\`${user.tag || user.user.tag}\`'s flags are: \`${flags.length > 0 ? flags.join("`, `") : "No Flags Set"}\``);

			if (!args[3]) return message.channel.send(`<:${emoji.x}> You must specify a flag!`);
			// eslint-disable-next-line no-case-declarations
			let flag = args[3].toUpperCase();

			switch(args[2]) {
			case "add":
			case "+": {
				if (flags && flags.includes(flag)) return message.channel.send(`<:${emoji.x}> This user already has flag \`${flag}\``);
				dbUser.flags.push(flag);
				await dbModifyId("User", user.id, dbUser);
				return message.channel.send(`<:${emoji.check}> Added flag \`${flag}\` to **${user.tag}**!`);
			}
			case "remove":
			case "delete":
			case "rm":
			case "-": {
				if (!flags || !flags.includes(flag)) return message.channel.send(`<:${emoji.x}> This user does not have flag \`${flag}\``);
				dbUser.flags.splice(dbUser.flags.findIndex(r => r === flag), 1);
				await dbModifyId("User", user.id, dbUser);
				return message.channel.send(`<:${emoji.check}> Removed flag \`${flag}\` from **${user.tag}**!`);
			}
			default:
				return message.channel.send(`<:${emoji.x}> You must specify \`add\` or \`remove\``);
			}
		case "guild":
		case "server":
			if (!args[1]) return message.channel.send("You must specify a guild ID!");
			// eslint-disable-next-line no-case-declarations
			let guild = args[1];
			// eslint-disable-next-line no-case-declarations
			let dbGuild = await dbQuery("Server", { id: guild });
			// eslint-disable-next-line no-case-declarations
			let guildFlags = dbGuild ? dbGuild.flags : null;
			if (!args[2]) return message.channel.send(`Guild \`${guild}\` has the following flags: \`${guildFlags.length > 0 ? guildFlags.join("`, `") : "No Flags Set"}\``);

			if (!args[3]) return message.channel.send(`<:${emoji.x}> You must specify a flag!`);
			// eslint-disable-next-line no-case-declarations
			let guildFlag = args[3].toUpperCase();

			switch(args[2]) {
			case "add":
			case "+": {
				if (guildFlags && guildFlags.includes(guildFlag)) return message.channel.send(`<:${emoji.x}> This guild already has flag \`${flag}\``);
				dbGuild.flags.push(guildFlag);
				await dbModifyId("Server", guild, dbGuild);
				return message.channel.send(`<:${emoji.check}> Added flag \`${guildFlag}\` to guild \`${guild}\`!`);
			}
			case "remove":
			case "delete":
			case "rm":
			case "-": {
				if (!guildFlags || !guildFlags.includes(guildFlag)) return message.channel.send(`<:${emoji.x}> This guild does not have flag \`${flag}\``);
				dbGuild.flags.splice(dbGuild.flags.findIndex(r => r === guildFlag), 1);
				await dbModifyId("Server", guild, dbGuild);
				return message.channel.send(`<:${emoji.check}> Removed flag \`${guildFlag}\` from guild \`${guild}\`!`);
			}
			default:
				return message.channel.send(`<:${emoji.x}> You must specify \`add\` or \`remove\``);
			}
		}
	}
};
