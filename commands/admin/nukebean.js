const { dbQuery, fetchUser } = require("../../coreFunctions");
module.exports = {
	controls: {
		name: "nukebean",
		permission: 0,
		usage: "nukebean <member> (reason)",
		description: "Nukebeans a member from the server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let user = await fetchUser(args[0], client);
		if (!user) return message.channel.send("You must specify a valid member!");
		let foundMember = true;
		let member = await message.guild.members.fetch(user.id).catch(() => foundMember = false);
		if (!member || !foundMember) return message.channel.send("You must specify a valid member!");

		let reason = args[1] ? args.splice(1).join(" ") : "No reason specified";

		let beanSendEmbed = new Discord.MessageEmbed()
			.setColor("#AAD136")
			.setDescription(reason)
			.setImage("https://media.tenor.com/images/334d8d0f9bf947f31256cdaacc7f6cf0/tenor.gif");

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

		let qMemberDB = await dbQuery("User", {id: member.id});

		message.channel.send(`<:nukebean:666102191895085087> Nukebeaned ${user.tag} (\`${member.id}\`)`, beanSendEmbed);
		if (qMemberDB.notify) member.user.send(`<:nukebean:666102191895085087> **You have been nukebeaned from ${message.guild.name}**`, beanSendEmbed).catch(() => {});
	}
};
