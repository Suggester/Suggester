require("dotenv").config();

const chalk = require("chalk");
const { ShardingManager } = require("discord.js");

const manager = new ShardingManager("./bot.js", { token: process.env.TOKEN });

// (async () => await manager.spawn())();

manager.on("shardCreate", (shard) => {
	console.log(chalk`{blue [{bold SHARD}] Spawned shard {bold ${shard.id}}}`);
	shard.on("message", (message) => {
		console.log(chalk`{blue [{bold SHARD ${shard.id}}] ${message}}`);
	});
});

manager.on("message", (shard, message) => {
	console.log(chalk`{blue [{bold SHARD ${shard.id}}] ${message._eval} : ${message._result}}`);
});

manager.spawn()
	.catch(console.error);
