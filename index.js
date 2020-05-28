require("dotenv").config();

const chalk = require("chalk");
const { ShardingManager } = require("discord.js");

const manager = new ShardingManager("./bot.js", { token: process.env.TOKEN });

manager.spawn();

manager.on("shardCreate", (shard) => {
	console.log(chalk`{blue [{bold SHARD}] Spawned shard {bold ${shard.id}}}`);
});

manager.on("message", (shard, message) => {
	console.log(chalk`{blue [{bold SHARD ${shard.id}}] ${message._eval} : ${message._result}}`)
});

/**
 * Define the chunk method in the prototype of an array
 * that returns an array with arrays of the given size.
 *
 * @param chunkSize {Integer} Size of every group
 */
Object.defineProperty(Array.prototype, "chunk", {
	value: function(chunkSize){
		let temporal = [];
		for (let i = 0; i < this.length; i+= chunkSize){
			temporal.push(this.slice(i,i+chunkSize));
		}
		return temporal;
	}
});
