const { emoji } = require("../config.json");
const { dbQuery, dbModifyId } = require("../coreFunctions");

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
			let foundUser = client.users.find((user) => user.id === args[0]) ||
				message.mentions.members.first() ||
				await client.fetchUser(args[0], true);
			if (!foundUser) return message.channel.send(`<:${emoji.x}> User not found.`);
			if (args[1] && !(args[1] === "true" || args[1] === "false")) return message.channel.send(`<:${emoji.x}> Incorrect usage.`);
			if (!args[1]) {
				let { blocked } = await dbQuery("User", { id: foundUser.id });
				return message.channel.send(`<:${emoji.check}> \`${foundUser.user.tag}\`is ${blocked ? "" : "not "}globally blocked.`);
			}
			let { blocked } = await dbModifyId("User", foundUser.id, { blocked: args[1] });
			return message.channel.send(`<:${emoji.check}> \`${foundUser.user.tag}\`is ${blocked ? "now" : "no longer"} globally blocked.`);
		}
		case "server":
		case "guild": {
			if (!args[0]) return message.channel.send(`<:${emoji.x}> Please specify a guild!`);
			let foundGuild = client.guilds.get(args[0]);
			if (args[1] && !(args[1] === "true" || args[1] === "false")) return message.channel.send(`<:${emoji.x}> Incorrect usage.`);
			if (!args[1]) {
				let { blocked } = await dbQuery("Server", { id: args[0] });
				return message.channel.send(`<:${emoji.check}> \`${foundGuild ? foundGuild.name : args[0]}\`is ${blocked ? "" : "not "}globally blocked.`);
			}
			if (!foundGuild) {
				message.channel.send(`I am not in this guild but I will ${JSON.parse(args[1]) ? "" : "un"}block it anyways.`);
			}
			let { blocked } = await dbModifyId("Server", args[0],{ blocked: args[1] });
			return message.channel.send(`<:${emoji.check}> \`${foundGuild ? foundGuild.name : args[0]}\`is ${blocked ? "now" : "no longer"} globally blocked.`);
		}
		default: {
			return message.reply(`<:${emoji.x}> You must specify either \`user\` or \`guild\`.`);
		}
		}

	}
};
