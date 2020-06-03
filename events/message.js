const { checkPermissions, channelPermissions } = require("../utils/checks");
const { dbQuery, dbModify } = require("../utils/db");
const { coreLog, commandLog, errorLog, commandExecuted } = require("../utils/logs");
const { prefix, log_hooks, support_invite } = require("../config.json");
const { string } = require("../utils/strings");
const { Collection } = require("discord.js");

module.exports = async (Discord, client, message) => {
	const pre = new Date();
	if (!["text", "news"].includes(message.channel.type)) {
		let dmEmbed = new Discord.MessageEmbed()
			.setDescription(message.content);
		if (message.channel.type === "dm" && client.user.id !== message.author.id) return coreLog(`📧 **${message.author.tag}** (\`${message.author.id}\`) sent a DM to the bot:`, { embeds: [dmEmbed] }, client);
		return;
	}
	if (message.author.bot === true) return;

	let permission = await checkPermissions(message.member, client);

	let qServerDB = await dbQuery("Server", { id: message.guild.id });
	if (qServerDB.blocked) return message.guild.leave();

	let serverPrefix = (qServerDB && qServerDB.config && qServerDB.config.prefix) || prefix;

	let regexEscape = "^$.|?*+()[{".split("");
	regexEscape.push("\\");

	const match = message.content.match(new RegExp(`^<@!?${client.user.id}> ?`));
	let specialPrefix = false;
	if (match) {
		serverPrefix = match[0];
		specialPrefix = true;
	}
	else if (permission <= 1 && message.content.toLowerCase().startsWith("suggester:")) {
		serverPrefix = "suggester:";
		specialPrefix = true;
	}
	else if (permission <= 1 && message.content.toLowerCase().startsWith(`${client.user.id}:`)) {
		serverPrefix = `${client.user.id}:`;
		specialPrefix = true;
	}

	if (!message.content.toLowerCase().startsWith(serverPrefix)) return;
	let args = message.content.split(" ");
	serverPrefix.endsWith(" ") ? args = args.splice(2) : args = args.splice(1);

	if (!specialPrefix) {
		let splitPrefix = serverPrefix.split("");
		for (let i = 0; i < splitPrefix.length; i++) {
			if (regexEscape.includes(splitPrefix[i])) splitPrefix[i] = "\\" + splitPrefix[i];
		}
		serverPrefix = splitPrefix.join("");
	}
	let commandName = message.content.toLowerCase().match(new RegExp(`^${serverPrefix}([a-z]+)`));

	if (!commandName || !commandName[1]) return;
	else commandName = commandName[1];

	const command = client.commands.find((c) => c.controls.name.toLowerCase() === commandName || c.controls.aliases && c.controls.aliases.includes(commandName));
	if (!command) return;

	if (command.controls.enabled === false) {
		commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but the command is disabled.`, message);
		await commandExecuted(command, message, { pre, post: new Date(), success: false });
		return message.channel.send(string("COMMAND_DISABLED", {}, "error"));
	}
	if (permission > command.controls.permission) {
		await commandExecuted(command, message, { pre, post: new Date(), success: false });
		return commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but did not have permission to do so.`, message);
	}

	commandLog(`🔧 ${message.author.tag} (\`${message.author.id}\`) ran command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`).`, message);

	if (command.controls.permissions) {
		let checkPerms = channelPermissions(command.controls.permissions, message.channel, client);
		if (checkPerms) {
			await commandExecuted(command, message, { pre, post: new Date(), success: false });
			return message.channel.send(checkPerms).catch(() => {});
		}
	}

	let qUserDB = await dbQuery("User", { id: message.author.id });
	if (command.controls.cooldown && command.controls.cooldown > 0 && permission > 1 && (!qUserDB.flags || (!qUserDB.flags.includes("NO_COOLDOWN") && !qUserDB.flags.includes("PROTECTED"))) && (!qServerDB.flags || !qServerDB.flags.includes("NO_COOLDOWN"))) {
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
				//If more than 15 cooldown breaches occur over the duration of the bot being up, auto-blacklist the user and notify the developers
				qUserDB.blocked = true;
				await dbModify("User", { id: message.author.id }, qUserDB);

				await commandExecuted(command, message, { pre, post: new Date(), success: false });

				counts.set(message.author.id, 0);

				message.channel.send(string("COOLDOWN_SPAM_FLAG", { mention: `<@${message.author.id}>`, support: `https://discord.gg/${support_invite}` }));

				let hook = new Discord.WebhookClient(log_hooks.commands.id, log_hooks.commands.token);
				return hook.send(`🚨 **EXCESSIVE COOLDOWN BREACHING**\n${message.author.tag} (\`${message.author.id}\`) has breached the cooldown limit of ${cooldownLimit.toString()}\nThey were automatically blacklisted from using the bot globally\n(@everyone)`, {disableMentions: "none"});
			}

			if (expires > now) {
				await commandExecuted(command, message, { pre, post: new Date(), success: false });
				return message.channel.send(`${string("COMMAND_COOLDOWN", { time: ((expires - now) / 1000).toFixed(0) })} ${command.controls.cooldownMessage ? command.controls.cooldownMessage : ""}`);
			}
		}

		times.set(message.author.id, now);
		setTimeout(() => times.delete(message.author.id), lengthMs);
	}

	if (qServerDB.config.blacklist && qServerDB.config.blacklist.includes(message.author.id)) {
		await commandExecuted(command, message, { pre, post: new Date(), success: false });
		return;
	}

	try {
		command.do(message, client, args, Discord)
			.then(() => {
				commandExecuted(command, message, { pre, post: new Date(), success: true });
			})
			.catch((err) => {
				let errorText;
				if (err.stack) errorText = err.stack;
				else if (err.error) errorText = err.error;
				message.channel.send(`${string("ERROR", {}, "error")} ${client.admins.has(message.author.id) && errorText ? `\n\`\`\`${(errorText).length >= 1000 ? (errorText).substring(0, 1000) + " content too long..." : err.stack}\`\`\`` : ""}`);
				errorLog(err, "Command Handler", `Message Content: ${message.content}`);

				console.log(err);
				commandExecuted(command, message, { pre, post: new Date(), success: false });
			});

	} catch (err) {
		let errorText;
		if (err.stack) errorText = err.stack;
		else if (err.error) errorText = err.error;
		message.channel.send(`${string("ERROR", {}, "error")} ${client.admins.has(message.author.id) && errorText ? `\n\`\`\`${(errorText).length >= 1000 ? (errorText).substring(0, 1000) + " content too long..." : err.stack}\`\`\`` : ""}`);
		errorLog(err, "Command Handler", `Message Content: ${message.content}`);

		console.log(err);
		commandExecuted(command, message, { pre, post: new Date(), success: false });
	}
};
