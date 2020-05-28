const { colors } = require("../../config.json");
const { fetchUser } = require("../../utils/misc.js");
const { string } = require("../../utils/strings");
const humanizeDuration = require("humanize-duration");
const ms = require("ms");
module.exports = {
	controls: {
		name: "ping",
		permission: 10,
		aliases: ["hi", "about", "bot"],
		usage: "ping",
		description: "Checks bot response time and shows information",
		enabled: true,
		docs: "all/ping",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (message, client, args, Discord) => {
		let developerArray = [];
		for (let developerId of client.admins) {
			let user = await fetchUser(developerId, client);
			user ? developerArray.push(`${Discord.Util.escapeMarkdown(user.tag)} (${user.id})`) : developerArray.push(`${developerId}`);
		}

		let guildCount = await client.shard.broadcastEval("this.guilds.cache.size");
		guildCount = guildCount.reduce((t, c) => t + c, 0);

		const uptime = await client.shard.fetchClientValues("uptime");

		let embed = new Discord.MessageEmbed()
			.addField(string("PING_DEVELOPERS_HEADER"), developerArray.join("\n"))
			.addField(`${string("PING_GUILD_COUNT_HEADER")}`, guildCount)
			.addField(string("PING_UPTIME_HEADER"), `${humanizeDuration(client.uptime)}\nAvg: ${humanizeDuration(uptime.reduce((t, c) => t + c)/uptime.length)}`)
			.addField(string("PING_CLIENT_PING_HEADER"), `${Math.round(client.ws.ping)} ms`)
			.setFooter(`Shard: ${client.shard.ids[0]} | ${client.user.tag} v3.2.3`, client.user.displayAvatarURL({format: "png"}))
			.setThumbnail(client.user.displayAvatarURL({format: "png"}))
			.setColor(colors.default);

		const before = Date.now();
		message.channel.send(embed).then((sent) => {
			embed.addField(string("PING_BOT_LATENCY_HEADER"), ms(Date.now() - before));
			sent.edit(embed);
		});
	}
};

