const { main_guild, developer, emoji } = require("../config.json");
const { checkPermissions, dbModifyId, dbQuery } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 10,
		usage: "bean <member> (reason)",
		description: "Beans a member from the server",
		enabled: true,
		docs: "",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let userPermission = checkPermissions(message.member, client);
		if (userPermission > 2 && !client.guilds.get(main_guild).roles.find((role) => role.id === "657644875499569161").members.get(message.member.id)) return message.react("🚫"); //Restricted to server admin role, Beaner role in main server, or global permissions

		if (!args[0]) return message.channel.send("You must specify a member!");
		let member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.channel.send(`<:${emoji.x}> Could not find server member \`${args[0]}\``);

		if (developer.includes(member.id)) member = message.member;
		let reason = args[1] ? args.splice(1).join(" ") : "No reason specified";

		let beanSendEmbed = new Discord.RichEmbed()
			.setColor("#AAD136")
			.setDescription(reason);

		let qMemberDB = await dbQuery("User", { id: member.id });
		let qSenderDB = await dbQuery("User", { id: message.author.id });
		if (!qMemberDB || !qMemberDB.beans) await dbModifyId("User", member.id, { beans: {
			sent: {
				bean: { type: Number, default: 0 },
				megabean: { type: Number, default: 0 },
				nukebean: { type: Number, default: 0 }
			},
			received: {
				bean: { type: Number, default: 0 },
				megabean: { type: Number, default: 0 },
				nukebean: { type: Number, default: 0 }
			}
		}
		});
		if (!qSenderDB || !qSenderDB.beans) await dbModifyId("User", message.author.id, { beans: {
			sent: {
				bean: { type: Number, default: 0 },
				megabean: { type: Number, default: 0 },
				nukebean: { type: Number, default: 0 }
			},
			received: {
				bean: { type: Number, default: 0 },
				megabean: { type: Number, default: 0 },
				nukebean: { type: Number, default: 0 }
			}
		}
		});

		let memberSentBeanCount = qMemberDB.beans.sent;
		let memberReceivedBeanCount = {
			bean: qMemberDB.beans.received.bean+1,
			megabean: qMemberDB.beans.received.megabean,
			nukebean: qMemberDB.beans.received.nukebean
		};
		let senderReceivedBeanCount = qSenderDB.beans.received;
		let senderSentBeanCount = {
			bean: qSenderDB.beans.sent.bean+1,
			megabean: qSenderDB.beans.sent.megabean,
			nukebean: qSenderDB.beans.sent.nukebean
		};
		await dbModifyId("User", member.id, { beans: { sent: memberSentBeanCount, received: memberReceivedBeanCount } });
		await dbModifyId("User", message.author.id, { beans: { sent: senderSentBeanCount, received: senderReceivedBeanCount } });

		message.channel.send(`<:bean:657650134502604811> Beaned ${member.user.tag} (\`${member.id}\`)`, beanSendEmbed);
		member.send(`<:bean:657650134502604811> **You have been beaned from ${message.guild.name}**`, beanSendEmbed)
			.catch(err => {});
	}
};
