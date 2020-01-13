const { main_guild, developer, emoji } = require("../config.json");
const { checkPermissions } = require("../coreFunctions");
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
		if (checkPermissions(message.member, client) > 2 && !client.guilds.get(main_guild).roles.find((role) => role.id === "657644875499569161").members.get(message.member.id)) return message.react("🚫"); //Restricted to server admin role, Beaner role in main server, or global permissions

		if (!args[0]) return message.channel.send("You must specify a member!");
		let member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.channel.send(`<:${emoji.x}> Could not find server member \`${args[0]}\``);

		if (developer.includes(member.id)) member = message.member;
		let reason = args[1] ? args.splice(1).join(" ") : "No reason specified";

		let beanSendEmbed = new Discord.RichEmbed()
			.setColor("#AAD136")
			.setDescription(reason);

		message.channel.send(`<:bean:657650134502604811> Beaned ${member.user.tag} (\`${member.id}\`)`, beanSendEmbed);
		member.send(`<:bean:657650134502604811> **You have been beaned from ${message.guild.name}**`, beanSendEmbed)
			.catch(err => {});
	}
};
