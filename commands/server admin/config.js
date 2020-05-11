const { colors, emoji } = require("../../config.json");
const { dbQueryNoNew, dbQuery, dbModify, channelPermissions, findRole, findChannel, findEmoji } = require("../../coreFunctions.js");
const nodeEmoji = require("node-emoji");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "config",
		permission: 2,
		aliases: ["serverconfig", "cfg", "configure"],
		usage: "config (element) (additional parameters)",
		description: "Shows/edits server configuration",
		enabled: true,
		docs: "admin/config",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", {id: message.guild.id});

		if (!args[0]) {
			let embed = new Discord.MessageEmbed();
			embed.setDescription(string("CONFIG_HELP", { prefix: qServerDB.config.prefix }));
			embed.setColor(colors.default);
			return message.channel.send(embed);
		}

		async function handleRoleInput (action, input, roles, current, present_string, success_string) {
			if (!input) return string("CFG_NO_ROLE_SPECIFIED_ERROR", {}, "error");
			let role = await findRole(input, roles);
			if (!role) return string("CFG_INVALID_ROLE_ERROR", {}, "error");
			switch (action) {
			case "add":
				if (current.includes(role.id)) return string(present_string, {}, "error");
				current.push(role.id);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return string(success_string, { role: role.name }, "success");
			case "remove":
				if (!current.includes(role.id)) return string(present_string, {}, "error");
				current.splice(current.findIndex(r => r === role.id), 1);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return string(success_string, { role: role.name }, "success");
			}
		}

		async function listRoles (roleList, server, title, fatal, append) {
			if (!roleList) return `${string(title, {}, fatal ? "error" : "success")} ${string("NONE_CONFIGURED")}`;
			if (typeof roleList === "string") {
				let role;
				if (server.roles.cache.get(roleList)) role = `${string(title, {}, "success")} ${server.roles.cache.get(roleList).name} (ID: \`${roleList}\`)`;
				else if (roleList) {
					roleList = "";
					await dbModify("Server", {id: server.id}, qServerDB);
				}
				return !role ? `${string(title, {}, fatal ? "error" : "success")} ${string("NONE_CONFIGURED")}` : role;
			} else {
				let roles = [];
				if (roleList.length > 0) {
					roleList.forEach(roleId => {
						if (server.roles.cache.get(roleId)) {
							roles.push(`${server.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
						} else {
							let index = roleList.findIndex(r => r === roleId);
							roleList.splice(index, 1);
						}
					});
					await dbModify("Server", {id: server.id}, qServerDB);
				}
				if (roles.length < 1) return [`${string(title, {}, fatal ? "error" : "success")} ${string("NONE_CONFIGURED")} ${append ? append : ""}`, fatal ? true : null];
				else return [`${string(title, {}, "success")}\n> ${roles.join("\n> ")}`];
			}
		}

		async function showChannel (channel, server, title, fatal, append) {
			let foundChannel = server.channels.cache.get(channel);
			if (!foundChannel || foundChannel.type !== "text") {
				return [`${string(title, {}, "error")} ${string("NONE_CONFIGURED")} ${append ? append : ""}`, true];
			}
			return [`${string(title, {}, "success")} <#${foundChannel.id}> (${foundChannel.id})`];
		}

		switch (args[0]) {
		case "admin":
		case "adminrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				return message.channel.send((await handleRoleInput("add", args.splice(2).join(" "), message.guild.roles.cache, qServerDB.config.admin_roles, "CFG_ALREADY_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_ADD_SUCCESS")), { disableMentions: "everyone" });
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				return message.channel.send((await handleRoleInput("remove", args.splice(2).join(" "), message.guild.roles.cache, qServerDB.config.admin_roles, "CFG_NOT_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_REMOVE_SUCCESS")), { disableMentions: "everyone" });
			}
			case "list": {
				return message.channel.send((await listRoles(qServerDB.config.admin_roles, message.guild, "CFG_ADMIN_ROLES_TITLE", true))[0]);
			}
			default: {
				if (args[1]) return message.channel.send(string("CFG_INVALID_ROLE_PARAM_ERROR"));
				else return message.channel.send((await listRoles(qServerDB.config.admin_roles, message.guild, "CFG_ADMIN_ROLES_TITLE", true))[0]);
			}
			}
		}
		case "staff":
		case "staffrole":
		case "reviewrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				return message.channel.send((await handleRoleInput("add", args.splice(2).join(" "), message.guild.roles.cache, qServerDB.config.staff_roles, "CFG_ALREADY_STAFF_ROLE_ERROR", "CFG_STAFF_ROLE_ADD_SUCCESS")), { disableMentions: "everyone" });
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				return message.channel.send((await handleRoleInput("remove", args.splice(2).join(" "), message.guild.roles.cache, qServerDB.config.staff_roles, "CFG_NOT_STAFF_ROLE_ERROR", "CFG_STAFF_ROLE_REMOVE_SUCCESS")), { disableMentions: "everyone" });
			}
			case "list": {
				return message.channel.send((await listRoles(qServerDB.config.staff_roles, message.guild, "CFG_STAFF_ROLES_TITLE", true))[0]);
			}
			default: {
				if (args[1]) return message.channel.send(string("CFG_INVALID_ROLE_PARAM_ERROR"));
				else return message.channel.send((await listRoles(qServerDB.config.staff_roles, message.guild, "CFG_STAFF_ROLES_TITLE", true))[0]);
			}
			}
		}
		case "allowed":
		case "allowedrole":
		case "suggestrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				return message.channel.send((await handleRoleInput("add", args.splice(2).join(" "), message.guild.roles.cache, qServerDB.config.allowed_roles, "CFG_ALREADY_ALLOWED_ROLE_ERROR", "CFG_ALLOWED_ROLE_ADD_SUCCESS")), { disableMentions: "everyone" });
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				return message.channel.send((await handleRoleInput("remove", args.splice(2).join(" "), message.guild.roles.cache, qServerDB.config.allowed_roles, "CFG_NOT_ALLOWED_ROLE_ERROR", "CFG_ALLOWED_ROLE_REMOVE_SUCCESS")), { disableMentions: "everyone" });
			}
			case "list": {
				return message.channel.send((await listRoles(qServerDB.config.allowed_roles, message.guild, "CFG_ALLOWED_ROLES_TITLE", true))[0]);
			}
			default: {
				if (args[1]) return message.channel.send(string("CFG_INVALID_ROLE_PARAM_ERROR"));
				else return message.channel.send((await listRoles(qServerDB.config.allowed_roles, message.guild, "CFG_ALLOWED_ROLES_TITLE", true))[0]);
			}
			}
		}
		case "approvedrole":
		case "approverole": {
			if (!args[1]) return message.channel.send((await listRoles(qServerDB.config.approved_role, message.guild, "CFG_APPROVED_ROLE_TITLE", false)));
			let input = args.splice(1).join(" ");
			if (input.toLowerCase() === "none" || input.toLowerCase() === "reset") {
				qServerDB.config.approved_role = "";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(string("CFG_RESET_APPROVED_ROLE_SUCCESS", {}, "success"));
			}
			if (!message.guild.me.permissions.has("MANAGE_ROLES")) return message.channel.send(string("CFG_NO_MANAGE_ROLES_ERROR", { bot: `<@${client.user.id}>` }, "error"));
			let role = await findRole(input, message.guild.roles.cache);
			if (!role) return message.channel.send(string("CFG_INVALID_ROLE_ERROR", {}, "error"));
			if (qServerDB.config.approved_role === role.id) return message.channel.send(string("CFG_ALREADY_APPROVED_ROLE_ERROR", {}, "error"));
			if (!role.editable || role.managed) return message.channel.send(string("CFG_UNMANAGEABLE_ROLE_ERROR", { role: role.name }, "error"), {disableMentions: "everyone"});
			qServerDB.config.approved_role = role.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(string("CFG_APPROVED_ROLE_SUCCESS", { role: role.name }, "success"), {disableMentions: "everyone"});
		}
		case "review":
		case "reviewchannel": {
			if (!args[1]) return message.channel.send(qServerDB.config.channels.staff ? `The suggestion review channel is currently configured to <#${qServerDB.config.channels.staff}>` : "This server has no suggestion review channel set!");
			let reviewInput = args.splice(1).join(" ").toLowerCase();
			let reviewChannel = await findChannel(reviewInput, message.guild.channels.cache);
			if (!reviewChannel || reviewChannel.type !== "text") return message.channel.send(`<:${emoji.x}> I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let reviewPerms = channelPermissions(reviewChannel.permissionsFor(client.user.id), "staff", client);
			if (reviewPerms.length > 0) {
				let embed = new Discord.MessageEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${reviewChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${reviewPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${reviewChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.staff = reviewChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${reviewChannel.id}> as the suggestion review channel.`);
		}
		case "suggestions":
		case "suggestionschannel": {
			if (!args[1]) {
				qServerDB.config.channels.suggestions ? message.channel.send(`The approved suggestions channel is currently configured to <#${qServerDB.config.channels.staff}>`) : message.channel.send("This server has no approved suggestions channel set!");
				return;
			}
			let suggestionInput = args.splice(1).join(" ").toLowerCase();
			let suggestionChannel = await findChannel(suggestionInput, message.guild.channels.cache);
			if (!suggestionChannel || suggestionChannel.type !== "text") return message.channel.send(`<:${emoji.x}> I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let suggestionPerms = channelPermissions(suggestionChannel.permissionsFor(client.user.id), "suggestions", client);
			if (suggestionPerms.length > 0) {
				let embed = new Discord.MessageEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${suggestionChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${suggestionPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${suggestionChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.suggestions = suggestionChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${suggestionChannel.id}> as the approved suggestions channel.`);
		}
		case "denied":
		case "deniedchannel": {
			if (!args[1]) return qServerDB.config.channels.denied ? message.channel.send(`The denied suggestions channel is currently configured to <#${qServerDB.config.channels.denied}>`) : message.channel.send("This server has no denied suggestions channel set!");
			let deniedInput = args.splice(1).join(" ").toLowerCase();
			if (deniedInput === "none" || deniedInput === "reset") {
				qServerDB.config.channels.denied = "";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully reset the denied suggestions channel.`);
			}
			let deniedChannel = await findChannel(deniedInput, message.guild.channels.cache);
			if (!deniedChannel || deniedChannel.type !== "text") return message.channel.send(`<:${emoji.x}> I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let deniedPerms = channelPermissions(deniedChannel.permissionsFor(client.user.id), "denied", client);
			if (deniedPerms.length > 0) {
				let embed = new Discord.MessageEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${deniedChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${deniedPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${deniedChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.denied = deniedChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${deniedChannel.id}> as the denied suggestions channel.`);
		}
		case "log":
		case "logs":
		case "logchannel": {
			if (!args[1]) return qServerDB.config.channels.log ? message.channel.send(`The log channel is currently configured to <#${qServerDB.config.channels.log}>`) : message.channel.send("This server has no log channel set!");
			let logInput = args.splice(1).join(" ").toLowerCase();
			if (logInput === "none" || logInput === "reset") {
				qServerDB.config.channels.log = "";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully reset the log channel.`);
			}
			let logChannel = await findChannel(logInput, message.guild.channels.cache);
			if (!logChannel || logChannel.type !== "text") return message.channel.send(`<:${emoji.x}> I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let logPerms = channelPermissions(logChannel.permissionsFor(client.user.id), "log", client);
			if (logPerms.length > 0) {
				let embed = new Discord.MessageEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${logChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${logPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${logChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			await logChannel.createWebhook("Suggester Logs", {avatar: client.user.displayAvatarURL({format: "png"}), reason: "Create log channel"}).then(async (webhook) => {
				qServerDB.config.loghook = {};
				qServerDB.config.loghook.id = webhook.id;
				qServerDB.config.loghook.token = webhook.token;
				qServerDB.config.channels.log = logChannel.id;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set <#${logChannel.id}> as the log channel.`);
			}).catch(() => {
				return message.channel.send(`<:${emoji.x}> I was unable to create a webhook in the provided channel. Please make sure that you have less than 10 webhooks in the channel and try again.`);
			});
			break;
		}
		case "commands":
		case "command":
		case "commandchannel":
		case "commandschannel": {
			if (!args[1]) {
				qServerDB.config.channels.commands ? message.channel.send(`The suggestion command channel is currently configured to <#${qServerDB.config.channels.commands}>`) : message.channel.send("This server has no suggestion command channel set!");
				return;
			}
			let commandsInput = args.splice(1).join(" ").toLowerCase();
			if (commandsInput === "none" || commandsInput === "reset") {
				qServerDB.config.channels.commands = "";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully reset the suggestion command channel.`);
			}
			let commandChannel = await findChannel(commandsInput, message.guild.channels.cache);
			if (!commandChannel || commandChannel.type !== "text") return message.channel.send(`<:${emoji.x}> I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let commandPerms = channelPermissions(commandChannel.permissionsFor(client.user.id), "commands", client);
			if (commandPerms.length > 0) {
				let embed = new Discord.MessageEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${commandChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${commandPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${commandChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.commands = commandChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${commandChannel.id}> as the suggestion command channel.`);
		}
		case "prefix": {
			if (!args[1]) return message.channel.send(`The current prefix for this server is ${qServerDB.config.prefix}`);
			let prefix = args[1];
			if (prefix.length > 20) return message.channel.send(`<:${emoji.x}> Your prefix must be 20 characters or less.`);
			let disallowed = ["suggester:", `${client.user.id}:`];
			if (disallowed.includes(prefix.toLowerCase())) return message.channel.send(`<:${emoji.x}> This prefix is disallowed, please choose a different prefix.`);
			qServerDB.config.prefix = prefix.toLowerCase();
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set this server's prefix to **${Discord.escapeMarkdown(prefix.toLowerCase())}**`);
		}
		case "archive":
		case "archivechannel":
		case "implementedchannel":
		case "implemented": {
			if (!args[1]) return qServerDB.config.channels.archive ? message.channel.send(`The implemented suggestions archive channel is currently configured to <#${qServerDB.config.channels.archive}>`) : message.channel.send("This server has no implemented suggestions archive channel set!");
			let archiveInput = args.splice(1).join(" ").toLowerCase();
			if (archiveInput === "none" || archiveInput === "reset") {
				qServerDB.config.channels.archive = "";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully reset the implemented suggestions archive channel.`);
			}
			let archiveChannel = await findChannel(archiveInput, message.guild.channels.cache);
			if (!archiveChannel || archiveChannel.type !== "text") return message.channel.send(`<:${emoji.x}> I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let archivePerms = channelPermissions(archiveChannel.permissionsFor(client.user.id), "denied", client); //Denied checks for all needed permissions
			if (archivePerms.length > 0) {
				let embed = new Discord.MessageEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${archiveChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${archivePerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${archiveChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.archive = archiveChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${archiveChannel.id}> as the implemented suggestions archive channel.`);
		}
		case "mode": {
			if (!args[1]) return message.channel.send(`The current mode for this server is **${qServerDB.config.mode}**.`);
			switch (args[1].toLowerCase()) {
			case "review":
				qServerDB.config.mode = "review";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set the mode for this server to **review**.`);
			case "autoapprove":
			case "auto-approve":
			case "auto_approve":
			case "auto": {
				let suggestionsAwaitingReview = await dbQueryNoNew("Suggestion", {status: "awaiting_review", id: message.guild.id});
				if (suggestionsAwaitingReview) return message.channel.send(`<:${emoji.x}> All suggestions awaiting review must be cleared before the autoapprove mode is set.`);
				qServerDB.config.mode = "autoapprove";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set the mode for this server to **autoapprove**.`);
			}
			default:
				return message.channel.send(`<:${emoji.x}> Please specify a valid mode (either \`review\` or \`autoapprove\`.`);
			}
		}
		case "emoji":
		case "emotes":
		case "emojis":
		case "emote":
		case "react":
		case "reactions": {
			const checkEmoji = function(emoji) {
				if (emoji === "none") return "Disabled";
				else if (nodeEmoji.find(emoji)) return emoji;
				else if (emoji.startsWith("a")) return `<${emoji}>`;
				else return `<:${emoji}>`;
			};

			if (!args[1]) {
				let reactEmbed = new Discord.MessageEmbed()
					.setDescription(`Suggestion feed reactions are currently ${qServerDB.config.react ? "enabled" : "disabled"}`)
					.addField("Upvote", (await findEmoji(checkEmoji(qServerDB.config.emojis.up), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.up === "none" ? "Disabled" : "👍"))
					.addField("Shrug/No Opinion", (await findEmoji(checkEmoji(qServerDB.config.emojis.mid), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.mid === "none" ? "Disabled" : "🤷"))
					.addField("Downvote", (await findEmoji(checkEmoji(qServerDB.config.emojis.down), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.down === "none" ? "Disabled" : "👎"))
					.setColor(qServerDB.config.react ? colors.default : colors.orange);
				return message.channel.send("Current server emoji settings:", reactEmbed);
			}

			switch (args[1].toLowerCase()) {
			case "up":
			case "upvote":
			case "yes": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify an emoji.`);
				if (args[2].toLowerCase() === "none" || args[2].toLowerCase() === "disable" || args[2].toLowerCase() === "off") {
					if (qServerDB.config.emojis.up === "none") return message.channel.send(`<:${emoji.x}> The upvote emoji is already disabled.`);
					qServerDB.config.emojis.up = "none";
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Successfully disabled the upvote reaction.`);
				}
				let upEmote = await findEmoji(args[2], message.guild.emojis.cache);
				if (upEmote[0]) {
					qServerDB.config.emojis.up = upEmote[0];
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Successfully set the upvote emoji for this server to ${upEmote[1]}.`);
				} else return message.channel.send(`<:${emoji.x}> The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.`);
			}
			case "shrug":
			case "neutral":
			case "middle":
			case "mid": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify an emoji.`);
				if (args[2].toLowerCase() === "none" || args[2].toLowerCase() === "disable" || args[2].toLowerCase() === "off") {
					if (qServerDB.config.emojis.mid === "none") return message.channel.send(`<:${emoji.x}> The shrug/no opinion emoji is already disabled.`);
					qServerDB.config.emojis.mid = "none";
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Successfully disabled the shrug/no opinion reaction.`);
				}
				let midEmote = await findEmoji(args[2], message.guild.emojis.cache);
				if (midEmote[0]) {
					qServerDB.config.emojis.mid = midEmote[0];
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Successfully set the shrug/no opinion emoji for this server to ${midEmote[1]}.`);
				} else return message.channel.send(`<:${emoji.x}> The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.`);
			}
			case "down":
			case "downvote":
			case "no": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify an emoji.`);
				if (args[2].toLowerCase() === "none" || args[2].toLowerCase() === "disable" || args[2].toLowerCase() === "off") {
					if (qServerDB.config.emojis.down === "none") return message.channel.send(`<:${emoji.x}> The downvote emoji is already disabled.`);
					qServerDB.config.emojis.down = "none";
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Successfully disabled the downvote reaction.`);
				}
				let downEmote = await findEmoji(args[2], message.guild.emojis.cache);
				if (downEmote[0]) {
					qServerDB.config.emojis.down = downEmote[0];
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Successfully set the downvote emoji for this server to ${downEmote[1]}.`);
				} else return message.channel.send(`<:${emoji.x}> The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.`);
			}
			case "enable":
				if (!qServerDB.config.react) {
					qServerDB.config.react = true;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Enabled suggestion feed reactions.`);
				} else return message.channel.send(`<:${emoji.x}> Suggestion feed reactions are already enabled!`);
			case "disable":
				if (qServerDB.config.react) {
					qServerDB.config.react = false;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Disabled suggestion feed reactions.`);
				} else return message.channel.send(`<:${emoji.x}> Suggestion feed reactions are already disabled!`);
			case "toggle":
				qServerDB.config.react = !qServerDB.config.react;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> ${qServerDB.config.react ? "Enabled": "Disabled"} suggestion feed reactions.`);
			default:
				return message.channel.send("Please specify a valid emoji setting (`up`, `mid`, `down`, or `toggle`).");
			}
		}
		case "notify":
		case "notifications":
		case "notification":
		case "notif": {
			if (!args[1]) return message.channel.send(`DM notifications on suggestion changes are currently **${qServerDB.config.notify ? "enabled" : "disabled"}**.`);
			switch (args[1].toLowerCase()) {
			case "enable":
			case "on": {
				if (!qServerDB.config.notify) {
					qServerDB.config.notify = true;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Enabled user notifications.`);
				} else return message.channel.send(`<:${emoji.x}> User notifications are already enabled!`);
			}
			case "disable":
			case "off": {
				if (qServerDB.config.notify) {
					qServerDB.config.notify = false;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Disabled user notifications.`);
				} else return message.channel.send(`<:${emoji.x}> User notifications are already disabled!`);
			}
			case "toggle":
				qServerDB.config.notify = !qServerDB.config.notify;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> ${qServerDB.config.notify ? "Enabled" : "Disabled"} user notifications.`);
			default:
				return message.channel.send(`<:${emoji.x}> Please specify a valid setting (\`enable\`, \`disable\`, or \`toggle\`)`);
			}
		}
		case "clear":
		case "clean":
		case "cleancommands":
		case "cleancommand": {
			if (!args[1]) return message.channel.send(`Auto-cleaning of suggestion commands is currently **${qServerDB.config.clean_suggestion_command ? "enabled" : "disabled"}**.`);
			switch (args[1].toLowerCase()) {
			case "enable":
			case "on": {
				if (!qServerDB.config.clean_suggestion_command) {
					if (!message.guild.me.permissions.has("MANAGE_MESSAGES")) return message.channel.send(`<:${emoji.x}> Auto-cleaning of suggestion commands requires the bot have the **Manage Messages** permission. Please give the bot this permission and try again.`);
					qServerDB.config.clean_suggestion_command = true;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Enabled auto-cleaning of suggestion commands.`);
				} else return message.channel.send(`<:${emoji.x}> Auto-cleaning of suggestion commands is already enabled!`);
			}
			case "disable":
			case "off": {
				if (qServerDB.config.clean_suggestion_command) {
					qServerDB.config.clean_suggestion_command = false;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Disabled auto-cleaning of suggestion commands.`);
				} else return message.channel.send(`<:${emoji.x}> Auto-cleaning of suggestion commands is already disabled!`);
			}
			case "toggle":
				if (!qServerDB.config.clean_suggestion_command && !message.guild.me.permissions.has("MANAGE_MESSAGES")) return message.channel.send(`<:${emoji.x}> Auto-cleaning of suggestion commands requires the bot have the **Manage Messages** permission. Please give the bot this permission and try again.`);
				qServerDB.config.clean_suggestion_command = !qServerDB.config.clean_suggestion_command;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> ${qServerDB.config.clean_suggestion_command ? "Enabled" : "Disabled"} auto-cleaning of suggestion commands.`);
			default:
				return message.channel.send(`<:${emoji.x}> Please specify a valid setting (\`enable\`, \`disable\`, or \`toggle\`)`);
			}
		}
		case "list": {
			let server = message.guild;

			let qServerDB = await dbQueryNoNew("Server", {id: server.id});
			if (!qServerDB || !qServerDB.config) return message.channel.send(string("NO_GUILD_DATABASE_ENTRY_ERROR", {}, "error"));

			let cfgRolesArr = [];
			let cfgChannelsArr = [];
			let cfgOtherArr = [];
			let issuesCountFatal = 0;

			// Admin roles
			let adminRoles = await listRoles(qServerDB.config.admin_roles, server, "CFG_ADMIN_ROLES_TITLE", true);
			if (adminRoles[1]) issuesCountFatal++;
			cfgRolesArr.push(adminRoles[0]);
			// Staff roles
			let staffRoles = await listRoles(qServerDB.config.staff_roles, server, "CFG_STAFF_ROLES_TITLE", true);
			if (staffRoles[1]) issuesCountFatal++;
			cfgRolesArr.push(staffRoles[0]);
			// Allowed roles
			cfgRolesArr.push((await listRoles(qServerDB.config.allowed_roles, server, "CFG_ALLOWED_ROLES_TITLE", false, string("CFG_ALLOWED_ROLES_APPEND")))[0]);
			// Approved suggestion role
			cfgRolesArr.push((await listRoles(qServerDB.config.approved_role, server, "CFG_APPROVED_ROLE_TITLE", false)));
			// Suggestions channel
			let suggestionChannel = await showChannel(qServerDB.config.channels.suggestions, server, "CFG_SUGGESTION_CHANNEL_TITLE", true);
			if (suggestionChannel[1]) {
				issuesCountFatal++;
				qServerDB.config.channels.suggestions = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(suggestionChannel[0]);
			// Staff review channel
			let reviewChannel = await showChannel(qServerDB.config.channels.staff, server, "CFG_REVIEW_CHANNEL_TITLE", qServerDB.config.mode === "review", qServerDB.config.mode === "autoapprove" ? string("CFG_REVIEW_NOT_NECESSARY_APPEND") : "");
			if (reviewChannel[1]) {
				if (qServerDB.config.mode === "review") issuesCountFatal++;
				qServerDB.config.channels.staff = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(reviewChannel[0]);
			// Denied channel
			let deniedChannel = await showChannel(qServerDB.config.channels.denied, server, "CFG_DENIED_CHANNEL_TITLE", false);
			if (deniedChannel[1]) {
				qServerDB.config.channels.denied = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(deniedChannel[0]);
			// Log channel
			let logChannel = await showChannel(qServerDB.config.channels.log, server, "CFG_LOG_CHANNEL_TITLE", false);
			if (logChannel[1]) {
				qServerDB.config.channels.log = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(logChannel[0]);
			// Archive channel
			let archiveChannel = await showChannel(qServerDB.config.channels.archive, server, "CFG_ARCHIVE_CHANNEL_TITLE", false);
			if (archiveChannel[1]) {
				qServerDB.config.channels.archive = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(archiveChannel[0]);
			// Commands channel
			let commandsChannel = await showChannel(qServerDB.config.channels.commands, server, "CFG_COMMANDS_CHANNEL_TITLE", false, string("CFG_COMMANDS_CHANNEL_APPEND"));
			if (commandsChannel[1]) {
				qServerDB.config.channels.commands = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(commandsChannel[0]);
			// Emojis
			const checkEmoji = function(emoji) {
				if (emoji === "none") return null;
				else if (nodeEmoji.find(emoji)) return emoji;
				else if (emoji.startsWith("a")) return `<${emoji}>`;
				else return `<:${emoji}>`;
			};
			let upEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.up), server.emojis.cache))[1] || (qServerDB.config.emojis.up === "none" ? string("CFG_UPVOTE_REACTION_DISABLED") : "👍");
			let midEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.mid), server.emojis.cache))[1] || (qServerDB.config.emojis.mid === "none" ? string("CFG_MID_REACTION_DISABLED") : "🤷");
			let downEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.down), server.emojis.cache))[1] || (qServerDB.config.emojis.down === "none" ? string("CFG_DOWNVOTE_REACTION_DISABLED") : "👎");

			cfgOtherArr.push(`${string("CFG_REACTION_EMOJIS_TITLE", {}, "success")} ${qServerDB.config.react ? string("ENABLED") : string("DISABLED")} (${upEmoji}, ${midEmoji}, ${downEmoji})`);
			// Mode
			let mode = string("ERROR", {}, "error");
			switch (qServerDB.config.mode) {
			case "review":
				mode = string("CFG_MODE_REVIEW");
				break;
			case "autoapprove":
				mode = string("CFG_MODE_AUTOAPPROVE");
				break;
			}
			cfgOtherArr.push(`${string("CFG_MODE_TITLE", {}, "success")} ${mode}`);
			// Prefix
			cfgOtherArr.push(`${string("CFG_PREFIX_TITLE", {}, "success")} ${Discord.escapeMarkdown(qServerDB.config.prefix)}`);
			// Notify
			cfgOtherArr.push(`${string("CFG_NOTIFICATIONS_TITLE", {}, "success")} ${string(qServerDB.config.notify ? "ENABLED" : "DISABLED")}`);
			//Clean Suggestion Command
			cfgOtherArr.push(`${string("CFG_CLEANCOMMANDS_TITLE", {}, "success")} ${string(qServerDB.config.clean_suggestion_command ? "ENABLED" : "DISABLED")}`);

			let cfgEmbed = new Discord.MessageEmbed()
				.setAuthor(string("SERVER_CONFIGURATION_TITLE", { server: server.name }), server.iconURL({ dynamic: true, format: "png" }))
				.addField(string("ROLE_CONFIGURATION_TITLE"), cfgRolesArr.join("\n"))
				.addField(string("CHANNEL_CONFIGURATION_TITLE"), cfgChannelsArr.join("\n"))
				.addField(string("OTHER_CONFIGURATION_TITLE"), cfgOtherArr.join("\n"));
			cfgEmbed.setColor(issuesCountFatal > 0 ? colors.red : colors.green)
				.addField(string("CFG_STATUS_TITLE"), issuesCountFatal > 0 ? string("CFG_STATUS_BAD", {}, "error") : string("CFG_STATUS_GOOD", {}, "success"));

			return message.channel.send(cfgEmbed);
		}
		default:
			return message.channel.send(`<:${emoji.x}> Invalid configuration element specified. Please run this command with no parameters to view configuration instructions.`);
		}

	}
};
