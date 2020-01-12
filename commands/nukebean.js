const core = require("../coreFunctions.js");
const config = require("../config.json");
module.exports = {
	controls: {
		permission: 0,
		usage: "nukebean <member> (reason)",
		description: "Nukebeans a member from the server",
		enabled: true,
		hidden: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {

		if (!args[0]) return message.channel.send("You must specify a member!");
		let member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.channel.send("Could not find member `" + args[0] + "`");

		//if (member.id === "327887845270487041") return message.channel.send(`<:${config.emoji.x}> There was an error executing this command.`)

		let reason = args.splice(1).join(" ") || "No reason specified";
		let beanSendEmbed = new Discord.RichEmbed()
			.setColor(config.default_color)
			.setDescription(reason)
			.setImage("https://media.tenor.com/images/334d8d0f9bf947f31256cdaacc7f6cf0/tenor.gif");

		client.on("message", (message) => {
			if (message.author.id === member.id) message.react("BOOM:641638826967695381");
		});

		member.user.send("<:BOOM:641638826967695381> **You have been nukebeaned from " + message.guild.name + "**", beanSendEmbed).then(aSendMember => {
			message.channel.send("<:BOOM:641638826967695381> Nukebeaned " + member.user.tag + " (`" + member.id + "`)", beanSendEmbed);
			//TODO: Transfer role adding from role manager to mod boat
		}).catch(err => {
			console.error(err);
			beanSendEmbed.addField("Note", "The user could not be DM'ed, they were nukebeaned anyway.");
			message.channel.send("<:BOOM:641638826967695381> Nukebeaned " + member.user.tag + " (`" + member.id + "`)", beanSendEmbed);
			//TODO: Transfer role adding from role manager to mod boat
		});
	}
};


