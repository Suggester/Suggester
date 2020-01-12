const { colors, main_guild, global_override, developer } = require("../config.json");
const core = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 10,
		usage: "bean <member> (reason)",
		description: "Beans a member from the server",
		enabled: true,
		docs: "",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {
		if (!client.guilds.get(main_guild).roles.find((role) => role.id === global_override).members.get(message.member.id) &&
			!client.guilds.get(main_guild).roles.find((role) => role.id === "657644875499569161").members.get(message.member.id) && core.checkPermissions(message.member, client) > 2) return message.react("🚫");


		if (!args[0]) return message.channel.send("You must specify a member!");
		let member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.channel.send(`Could not find member \`${args[0]}\``);

		if (developer.includes(member.id)) member = message.member;
		let reason = args[1] ? args.splice(1).join(" ") : "No reason specified";

		let beanSendEmbed = new Discord.RichEmbed()
			.setColor(colors.default)
			.setDescription(reason);

		member.send(":hammer: **You have been beaned from " + message.guild.name + "**", beanSendEmbed)
			.then(() => {
				message.channel.send(":ok_hand: Beaned " + member.user.tag + " (`" + member.id + "`)", beanSendEmbed);
			})
			.catch(() => {
				beanSendEmbed.addField("Note", "The user could not be DM'ed, they were beaned anyway.");
				message.channel.send(":ok_hand: Beaned " + member.user.tag + " (`" + member.id + "`)", beanSendEmbed);
			});
	}
};
