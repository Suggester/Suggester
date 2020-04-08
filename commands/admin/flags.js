const { emoji } = require("../../config.json");
const { dbModifyId, dbQuery, fetchUser } = require("../../coreFunctions");
module.exports = {
	controls: {
		name: "flags",
		permission: 0,
		usage: "flags <user> (add|remove) (flag)",
		aliases: ["flag"],
		description: "Sets internal flags for a user",
		enabled: true,
		docs: "",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args) => {
		let user = await fetchUser(args[0], client);
		if (!user) user = message.author;
		let dbUser = await dbQuery("User", { id: user.id });
		let flags = dbUser ? dbUser.flags : null;
		if (!args[1]) return message.channel.send(`\`${user.tag || user.user.tag}\`'s flags are: \`${flags.length > 0 ? flags.join("`, `") : "No Flags Set"}\``);

		let flag = args[2].toUpperCase();

		switch(args[1]) {
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
	}
};
