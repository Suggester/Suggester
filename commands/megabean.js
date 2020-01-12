const core = require("../coreFunctions.js");
const config = require("../config.json");
module.exports = {
	controls: {
		permission: 0,
		usage: "megabean <member> (reason)",
		aliases: ["superbean"],
		description: "Megabeans a member from the server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {

		if (!args[0]) return message.channel.send("You must specify a member!");
		let member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.channel.send("Could not find member `" + args[0] + "`");

		let reason = args.splice(1).join(" ") || "No reason specified";
		let beanSendEmbed = new Discord.RichEmbed()
			.setColor(config.default_color)
			.setDescription(reason)
			.setImage("https://media.tenor.com/images/be3750a3b77c26295ae4bc16d9543d63/tenor.gif");
		member.user.send("<:HYPERBAN:641027442311430145> **You have been megabeaned from " + message.guild.name + "**", beanSendEmbed).then(aSendMember => {
			message.channel.send("<:HYPERBAN:641027442311430145> Megabeaned " + member.user.tag + " (`" + member.id + "`)", beanSendEmbed);
			//TODO: Transfer role adding from role manager to mod boat
		}).catch(err => {
			console.error(err);
			beanSendEmbed.addField("Note", "The user could not be DM'ed, they were megabeaned anyway.");
			message.channel.send("<:HYPERBAN:641027442311430145> Megabeaned " + member.user.tag + " (`" + member.id + "`)", beanSendEmbed);
			//TODO: Transfer role adding from role manager to mod boat

		});

	}
};


