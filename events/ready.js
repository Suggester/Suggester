const { coreLog } = require("../utils/logs.js");
const { release, lists } = require("../config.json");
const blapi = require("blapi");
const chalk = require("chalk");

module.exports = async (Discord, client) => {
	const team = await client.fetchTeam()
		.catch(() => console.log(chalk`{red [{bold ERROR}] Error fetching team members.}`));

	for (const admin of team) {
		client.admins.add(admin.id);
		console.log(chalk`{blue [{bold INFO}] Found {bold ${admin.tag}}}`);
	}

	coreLog(`🆗 Logged in with ${client.guilds.cache.size} servers! (Shard: ${client.shard.ids[0]})`, client);
	console.log(chalk`{green [{bold INFO}] Logged in as {bold ${client.user.tag}}! (Release: {bold ${release}, Shard: ${client.shard.ids[0]})}}`);

	//Post to bot lists
	async function post() {
		const guildCounts = await client.shard.fetchClientValues("guilds.cache.size"); // ['1006', '966']
		const totalGuildCount = guildCounts.reduce((total, current) => total + current, 0); // 1972

		blapi.manualPost(totalGuildCount, client.user.id, lists, null, guildCounts.length, guildCounts);
	}

	if (client.user.id === "564426594144354315" && client.shard.ids[0] === 0 && process.NODE_ENV === "production" && lists) {
		setTimeout(async function() {
			await post();
			setInterval(async function() {
				await post();
			}, 1800000);
		}, 10000);
	}
};