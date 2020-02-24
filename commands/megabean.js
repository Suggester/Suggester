const { emoji } = require("../config.json");
const { dbModifyId, dbQuery } = require("../coreFunctions");
module.exports = {
	controls: {
		permission: 0,
		usage: "megabean <member> (reason)",
		description: "Megabeans a member from the server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {

		if (!args[0]) return message.channel.send("You must specify a member!");
		let member = message.mentions.members.first() || message.guild.members.find((user) => user.id === args[0]);
		if (!member) return message.channel.send(`<:${emoji.x}> Could not find server member \`${args[0]}\``);

		let reason = args[1] ? args.splice(1).join(" ") : "No reason specified";

		let beanSendEmbed = new Discord.RichEmbed()
			.setColor("#AAD136")
			.setDescription(reason)
			.setImage("https://media.tenor.com/images/be3750a3b77c26295ae4bc16d9543d63/tenor.gif");

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
			bean: qMemberDB.beans.received.bean,
			megabean: qMemberDB.beans.received.megabean+1,
			nukebean: qMemberDB.beans.received.nukebean
		};
		let senderReceivedBeanCount = qSenderDB.beans.received;
		let senderSentBeanCount = {
			bean: qSenderDB.beans.sent.bean,
			megabean: qSenderDB.beans.sent.megabean+1,
			nukebean: qSenderDB.beans.sent.nukebean
		};
		await dbModifyId("User", member.id, { beans: { sent: memberSentBeanCount, received: memberReceivedBeanCount } });
		await dbModifyId("User", message.author.id, { beans: { sent: senderSentBeanCount, received: senderReceivedBeanCount } });

		message.channel.send(`<:hyperbean:666099809668694066> Megabeaned ${member.user.tag} (\`${member.id}\`)`, beanSendEmbed);
		member.user.send(`<:hyperbean:666099809668694066> **You have been megabeaned from ${message.guild.name}**`, beanSendEmbed).catch(()=> {});

	}
};
