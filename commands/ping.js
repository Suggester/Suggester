const { colors, developer } = require("../config.json");
const { core } = require("../persistent.json");
const humanizeDuration = require("humanize-duration");
const ms = require("ms");
module.exports = {
	controls: {
		permission: 10,
		aliases: ["hi", "about", "bot"],
		usage: "ping",
		description: "Checks bot response time and shows information",
		enabled: true,
		docs: "all/ping",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {
		let developerArray = [];
		developer.forEach(developerId => {
			if (client.users.get(developerId)) {
				let user = client.users.get(developerId);
				developerArray.push(`${user.tag} (${user.id})`);
			} else developerArray.push(`Unknown User (${developerId})`);
		});
		let embed = new Discord.RichEmbed()
			.addField("Developers", developerArray.join("\n"))
			.addField("Guild Count", client.guilds.size)
			.addField("Uptime", humanizeDuration(client.uptime))
			.addField("Client Ping", client.ping + " ms")
			.setFooter(`${client.user.tag} v${core.version}`, client.user.displayAvatarURL)
			.setThumbnail(client.user.displayAvatarURL)
			.setColor(colors.default);
		message.reply("👋 Hi there! Here's some info:", embed).then((sent) => {
			embed.addField("Edit Time", ms(new Date().getTime() - sent.createdTimestamp));
			sent.edit("<@" + message.author.id + ">, 👋 Hi there! Here's some info:", embed);
		});
	}
};
