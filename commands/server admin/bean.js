const { developer } = require("../../config.json");
const { dbQuery, fetchUser } = require("../../coreFunctions");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "bean",
		permission: 2,
		usage: "bean <member> (reason)",
		description: "Beans a member from the server",
		enabled: true,
		docs: "",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let user = await fetchUser(args[0], client);
		if (!user) return message.channel.send(string("INVALID_USER_ERROR", {}, "error"));
		let foundMember = true;
		let member = await message.guild.members.fetch(user.id).catch(() => foundMember = false);
		if (!member || !foundMember) return message.channel.send(string("INVALID_USER_ERROR", {}, "error"));

		let beanSendEmbed = new Discord.MessageEmbed()
			.setColor("#AAD136");
		if (developer.includes(user.id) && !developer.includes(message.author.id)) {
			user = message.author;
			beanSendEmbed.setImage("https://media.tenor.com/images/fdc481469f2c9deb220b1e986e40a39d/tenor.gif");
		}
		if (args[1]) beanSendEmbed.setDescription(args.splice(1).join(" "));

		let qUserDB = await dbQuery("User", {id: user.id});

		message.channel.send(`<:bean:657650134502604811> Beaned ${user.tag} (\`${user.id}\`)`, (beanSendEmbed.description || beanSendEmbed.image) ? beanSendEmbed : null);
		if (qUserDB.notify) user.send(`<:bean:657650134502604811> **You have been beaned from ${message.guild.name}**`, (beanSendEmbed.description || beanSendEmbed.image) ? beanSendEmbed : null).catch(() => {});
	}
};
