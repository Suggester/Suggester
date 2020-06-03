const { fetchUser } = require("../../utils/misc");
const { dbQuery } = require("../../utils/db");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "nukebean",
		permission: 0,
		usage: "nukebean <member> (reason)",
		description: "Nukebeans a member from the server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (locale, message, client, args, Discord) => {
		let user = await fetchUser(args[0], client);
		if (!user) return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));
		let foundMember = true;
		let member = await message.guild.members.fetch(user.id).catch(() => foundMember = false);
		if (!member || !foundMember) return message.channel.send(string(locale, "INVALID_USER_ERROR", {}, "error"));

		let beanSendEmbed = new Discord.MessageEmbed()
			.setColor("#AAD136")
			.setImage("https://media.tenor.com/images/334d8d0f9bf947f31256cdaacc7f6cf0/tenor.gif");

		if (args[1]) beanSendEmbed.setDescription(args.splice(1).join(" "));

		if (!global.beans) global.beans = [];
		global.beans[member.id] = {
			count: 0
		};

		client.on("message", (message) => {
			if (message.author.id === member.id && global.beans[member.id].count < 5) {
				message.react("nukebean:666102191895085087");
				global.beans[member.id].count++;
			}
		});

		let qUserDB = await dbQuery("User", {id: user.id});

		message.channel.send(`<:nukebean:666102191895085087> Nukebeaned ${user.tag} (\`${member.id}\`)`, beanSendEmbed);
		if (qUserDB.notify) member.user.send(`<:nukebean:666102191895085087> **You have been nukebeaned from ${message.guild.name}**`, beanSendEmbed).catch(() => {});
	}
};
