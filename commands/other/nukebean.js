const { string } = require("../../utils/strings");
const { fetchUser } = require("../../utils/misc");
const { dbQuery } = require("../../utils/db");
module.exports = {
	controls: {
		name: "nukebean",
		permission: 0,
		usage: "nukebean [user]",
		description: "Nukebeans a user",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "EMBED_LINKS"],
		cooldown: 60,
		hidden: true
	},
	do: async (locale, message, client, args, Discord) => {
		if (!args[0]) return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));

		let user = await fetchUser(args[0], client);
		if (!user || user.id === "0") return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));

		await message.guild.members.fetch(user.id).catch(() => {});
		if (!message.guild.members.cache.get(user.id)) return message.channel.send(string(locale, "INVALID_MEMBER_ERROR", {}, "error"));

		let qUserDB = await dbQuery("User", {id: user.id});
		let reverse = false;
		if (qUserDB.flags.includes("UNBEANABLE")) {
			let qSenderDB = await dbQuery("User", {id: message.author.id});
			if (!qSenderDB.flags.includes("UNBEANABLE")) {
				user = message.author;
				reverse = true;
			}
		}

		let reason = string(locale, "NO_REASON");
		if (args[1]) {
			reason = args.splice(1).join(" ") || string(locale, "NO_REASON");
			if (reason.length > 1024) return message.channel.send(string(locale, "BEAN_REASON_TOO_LONG_ERROR", {}, "error"));
		}

		if (qUserDB.notify && !user.bot) user.send(`<:nukebean:666102191895085087> ${string(locale, "NUKEBEAN_DM", { guild: message.guild.name })}`, new Discord.MessageEmbed().setDescription(reason).setColor(client.colors.bean).setImage(reverse ? "https://media.tenor.com/images/70ecc1486c82734ffddedfb4ffb622de/tenor.gif" : "https://media1.tenor.com/images/2e50750a1356ee2cf828090cbb864634/tenor.gif")).catch(() => {});
		message.channel.send(`<:nukebean:666102191895085087> ${string(locale, "NUKEBEAN_SUCCESS", { user: user.tag, id: user.id })}`, new Discord.MessageEmbed().setDescription(reason).setColor(client.colors.bean).setImage(reverse ? "https://media.tenor.com/images/70ecc1486c82734ffddedfb4ffb622de/tenor.gif" : "https://media1.tenor.com/images/2e50750a1356ee2cf828090cbb864634/tenor.gif"), { disableMentions: "all" });
	}
};
