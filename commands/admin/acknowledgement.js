const { fetchUser } = require("../../utils/misc");
const { dbModifyId, dbQuery } = require("../../utils/db");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "acknowledgement",
		permission: 1,
		usage: "acknowledgement [user] (new acknowledgement)",
		aliases: ["ack", "setack", "setacknowledgement", "addack"],
		description: "Sets a verify acknowledgement for a user",
		examples: "`{{p}}acknowledgement`\nShows your acknowledgement\n\n`{{p}}acknowledgement @Brightness™`\nShows Brightness™'s acknowledgement\n\n`{{p}}acknowledgement @Brightness™ Test`\nSets Brightness™'s acknowledgement to \"Test\"\n\n`{{p}}acknowledgement @Brightness™ reset`\nResets Brightness™'s acknowledgement",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (locale, message, client, args) => {
		let user = await fetchUser(args[0], client);
		if (!args[1]) {
			if (!user || user.id === "0") user = message.author;
			let dbUser = await dbQuery("User", { id: user.id });
			let ack = dbUser && dbUser.ack ? dbUser.ack : string(locale, "NO_ACK_SET");
			return message.channel.send(string(locale, "ACK_FILLER_TEXT", { user: user.tag, acknowledgement: ack }));
		}

		if (!user || user.id === "0") return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));
		let ack = args.slice(1).join(" ");
		if (ack.toLowerCase() === "reset") {
			await dbModifyId("User", user.id, { ack: undefined });
			return message.channel.send(string(locale, "ACK_RESET_SUCCESS", { user: user.tag }, "success"));
		}
		await dbModifyId("User", user.id, { ack: ack });
		return message.channel.send(string(locale, "ACK_SET_SUCCESS", { user: user.tag, acknowledgement: ack }, "success"));
	}
};
