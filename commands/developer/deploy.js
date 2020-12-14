const { release } = require("../../config.json");
const { coreLog } = require("../../utils/logs.js");
const exec = (require("util").promisify((require("child_process").exec)));
const { string } = require("../../utils/strings");
const { confirmation } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "deploy",
		permission: 0,
		usage: "deploy (branch)",
		description: "Pulls an update from git and reboots with changes",
		examples: "`{{p}}deploy`\nDeploys an update from the `production` branch\n\n`{{p}}deploy staging`\nDeploys an update from the `staging` branch",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS", "READ_MESSAGE_HISTORY"]
	},
	do: async (locale, message, client, args, Discord) => {
		if (!client.admins.has(message.author.id)) return;
		if (process.env.NODE_ENV !== "production" && args[0] !== "-f") return message.channel.send(string(locale, "DEPLOY_NOT_PRODUCTION", {}, "error")); // Don't deploy if the bot isn't running in the production environment
		/**
		 * Use an embed for deploy command logs
		 * @param {string} msg - The message to be logged
		 * @returns {Promise<void>}
		 */
		async function generateEmbed(msg, m) {
			if (typeof generateEmbed.message == "undefined") generateEmbed.message = [];
			generateEmbed.message.push(`- ${msg}`);
			let embed = new Discord.MessageEmbed()
				.setDescription(`\`\`\`md\n${generateEmbed.message.join("\n")}\`\`\``)
				.setColor("RANDOM");
			console.log(msg);
			if (m) await m.edit({content: "", embed: embed});
		}
		if ((
			await confirmation(
				message,
				`:warning: Are you sure you would like to deploy **${client.user.username}**?`,
				{
					deleteAfterReaction: true
				}
			)
		)) {
			let m = await message.channel.send(string(locale, "PROCESSING"));
			await coreLog("📥 Deploy initiated", client);
			await generateEmbed("Deploy command received", m);
			await generateEmbed("Updating code", m);

			let branch;
			if (args[0]) branch = args[0];
			else release === "canary" ? branch = "staging" : branch = "production";

			exec(`git fetch origin && git reset --hard origin/${branch}`) // Pull new code from GitHub
				.then(async () => {
					await generateEmbed("Removing old node modules", m);
					return exec("rm -rf node_modules/"); // Delete old node_modules
				})
				.then(async () => {
					await generateEmbed("Installing new NPM packages", m);
					return exec("npm i --production"); // Installing any new dependencies
				})
				.then(async () => {
					await generateEmbed("Shutting down", m);
					return client.shard.respawnAll(); // Stop the bot
				});
		}
	}
};
