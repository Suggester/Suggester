const { checkPermissions, channelPermissions } = require("../utils/checks");
const { dbQuery, dbModify } = require("../utils/db");
const { commandLog, errorLog, commandExecuted } = require("../utils/logs");
const { protip } = require("../utils/tip");
const { prefix, log_hooks, support_invite, staff_alert_role } = require("../config.json");
const { string } = require("../utils/strings");
const { Collection } = require("discord.js");
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

module.exports = async (Discord, client, message) => {
	const pre = new Date();
	if (!["text", "news", "dm"].includes(message.channel.type) || message.author.bot) return;

	let permission = await checkPermissions(message.member || message.author, client);

	let qServerDB;
	let noCommand = false;
	let command;
	let args = message.content.split(" ");
	if (message.guild) {
		qServerDB = await dbQuery("Server", {id: message.guild.id});
		if (qServerDB.blocked) return message.guild.leave();
		if (qServerDB.config.channels.suggestions === message.channel.id && !message.content.startsWith("\\") && !message.content.startsWith(qServerDB.config.prefix) && !message.content.startsWith(`<@${client.user.id}>`) && !message.content.startsWith(`<@!${client.user.id}>`) && qServerDB.config.in_channel_suggestions) {
			command = client.commands.find((c) => c.controls.name.toLowerCase() === "suggest");
			noCommand = true;
		}
	}

	if (!command) {
		let serverPrefix = qServerDB ? qServerDB.config.prefix : prefix;
		const match = message.content.match(new RegExp(`^(${escapeRegExp(serverPrefix)}|${permission <= 1 ? "suggester:|" : ""}<@!?${client.user.id}> ?${!message.guild ? "|" : ""})(\\S+)`));
		if (!match) return;

		if (match[1].endsWith(" ")) args = args.splice(1);
		if (args[0].includes("\n")) {
			args.splice(0, 1, ...args[0].split("\n"));
		}

		args.splice(0, 1);

		command = client.commands.find((c) => c.controls.name.toLowerCase() === match[2].toLowerCase() || c.controls.aliases && c.controls.aliases.includes(match[2].toLowerCase()));
	}

	if (!command) return;

	let qUserDB = await dbQuery("User", { id: message.author.id });
	let locale = qUserDB.locale || (qServerDB ? qServerDB.config.locale : "") || "en";

	if (message.channel.type === "dm" && !command.controls.dmAvailable) {
		commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${command.controls.name}\` in DMs but the command is only usable in a server.`, message);
		await commandExecuted(command, message, { pre, post: new Date(), success: false });
		return message.channel.send(string(locale, "COMMAND_SERVER_ONLY", {}, "error"));
	}
	if (command.controls.enabled === false) {
		commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${command.controls.name}\` in ${message.guild ? `the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`)` : "DMs" } but the command is disabled.`, message);
		await commandExecuted(command, message, { pre, post: new Date(), success: false });
		return message.channel.send(string(locale, "COMMAND_DISABLED", {}, "error"));
	}
	if (permission > command.controls.permission) {
		await commandExecuted(command, message, { pre, post: new Date(), success: false });
		commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${command.controls.name}\` in ${message.guild ? `the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`)` : "DMs" } but did not have permission to do so.`, message);
		return;
	}

	if (command.controls.permissions && message.channel.type !== "dm") {
		let checkPerms = channelPermissions(locale, command.controls.permissions, message.channel, client);
		if (checkPerms) {
			await commandExecuted(command, message, { pre, post: new Date(), success: false });
			commandLog(`⚠️ ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${command.controls.name}\` in ${message.guild ? `the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`)` : "DMs" } but bot permissions were invalid`, message);
			return message.channel.send(checkPerms).catch(() => {});
		}
	}

	commandLog(`🔧 ${message.author.tag} (\`${message.author.id}\`) ran command \`${command.controls.name}\` in ${message.guild ? `the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`)` : "DMs" }`, message);
	if (command.controls.cooldown && command.controls.cooldown > 0 && permission > 1 && !["PROTECTED", "NO_COOLDOWN"].some(f => qUserDB.flags.includes(f)) && (message.guild ? (!qServerDB.flags.includes("NO_COOLDOWN") && (permission <= 3 ? !qServerDB.flags.includes("LARGE") : true)) : true)) {
		/*
			Cooldown collection:
			[
				[command-name, [[user-id, time-used]]]
			]
			*/
		if (!client.cooldowns.has(command.controls.name)) client.cooldowns.set(command.controls.name, new Collection());
		if (!client.cooldowns.has("_counts")) client.cooldowns.set("_counts", new Collection());

		const now = Date.now();
		const times = client.cooldowns.get(command.controls.name);
		const lengthMs = command.controls.cooldown * 1000;

		if (times.has(message.author.id)) {
			const expires = times.get(message.author.id) + lengthMs;
			const counts = client.cooldowns.get("_counts");
			let userCount = counts.get(message.author.id) || null;
			userCount ? userCount += 1 : userCount = 1;

			counts.set(message.author.id, userCount);
			let preLimit = 10;
			let cooldownLimit = 15;
			if (userCount > preLimit) {
				if (userCount < cooldownLimit) return;
				//If more than 15 cooldown breaches occur over the duration of the bot being up, auto-block the user and notify the developers
				qUserDB.blocked = true;
				await dbModify("User", { id: message.author.id }, qUserDB);

				await commandExecuted(command, message, { pre, post: new Date(), success: false });

				counts.set(message.author.id, 0);

				message.channel.send(string(locale, "COOLDOWN_SPAM_FLAG", { mention: `<@${message.author.id}>`, support: `https://discord.gg/${support_invite}` })).then(m => {
					if (noCommand) {
						setTimeout(function() {
							message.delete();
							m.delete();
						}, 7500);
					}
				});

				commandLog(`--- Cooldown Breach Lookup ${message.author.id} ---`);
				let hook = new Discord.WebhookClient(log_hooks.staff_alert.id, log_hooks.staff_alert.token);
				return hook.send(`🚨 **EXCESSIVE COOLDOWN BREACHING**\n${message.author.tag} (\`${message.author.id}\`) has breached the cooldown limit of ${cooldownLimit.toString()}\nThey were automatically blocked from using the bot globally\nCommand logs can be found by searching \`Cooldown Breach Lookup ${message.author.id}\`\n(${staff_alert_role ? `<@&${staff_alert_role}>` : "@everyone"})`, {disableMentions: "none"});
			}

			if (expires > now) {
				await commandExecuted(command, message, { pre, post: new Date(), success: false });
				return message.channel.send(`${string(locale, "COMMAND_COOLDOWN", { time: ((expires - now) / 1000).toFixed(0) })} ${command.controls.cooldownMessage ? command.controls.cooldownMessage : ""}`).then(m => {
					if (noCommand) {
						setTimeout(function() {
							message.delete();
							m.delete();
						}, 7500);
					}
				});
			}
		}

		times.set(message.author.id, now);
		setTimeout(() => times.delete(message.author.id), lengthMs);
	}

	if (message.guild && qServerDB.config.blocklist && (qServerDB.config.blocklist.includes(message.author.id) || qServerDB.config.blocklist.find(b => b.id === message.author.id && b.expires > Date.now()))) return commandExecuted(command, message, { pre, post: new Date(), success: false });

	try {
		command.do(locale, message, client, args, Discord, noCommand)
			.then(async r => {
				commandExecuted(command, message, { pre, post: new Date(), success: true });
				await protip(r && r.protip && r.protip.locale ? r.protip.locale : locale, message, client, Discord, r && r.protip && r.protip.force ? r.protip.force : null, r && r.protip && r.protip.command ? command.controls.name : null, r && r.protip && r.protip.not ? r.protip.not : [], permission < 2, noCommand || (command.controls.name === "suggest" ? qServerDB.config.clean_suggestion_command : false));
			})
			.catch((err) => {
				let errorText;
				if (err.stack) errorText = err.stack;
				else if (err.error) errorText = err.error;
				message.channel.send(`${string(locale, "ERROR", {}, "error")} ${client.admins.has(message.author.id) && errorText ? `\n\`\`\`${(errorText).length >= 1000 ? (errorText).substring(locale, 0, 1000) + " content too long..." : err.stack}\`\`\`` : ""}`);
				errorLog(err, "Command Handler", `Message Content: ${message.content}`);

				console.log(err);
				commandExecuted(command, message, { pre, post: new Date(), success: false });
			});

	} catch (err) {
		let errorText;
		if (err.stack) errorText = err.stack;
		else if (err.error) errorText = err.error;
		message.channel.send(`${string(locale, "ERROR", {}, "error")} ${client.admins.has(message.author.id) && errorText ? `\n\`\`\`${(errorText).length >= 1000 ? (errorText).substring(locale, 0, 1000) + " content too long..." : err.stack}\`\`\`` : ""}`);
		errorLog(err, "Command Handler", `Message Content: ${message.content}`);

		console.log(err);
		commandExecuted(command, message, { pre, post: new Date(), success: false });
	}
};
