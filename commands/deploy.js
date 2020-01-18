const { emoji } = require("../config.json");
const { coreLog } = require("../coreFunctions.js");
const exec = (require("util").promisify((require("child_process").exec)));
module.exports = {
	controls: {
		permission: 0,
		usage: "deploy",
		description: "Updates the bot",
		enabled: true,
		hidden: false,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (process.env.NODE_ENV !== "production" && args[0] !== "-f") return message.channel.send(`<:${emoji.x}> I am not running in the production environment. You probably don't want to deploy now.`); // Don't deploy if the bot isn't running in the production environment
		let m = await message.channel.send("Loading...");
		await coreLog("📥 Deploy initiated");
		await generateEmbed("Deploy command received");
		await generateEmbed("Updating code");
		exec("git fetch origin && git reset --hard origin/production") // Pull new code from the production branch on GitHub
			.then(async () => {
				await generateEmbed("Removing old node modules");
				return exec("rm -rf node_modules/"); // Delete old node_modules
			})
			.then(async () => {
				await generateEmbed("Installing new NPM packages");
				return exec("npm i --production"); // Installing any new dependencies
			})
			.then(async () => {
				await generateEmbed("Shutting down");
				return process.exit(0); // Stop the bot
			});

		/**
		 * Use an embed for deploy command logs
		 * @param {string} msg - The message to be logged
		 * @returns {Promise<void>}
		 */
		async function generateEmbed(msg) {
			if (typeof generateEmbed.message == "undefined") generateEmbed.message = [];
			generateEmbed.message.push(`- ${msg}`);
			let embed = new Discord.RichEmbed()
				.setDescription(`\`\`\`md\n${generateEmbed.message.join("\n")}\`\`\``)
				.setColor("RANDOM");
			console.log(msg);
			if (m) await m.edit({content: "", embed: embed});
		}
	}
};