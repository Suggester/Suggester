const { fetchUser } = require("../../utils/misc.js");
const { string } = require("../../utils/strings");
const humanizeDuration = require("humanize-duration");
const ms = require("ms");
const pretty = require("prettysize");
module.exports = {
	controls: {
		name: "ping",
		permission: 10,
		aliases: ["hi", "about", "bot"],
		usage: "ping",
		description: "Checks bot response time and shows information",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		dmAvailable: true
	},
	do: async (locale, message, client, args, Discord) => {
		let developerArray = [];
		for (let developerId of client.admins) {
			let user = await fetchUser(developerId, client);
			user ? developerArray.push(`${Discord.Util.escapeMarkdown(user.tag)} (\`${user.id}\`)`) : developerArray.push(`${developerId}`);
		}

		const shardInfo = await client.shard.broadcastEval(`[{
			id: this.shard.ids[0],
			guilds: this.guilds.cache.size,
			channels: this.channels.cache.size,
			members: this.guilds.cache.reduce((prev, guild) => prev + guild.memberCount, 0),
			memory: (process.memoryUsage().heapUsed).toFixed(2),
			ping: this.ws.ping,
			uptime: this.uptime
		  }]`);

		let embed = new Discord.MessageEmbed()
			.addField(string(locale, "PING_DEVELOPERS_HEADER"), developerArray.join("\n"))
			.addField(`${string(locale, "PING_GUILD_COUNT_HEADER")}`, string(locale, "PING_COUNT_CONTENT", { guilds: shardInfo.reduce((t, c) => t + c[0].guilds, 0), shards: shardInfo.length }), true)
			.addField(string(locale, "PING_UPTIME_HEADER"), `${humanizeDuration(client.uptime, { language: locale, fallbacks: ["en"] })}\nAvg: ${humanizeDuration(shardInfo.reduce((t, c) => t + parseFloat(c[0].uptime), 0)/shardInfo.length, { language: locale, fallbacks: ["en"] })}`, true)
			.addField(string(locale, "PING_SHARD_PING_HEADER"), `${Math.round(client.ws.ping)} ms`, true)
			.addField(string(locale, "PING_MEMORY_HEADER"), pretty(shardInfo.reduce((t, c) => t + parseFloat(c[0].memory), 0)))
			.addField(string(locale, "PING_SHARD_STATS_HEADER"), `${shardInfo.map(s => string(locale, "PING_SHARD_STATS_NEW", { num: s[0].id.toString(), guilds: s[0].guilds.toString(), channels: s[0].channels.toString(), members: s[0].members.toString(), ping: Math.round(s[0].ping), uptime: humanizeDuration(s[0].uptime, { language: locale, fallbacks: ["en"] }), memory: pretty(s[0].memory)})).join("\n")}`)
			.setFooter(`${string(locale, "PING_SHARD_FOOTER", { shard: client.shard.ids[0].toString() })} • ${client.user.tag} v4.5.1`, client.user.displayAvatarURL({format: "png"}))
			.setThumbnail(client.user.displayAvatarURL({format: "png"}))
			.setColor(client.colors.default);

		const before = Date.now();
		message.channel.send(embed).then((sent) => {
			embed.addField(string(locale, "PING_BOT_LATENCY_HEADER"), ms(Date.now() - before));
			sent.edit(embed);
		});
	}
};

