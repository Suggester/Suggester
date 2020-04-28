const { dbQuery, fetchUser } = require("../../coreFunctions");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "megabean",
		permission: 0,
		usage: "megabean <member> (reason)",
		description: "Megabeans a member from the server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let user = await fetchUser(args[0], client);
		if (!user) return message.channel.send(string("INVALID_USER_ERROR", {}, "error"));
		let foundMember = true;
		let member = await message.guild.members.fetch(user.id).catch(() => foundMember = false);
		if (!member || !foundMember) return message.channel.send(string("INVALID_USER_ERROR", {}, "error"));

		let beanSendEmbed = new Discord.MessageEmbed()
			.setColor("#AAD136")
			.setImage("https://media.tenor.com/images/be3750a3b77c26295ae4bc16d9543d63/tenor.gif");

		if (args[1]) beanSendEmbed.setDescription(args.splice(1).join(" "));

		let qUserDB = await dbQuery("User", {id: user.id});

		message.channel.send(`<:hyperbean:666099809668694066> Megabeaned ${user.tag} (\`${user.id}\`)`, beanSendEmbed);
		if (qUserDB.notify) member.user.send(`<:hyperbean:666099809668694066> **You have been megabeaned from ${message.guild.name}**`, beanSendEmbed).catch(()=> {});
	}
};
