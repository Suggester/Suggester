const { developer } = require("../../config.json");
const { dbQuery, fetchUser } = require("../../coreFunctions");
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
		if (!user) return message.channel.send("You must specify a valid member!");
		let member = await message.guild.members.fetch(user.id).catch(() => message.channel.send("You must specify a valid member!"));
		if (!member) return message.channel.send("You must specify a valid member!");

		let reason = args[1] ? args.splice(1).join(" ") : "No reason specified";

		let beanSendEmbed = new Discord.MessageEmbed();
		if (developer.includes(member.id) && !developer.includes(message.author.id)) {
			member = message.member;
			user = message.author;
			beanSendEmbed.setImage("https://media.tenor.com/images/fdc481469f2c9deb220b1e986e40a39d/tenor.gif");
		}
		beanSendEmbed.setColor("#AAD136")
			.setDescription(reason);

		let qMemberDB = await dbQuery("User", {id: member.id});

		message.channel.send(`<:bean:657650134502604811> Beaned ${user.tag} (\`${user.id}\`)`, beanSendEmbed);
		if (qMemberDB.notify) member.send(`<:bean:657650134502604811> **You have been beaned from ${message.guild.name}**`, beanSendEmbed).catch(() => {});
	}
};
