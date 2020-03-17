const { main_guild, developer } = require("../../config.json");
const { checkPermissions, dbModifyId, dbQuery, fetchUser } = require("../../coreFunctions");
module.exports = {
	controls: {
		name: "bean",
		permission: 10,
		usage: "bean <member> (reason)",
		description: "Beans a member from the server",
		enabled: true,
		docs: "",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let userPermission = await checkPermissions(message.member, client);
		if (userPermission > 2 && !client.guilds.cache.get(main_guild).roles.cache.find((role) => role.id === "657644875499569161").members.get(message.member.id)) return message.react("🚫"); //Restricted to server admin role, Beaner role in main server, or global permissions

		let user = await fetchUser(args[0], client);
		if (!user) return message.channel.send("You must specify a valid member!");
		let member = message.guild.members.cache.get(user.id);
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

		let qMemberDB = await dbQuery("User", { id: member.id });
		let qSenderDB = await dbQuery("User", { id: message.author.id });
		qMemberDB.beans.received.bean ? qMemberDB.beans.received.bean = qMemberDB.beans.received.bean++ : qMemberDB.beans.received.bean = 1;
		qSenderDB.beans.sent.bean ? qSenderDB.beans.sent.bean = qSenderDB.beans.sent.bean++ : qSenderDB.beans.sent.bean = 1;
		await dbModifyId("User", member.id, qMemberDB);
		await dbModifyId("User", message.author.id, qSenderDB);

		message.channel.send(`<:bean:657650134502604811> Beaned ${user.tag} (\`${user.id}\`)`, beanSendEmbed);
		if (qMemberDB.notify) member.send(`<:bean:657650134502604811> **You have been beaned from ${message.guild.name}**`, beanSendEmbed).catch(() => {});
	}
};
