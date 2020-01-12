const { emoji } = require("../config.json");
const { dbModifyId, dbQuery } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 1,
		usage: "acknowledgement <user> (new acknowledgement)",
		aliases: ["ack", "setack", "setacknowledgement", "addack"],
		description: "Sets a verify acknowledgement for a user",
		enabled: true,
		docs: "",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args) => {
		let user = client.users.find((user) => user.id === args[0]) || message.mentions.members.first();
		if (!user || !args[1]) {
			if (!user) user = message.author;
			let dbUser = await dbQuery("User", { id: user.id });
			let ack = dbUser ? dbUser.ack : "No Acknowledgement Set";
			return message.channel.send(`\`${user.tag || user.user.tag}\`'s acknowledgement is: \`${ack || "no acknowledgement set"}\``);
		}

		let ack = args.slice(1).join(" ");
		if (ack.toLowerCase() === "reset") {
			await dbModifyId("User", user.id, { ack: undefined });
			return message.channel.send(`<:${emoji.check}> \`${user.user.tag}\`'s acknowledgement has been reset.`);
		}
		await dbModifyId("User", user.id, { ack: ack });
		return message.channel.send(`<:${emoji.check}> Set \`${user.tag || user.user.tag}\`'s acknowledgement to **${ack}**`);
	}
};
