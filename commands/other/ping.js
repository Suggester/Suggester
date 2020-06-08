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
	do: async (locale, message, client, args, Discord) => {
		let developerArray = [];
		for (let developerId of client.admins) {
			let user = await fetchUser(developerId, client);
			user ? developerArray.push(`${Discord.Util.escapeMarkdown(user.tag)} (${user.id})`) : developerArray.push(`${developerId}`);
		}

		let guildCount = await client.shard.fetchClientValues("guilds.cache.size");
		let pings = await client.shard.fetchClientValues("ws.ping");
		const uptime = await client.shard.fetchClientValues("uptime");
		let shardValues = {};
		for (let i = 0; i < guildCount.length; i++) {
			shardValues[i] = {
				guildCount: guildCount[i],
				ping: pings[i],
				uptime: uptime[i]
			};
		}
		let guildCountFull = guildCount.reduce((t, c) => t + c, 0);

		let embed = new Discord.MessageEmbed()
			.addField(string(locale, "PING_DEVELOPERS_HEADER"), developerArray.join("\n"))
			.addField(`${string(locale, "PING_GUILD_COUNT_HEADER")}`, string(locale, "PING_COUNT_CONTENT", { guilds: guildCountFull, shards: guildCount.length }))
			.addField(string(locale, "PING_UPTIME_HEADER"), `${humanizeDuration(client.uptime)}\nAvg: ${humanizeDuration(uptime.reduce((t, c) => t + c)/uptime.length)}`)
			.addField(string(locale, "PING_SHARD_PING_HEADER"), `${Math.round(client.ws.ping)} ms`)
			.addField(string(locale, "PING_SHARD_STATS_HEADER"), `${Object.keys(shardValues).map(k => `**Shard ${k}:** ${shardValues[k].guildCount} servers, ${Math.round(shardValues[k].ping)} ms ping, up for ${humanizeDuration(shardValues[k].uptime)}`).join("\n")}`)
			.setFooter(`Shard: ${client.shard.ids[0]} | ${client.user.tag} v4`, client.user.displayAvatarURL({format: "png"}))
			.setThumbnail(client.user.displayAvatarURL({format: "png"}))
			.setColor(colors.default);

		const before = Date.now();
		message.channel.send(embed).then((sent) => {
			embed.addField(string(locale, "PING_BOT_LATENCY_HEADER"), ms(Date.now() - before));
			sent.edit(embed);
		});
	}
};

