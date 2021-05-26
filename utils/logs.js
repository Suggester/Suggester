const Discord = require("discord.js");
const { log_hooks } = require("../config.json");
const chalk = require("chalk");
const { dbModify } = require("./db");
let models = require("./schemas");
const fetch = require("node-fetch");
const FormData = require("form-data");
/**
 * Send a message from a webhook
 * @param {module:"discord.js".Client} client - Client
 * @param {Object} cfg - Where to send the webhook; contains webhook token and id
 * @param {String} input - What to send
 * @param {module:"discord.js".WebhookMessageOptions} options - Message options
 */
function sendWebhook (client, cfg, input, options) {
	if (!cfg || !cfg.id || !cfg.token) return;
	if (!options) options = {};
	if (!options.disableMentions) options.disableMentions = "all";
	if (typeof input === "string" && !options.disableMentions.includes("none")) input = Discord.Util.removeMentions(input);
	options.avatarURL = client.user.displayAvatarURL({format: "png"});
	options.username = `${client.user.username} Logs`;
	return client.fetchWebhook(cfg.id, cfg.token).then(async h => {
		await h.send(input, options);
		return true;
	}).catch(() => {
		return false;
	});
}

module.exports = {
	/**
	 * Log media for the attach command
	 * @param {Discord.Message} msg
	 * @param {number} suggestionId
	 * @param {string} link - Image/file link
	 */
	mediaLog: async function (msg, suggestionId, link) {
		if (!log_hooks.media || !log_hooks.media.id || !log_hooks.media.token) {
			console.log(chalk`{red {bold Media} log webhook not found}`);
			return;
		}

		const r = new RegExp(".*/(?<img>.*)$");
		const execd = r.exec(link);
		if (!execd || !execd.groups || !execd.groups.img) return null;

		const filename = execd.groups.img || "unknown.png";

		const img = await fetch(link).then((res) => res.buffer());

		if (img.length >= 8e6) return { code: 40005 };

		const body = new FormData();
		body.append("image", img, { filename });
		body.append("content", `**Suggestion ID**: ${suggestionId}\n**Filename**: ${filename}`);

		return await fetch(`https://discord.com/api/webhooks/${log_hooks.media.id}/${log_hooks.media.token}?wait=1`, {
			method: "post",
			body
		}).then((res) => res.json());
	},
	guildLog: (input, options, client) => {
		if (!(sendWebhook(client, log_hooks.guild, input))) console.log(chalk`{red {bold Guild} log webhook not found}`);
	},
	coreLog: (input, client) => {
		if (!sendWebhook(client, log_hooks.core, input)) console.log(chalk`{red {bold Core} log webhook not found}`);
	},
	commandLog: (input, message) => {
		let embed = message.content ? new Discord.MessageEmbed()
			.setDescription(message.content) : null;
		if (!sendWebhook(message.client, log_hooks.commands, input, embed ? { embeds: [embed] } : {})) console.log(chalk`{red {bold Command} log webhook not found}`);
	},
	/**
	 * Logs an input to the specified server's log channel
	 * @param inputEmbed - What to send
	 * @param {module:"discord.js".Client} client - Client
	 * @param {Object} db - Server database
	 * @returns null
	 */
	serverLog: async (inputEmbed, db, client) => {
		if (!db.config.loghook || !db.config.loghook.id || !db.config.loghook.token) return;
		if (!sendWebhook(client, db.config.loghook, null, { embeds: [inputEmbed] })) {
			db.config.loghook = {};
			db.config.channels.log = "";
			await dbModify("Server", { id: db.id }, db);
		}
	},
	errorLog: (client, err, type, footer) => {
		if (!err) return;
		let errorText = "Error Not Set";
		if (err.stack) {
			console.error((require("chalk")).red(err.stack));
			errorText = err.stack;
		} else if (err.error) {
			console.error((require("chalk")).red(err.error));
			errorText = err.error;
		} else return;
		let embed = new Discord.MessageEmbed()
			.setAuthor(type)
			.setTitle(err.message ? err.message.substring(0, 256) : "No Message Value")
			.setDescription(`\`\`\`js\n${(errorText).length >= 1000 ? (errorText).substring(0, 1000) + " content too long..." : err.stack}\`\`\``)
			.setColor("DARK_RED")
			.setTimestamp()
			.setFooter(footer);

		sendWebhook(client, log_hooks.core, "<@&804739962569883719>", { embeds: [embed], disableMentions: "none" });
	},
	joinLeaveLog: async function (guild, action) {
		/*let document = {
			date: Date.now(),
			id: guild.id,
			action
		};

		if (action === "leave") document.joinedAt = guild.joinedAt;

		const g = await models.ServerLog.find({ id: guild.id });

		const maxJoins = g.length ? Math.max.apply(Math, g.map((gu) => gu.timesJoined)) : 0;
		//document.timesJoined = action === "join" ? maxJoins + 1 : maxJoins;
		if (action === "join") document.timesJoined = maxJoins + 1;
		else if (action === "leave" && maxJoins === 0) document.timesJoined = 1;
		else document.timesJoined = maxJoins;

		return new models.ServerLog(document).save();*/
	},
	commandExecuted: function (command, message, { pre, post, success } = { pre: 0, post: 0, success: false }) {
		if (process.env.NODE_ENV !== "production" || message.client.config.logCommands === false) return;
		return new models.Command({
			command: command.controls.name,
			fullCommand: message.content,

			user: message.author.id,
			guild: message.guild ? message.guild.id : null,
			channel: message.channel.id,
			message: message.id,
			date: Date.now(),

			executionTime: Number(post) - Number(pre),
			success: success
		}).save();
	}
};
