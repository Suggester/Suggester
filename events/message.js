const { dbQuery, dbModify, coreLog, commandLog, checkPermissions, errorLog } = require("../coreFunctions");
const { emoji, colors, prefix: defaultPrefix, log_hooks, support_invite } = require("../config.json");
const { Collection } = require("discord.js");

module.exports = async (Discord, client, message) => {
	if (message.channel.type !== "text") {
		let dmEmbed = new Discord.MessageEmbed()
			.setDescription(message.content);
		if (message.channel.type === "dm" && client.user.id !== message.author.id) return coreLog(`:e_mail: **${message.author.tag}** (\`${message.author.id}\`) sent a DM to the bot:`, dmEmbed);
		return;
	}
	if (message.author.bot === true) return;

	const permission = await checkPermissions(message.member, client);

	const qServerDB = await dbQuery("Server", { id: message.guild.id });
	const serverPrefix = (qServerDB && qServerDB.config && qServerDB.config.prefix) || defaultPrefix;

	const publicPrefixes = [serverPrefix, `<@${client.user.id}>`, `<@!${client.user.id}>`];
	const staffPrefixes = ["suggester:", `${client.user.id}`];

	const prefixes = publicPrefixes.concat(permission <= 1 ? staffPrefixes : []).map(p => p.toLowerCase());
	const lcContent = message.content.toLowerCase();

	const prefix = prefixes.find(p => lcContent.startsWith(p));

	if (!lcContent.startsWith(prefix)) return;

	const [commandName, ...args] = message.content.slice(prefix.length).trim().split(" ");

	const command = client.commands.find((c) => c.controls.name.toLowerCase() === commandName || c.controls.aliases && c.controls.aliases.includes(commandName));
	if (!command) return;

	let contentEmbed = new Discord.MessageEmbed()
		.setDescription(message.content);

	if (command.controls.enabled === false) {
		commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but the command is disabled.`, contentEmbed);
		return message.channel.send("This command is currently disabled globally.");
	}
	if (permission > command.controls.permission) return commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but did not have permission to do so.`, contentEmbed);

	commandLog(`🔧 ${message.author.tag} (\`${message.author.id}\`) ran command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`).`, contentEmbed);

	if (command.controls.permissions) {
		let channelPermissions = message.channel.permissionsFor(client.user.id);
		let list = [];
		const permissionNames = require("../utils/permissions.json");
		command.controls.permissions.forEach(permission => {
			if (!channelPermissions.has(permission)) list.push(permissionNames[permission]);
		});
		if (list.length >= 1) {
			if (channelPermissions.has("EMBED_LINKS")) {
				//Can embed
				let embed = new Discord.MessageEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${list.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed).catch(() => {
					message.author.send(`Your command \`${commandName}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`).catch(() => {});
				});
			} else {
				//Cannot embed
				return message.channel.send(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:\n - ${list.join("\n- ")}\nIn the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has the following permissions allowed.`).catch(() => {
					message.author.send(`Your command \`${commandName}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`).catch(() => {});
				});
			}
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

				counts.set(message.author.id, 0);

				message.channel.send(`<@${message.author.id}> ⚠️ You have been flagged by the command spam protection filter. This is generally caused when you use a lot of commands too quickly over a period of time. Due to this, you cannot use commands temporarily until a Suggester staff member reviews your situation. If you believe this is an error, please join https://discord.gg/${support_invite} and contact our Support Team.`);

				let hook = new Discord.WebhookClient(log_hooks.commands.id, log_hooks.commands.token);
				hook.send(`🚨 **EXCESSIVE COOLDOWN BREACHING**\n${message.author.tag} (\`${message.author.id}\`) has breached the cooldown limit of ${cooldownLimit.toString()}\nThey were automatically blacklisted from using the bot globally\n(@everyone)`, {disableMentions: "none"});
				return;
			}

			if (expires > now) return message.channel.send(`🕑 This command is on cooldown for ${((expires - now) / 1000).toFixed(0)} more second${((expires - now) / 1000).toFixed(0) !== "1" ? "s" : ""}. ${command.controls.cooldownMessage ? command.controls.cooldownMessage : ""}`);
		}

		times.set(message.author.id, now);
		setTimeout(() => times.delete(message.author.id), lengthMs);
	}

	try {
		return command.do(message, client, args, Discord);
	} catch (err) {
		message.channel.send(`<:${emoji.x}> Something went wrong with that command, please try again later.`);
		errorLog(err, "Command Handler", `Message Content: ${message.content}`);
	}
};
