const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "shards",
		permission: 10,
		usage: "shards",
		description: "Shows shard information",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (locale, message, client, args, Discord) => {
		let m = await message.channel.send(string(locale, "PROCESSING"));
		const promises = [
			client.shard.fetchClientValues("guilds.cache.size"),
			client.shard.broadcastEval("this.guilds.cache.reduce((prev, guild) => prev + guild.memberCount, 0)"),
		];

		const shardInfo = await client.shard.broadcastEval(`[
        this.shard.ids,
        this.shard.mode,
        this.guilds.cache.size,
        this.channels.cache.size,
        this.guilds.cache.reduce((prev, guild) => prev + guild.memberCount, 0),
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
		this.ws.ping
      ]`).catch(() => false);

		if (!shardInfo) return m.edit(string(locale, "SHARDS_NOT_SPAWNED", {}, "error"));

		const embed = new Discord.MessageEmbed()
			.setColor(client.colors.default)
			.setAuthor(client.user.username, client.user.displayAvatarURL({ format: "png" }));

		shardInfo.forEach(i => {
			console.log(i);
			embed.addField(`${i[1] === "process" && i[6] ? "<:online:812356089868845087>" : "<:dnd:812356143783346196>"} ${string(locale, "PING_SHARD_FOOTER", { shard: (parseInt(i[0]) + 1).toString() })}`, `\`\`\`js
${string(locale, "SHARDS_DETAIL", { servers: i[2] ? i[2].toLocaleString() : "N/A", channels: i[3] ? i[3].toLocaleString() : "N/A", users: i[4] ? i[4].toString() : "N/A", memory: i[5] ? i[5].toLocaleString() : "N/A", api: i[6] ? i[6].toLocaleString() : "N/A" })}\`\`\``, true);
		});

		Promise.all(promises).then(results => {
			let totalMemory = shardInfo.reduce((p, s) => p += parseInt(s[5]), 0);
			let totalChannels = shardInfo.reduce((p, s) => p += parseInt(s[3]), 0);
			let avgLatency = Math.round(shardInfo.reduce((p, s) => p += parseInt(s[6]), 0) / shardInfo.length);
			const totalGuilds = results[0].reduce((prev, guildCount) => prev + guildCount, 0);
			const totalMembers = results[1].reduce((prev, memberCount) => prev + memberCount, 0);

			embed.addField("<:online:812356089868845087> Total Stats", `\`\`\`js\n${string(locale, "SHARDS_DETAIL", { servers: totalGuilds ? totalGuilds.toLocaleString() : "N/A", channels: totalChannels ? totalChannels.toLocaleString() : "N/A", users: totalMembers ? totalMembers.toString() : "N/A", memory: totalMemory ? totalMemory.toLocaleString() : "N/A", api: avgLatency ? avgLatency.toLocaleString() : "N/A" })}\`\`\``);
			embed.setTimestamp();
			m.delete();
			message.channel.send(embed);
		});
	}
};
