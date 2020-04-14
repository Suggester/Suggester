const { colors, emoji, prefix } = require("../../config.json");
const { dbQueryNoNew, dbQuery, dbModify, channelPermissions, findRole, findChannel, findEmoji } = require("../../coreFunctions.js");
const nodeEmoji = require("node-emoji");
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
		let checkQServerDB = await dbQueryNoNew("Server", {id: message.guild.id});
		if (!checkQServerDB) {
			const {Server} = require("../../utils/schemas");
			await new Server({
				id: message.guild.id,
				blocked: false,
				whitelist: false,
				config: {
					prefix: ".",
					admin_roles: [],
					staff_roles: [],
					channels: {
						suggestions: "",
						staff: "",
						log: "",
						denied: ""
					},
					notify: true,
					react: true,
					mode: "review",
					emojis: {
						up: "👍",
						mid: "🤷",
						down: "👎"
					},
					loghook: {
						id: "",
						token: ""
					}
				}
			}).save();
		}

		let qServerDB = await dbQuery("Server", {id: message.guild.id});

		if (!args[0]) {
			let embed = new Discord.MessageEmbed();
			embed.setDescription(`Please see https://suggester.js.org/#/admin/config for information about the config command. You can use \`${qServerDB.config.prefix || prefix}setup\` to walkthrough setting up your server.`);
			embed.setColor(colors.default);
			return message.channel.send(embed);
		}

		switch (args[0]) {
		case "admin":
		case "adminrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = await findRole(input, message.guild.roles.cache);
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (qServerDB.config.admin_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role has already been added as an admin role.`);
				qServerDB.config.admin_roles.push(role.id);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Added **${role.name}** to the list of server admin roles.`, {disableMentions: "everyone"});
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = await findRole(input, message.guild.roles.cache);
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (!qServerDB.config.admin_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role is not currently an admin role.`);
				qServerDB.config.admin_roles.splice(qServerDB.config.admin_roles.findIndex(r => r === role.id), 1);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Removed **${role.name}** from the list of server admin roles.`, {disableMentions: "everyone"});
			}
			case "list": {
				if (!qServerDB.config.admin_roles || qServerDB.config.admin_roles.length < 1) {
					return message.channel.send("**Admin Roles:** None Configured");
				} else {
					let adminRoleList = [];
					let removed = 0;
					qServerDB.config.admin_roles.forEach(roleId => {
						if (message.guild.roles.cache.get(roleId)) {
							adminRoleList.push(`${message.guild.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
						} else {
							let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
							qServerDB.config.admin_roles.splice(index, 1);
							removed++;
						}
					});
					if (removed) await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`**Admin Roles:**\n>>> ${adminRoleList.join("\n")}`, {disableMentions: "everyone"});
				}
			}
			default: {
				if (args[1]) return message.channel.send("Please specify either `add`, `remove` or `list`.");
				else {
					if (!qServerDB.config.admin_roles || qServerDB.config.admin_roles.length < 1) {
						return message.channel.send("**Admin Roles:** None Configured");
					} else {
						let adminRoleList = [];
						let removed = 0;
						qServerDB.config.admin_roles.forEach(roleId => {
							if (message.guild.roles.cache.get(roleId)) {
								adminRoleList.push(`${message.guild.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
							} else {
								let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
								qServerDB.config.admin_roles.splice(index, 1);
								removed++;
							}
						});
						if (removed) await dbModify("Server", {id: message.guild.id}, qServerDB);
						return message.channel.send(`**Admin Roles:**\n>>> ${adminRoleList.join("\n")}`, {disableMentions: "everyone"});
					}
				}
			}
			}
		}
		case "staff":
		case "staffrole":
		case "reviewrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = await findRole(input, message.guild.roles.cache);
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (qServerDB.config.staff_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role has already been added as a staff role.`);
				qServerDB.config.staff_roles.push(role.id);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Added **${role.name}** to the list of server staff roles.`, {disableMentions: "everyone"});
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = await findRole(input, message.guild.roles.cache);
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (!qServerDB.config.staff_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role is not currently a staff role.`);
				qServerDB.config.staff_roles.splice(qServerDB.config.staff_roles.findIndex(r => r === role.id), 1);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Removed **${role.name}** from the list of server staff roles.`, {disableMentions: "everyone"});
			}
			case "list": {
				if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
					return message.channel.send("**Staff Roles:** None Configured");
				} else {
					let staffRoleList = [];
					let removed = 0;
					qServerDB.config.staff_roles.forEach(roleId => {
						if (message.guild.roles.cache.get(roleId)) {
							staffRoleList.push(`${message.guild.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
						} else {
							let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
							qServerDB.config.staff_roles.splice(index, 1);
							removed++;
						}
					});
					if (removed) await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`**Staff Roles:**\n>>> ${staffRoleList.join("\n")}`, {disableMentions: "everyone"});
				}
			}
			default: {
				if (args[1]) return message.channel.send("Please specify either `add`, `remove` or `list`.");
				else {
					if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
						return message.channel.send("**Staff Roles:** None Configured");
					} else {
						let staffRoleList = [];
						let removed = 0;
						qServerDB.config.staff_roles.forEach(roleId => {
							if (message.guild.roles.cache.get(roleId)) {
								staffRoleList.push(`${message.guild.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
							} else {
								let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
								qServerDB.config.staff_roles.splice(index, 1);
								removed++;
							}
						});
						if (removed) await dbModify("Server", {id: message.guild.id}, qServerDB);
						return message.channel.send(`**Staff Roles:**\n>>> ${staffRoleList.join("\n")}`, {disableMentions: "everyone"});
					}
				}
			}
			}
		}
		case "allowed":
		case "allowedrole":
		case "suggestrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = await findRole(input, message.guild.roles.cache);
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (qServerDB.config.allowed_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role has already been given permission to submit suggestions.`);
				qServerDB.config.allowed_roles.push(role.id);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Members with the **${role.name}** role can now submit suggestions.`, {disableMentions: "everyone"});
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = await findRole(input, message.guild.roles.cache);
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (!qServerDB.config.allowed_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role is not currently able to submit suggestions.`);
				qServerDB.config.allowed_roles.splice(qServerDB.config.allowed_roles.findIndex(r => r === role.id), 1);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Members with the **${role.name}** role can no longer submit suggestions.`, {disableMentions: "everyone"});
			}
			case "list": {
				if (!qServerDB.config.allowed_roles || qServerDB.config.allowed_roles.length < 1) {
					return message.channel.send("**Allowed Suggesting Roles:** None Configured (all users can submit suggestions)");
				} else {
					let allowedRoleList = [];
					let removed = 0;
					qServerDB.config.allowed_roles.forEach(roleId => {
						if (message.guild.roles.cache.get(roleId)) {
							allowedRoleList.push(`${message.guild.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
						} else {
							let index = qServerDB.config.allowed_roles.findIndex(r => r === roleId);
							qServerDB.config.allowed_roles.splice(index, 1);
							removed++;
						}
					});
					if (removed) await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`**Allowed Suggesting Roles:**\n>>> ${allowedRoleList.join("\n")}`, {disableMentions: "everyone"});
				}
			}
			default: {
				if (args[1]) return message.channel.send("Please specify either `add`, `remove` or `list`.");
				else {
					if (!qServerDB.config.allowed_roles || qServerDB.config.allowed_roles.length < 1) {
						return message.channel.send("**Allowed Suggesting Roles:** None Configured (all users can submit suggestions)");
					} else {
						let allowedRoleList = [];
						let removed = 0;
						qServerDB.config.allowed_roles.forEach(roleId => {
							if (message.guild.roles.cache.get(roleId)) {
								allowedRoleList.push(`${message.guild.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
							} else {
								let index = qServerDB.config.allowed_roles.findIndex(r => r === roleId);
								qServerDB.config.allowed_roles.splice(index, 1);
								removed++;
							}
						});
						if (removed) await dbModify("Server", {id: message.guild.id}, qServerDB);
						return message.channel.send(`**Allowed Suggesting Roles:**\n>>> ${allowedRoleList.join("\n")}`, {disableMentions: "everyone"});
					}
				}
			}
			}
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
				qServerDB.config.clean_suggestion_command = !qServerDB.config.clean_suggestion_command;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> ${qServerDB.config.notify ? "Enabled" : "Disabled"} auto-cleaning of suggestion commands.`);
			default:
				return message.channel.send(`<:${emoji.x}> Please specify a valid setting (\`enable\`, \`disable\`, or \`toggle\`)`);
			}
		}
		case "list": {
			let server = message.guild;
			let cfgArr = [];
			let issuesCountFatal = 0;
			let issuesCountMinor = 0;

			// Admin roles
			if (!qServerDB.config.admin_roles || qServerDB.config.admin_roles.length < 1) {
				cfgArr.push(`<:${emoji.x}> **Admin Roles:** None Configured`);
				issuesCountFatal++;
			} else {
				let adminRoleList = [];
				qServerDB.config.admin_roles.forEach(roleId => {
					if (server.roles.cache.get(roleId)) {
						adminRoleList.push(`${server.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
					} else {
						let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
						qServerDB.config.admin_roles.splice(index, 1);
					}
				});
				await dbModify("Server", {id: server.id}, qServerDB);
				cfgArr.push(`<:${emoji.check}> **Admin Roles:**\n> ${adminRoleList.join("\n> ")}`);
			}
			// Staff roles
			if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
				cfgArr.push(`<:${emoji.x}> **Staff Roles:** None Configured`);
				issuesCountFatal++;
			} else {
				let staffRoleList = [];
				qServerDB.config.staff_roles.forEach(roleId => {
					if (server.roles.cache.get(roleId)) {
						staffRoleList.push(`${server.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
					} else {
						let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
						qServerDB.config.staff_roles.splice(index, 1);
					}
				});
				await dbModify("Server", {id: server.id}, qServerDB);
				cfgArr.push(`<:${emoji.check}> **Staff Roles:**\n> ${staffRoleList.join("\n > ")}`);
			}
			// Allowed roles
			if (!qServerDB.config.allowed_roles || qServerDB.config.allowed_roles.length < 1) {
				cfgArr.push(`<:${emoji.check}> **Allowed Suggesting Roles:** None Configured (all users can submit suggestions)`);
			} else {
				let allowedRoleList = [];
				qServerDB.config.allowed_roles.forEach(roleId => {
					if (server.roles.cache.get(roleId)) {
						allowedRoleList.push(`${server.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
					} else {
						let index = qServerDB.config.allowed_roles.findIndex(r => r === roleId);
						qServerDB.config.allowed_roles.splice(index, 1);
					}
				});
				await dbModify("Server", {id: server.id}, qServerDB);
				cfgArr.push(`<:${emoji.check}> **Allowed Suggesting Roles:**\n> ${allowedRoleList.join("\n > ")}`);
			}
			// Staff review channel
			if (!qServerDB.config.channels.staff) {
				cfgArr.push(`<:${emoji.x}> **Suggestion Review Channel:** None Configured`);
				qServerDB.config.mode === "review" ? issuesCountFatal++ : issuesCountMinor++;
			} else {
				let channel = server.channels.cache.get(qServerDB.config.channels.staff);
				if (!channel || channel.type !== "text") {
					qServerDB.config.channels.staff = "";
					qServerDB.config.mode === "review" ? issuesCountFatal++ : issuesCountMinor++;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					cfgArr.push(`<:${emoji.x}> **Suggestion Review Channel:** None Configured`);
				} else {
					cfgArr.push(`<:${emoji.check}> **Suggestion Review Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Suggestions channel
			if (!qServerDB.config.channels.suggestions) {
				cfgArr.push(`<:${emoji.x}> **Approved Suggestions Channel:** None Configured`);
				issuesCountFatal++;
			} else {
				let channel = server.channels.cache.get(qServerDB.config.channels.suggestions);
				if (!channel || channel.type !== "text") {
					qServerDB.config.channels.suggestions = "";
					issuesCountFatal++;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					cfgArr.push(`<:${emoji.x}> **Approved Suggestions Channel:** None Configured`);
				} else {
					cfgArr.push(`<:${emoji.check}> **Approved Suggestions Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Denied channel
			if (!qServerDB.config.channels.denied) {
				cfgArr.push(`<:${emoji.x}> **Denied Suggestions Channel:** None Configured`);
				issuesCountMinor++;
			} else {
				let channel = server.channels.cache.get(qServerDB.config.channels.denied);
				if (!channel || channel.type !== "text") {
					qServerDB.config.channels.denied = "";
					issuesCountMinor++;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					cfgArr.push(`<:${emoji.x}> **Denied Suggestions Channel:** None Configured`);
				} else {
					cfgArr.push(`<:${emoji.check}> **Denied Suggestions Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Log channel
			if (!qServerDB.config.channels.log) {
				cfgArr.push(`<:${emoji.x}> **Log Channel:** None Configured`);
				issuesCountMinor++;
			} else {
				let channel = server.channels.cache.get(qServerDB.config.channels.log);
				if (!channel || channel.type !== "text") {
					qServerDB.config.channels.log = "";
					issuesCountMinor++;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					cfgArr.push(`<:${emoji.x}> **Log Channel:** None Configured`);
				} else {
					cfgArr.push(`<:${emoji.check}> **Log Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Commands channel
			if (!qServerDB.config.channels.commands) cfgArr.push(`<:${emoji.check}> **Suggestion Command Channel:** None Configured (Suggestions can be made in all channels)`);
			else {
				let channel = server.channels.cache.get(qServerDB.config.channels.commands);
				if (!channel || channel.type !== "text") {
					qServerDB.config.channels.commands = "";
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					cfgArr.push(`<:${emoji.check}> **Suggestion Command Channel:** None Configured (Suggestions can be made in all channels)`);
				} else {
					cfgArr.push(`<:${emoji.check}> **Suggestion Command Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Emojis
			const checkEmoji = function(emoji) {
				if (emoji === "none") return "Disabled";
				else if (nodeEmoji.find(emoji)) return emoji;
				else if (emoji.startsWith("a")) return `<${emoji}>`;
				else return `<:${emoji}>`;
			};
			let upEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.up), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.up === "none" ? "(Upvote Reaction Disabled)" : "👍");
			let midEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.mid), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.mid === "none" ? "(Shrug/No Opinion Reaction Disabled)" : "🤷");
			let downEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.down), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.down === "none" ? "(Downvote Reaction Disabled)" : "👎");

			cfgArr.push(`<:${emoji.check}> **Reaction Emojis:** ${upEmoji}, ${midEmoji}, ${downEmoji}`);
			cfgArr.push(`<:${emoji.check}> **Suggestion Feed Reactions:** ${qServerDB.config.react ? "Enabled" : "Disabled"}`);
			// Mode
			switch (qServerDB.config.mode) {
			case "review":
				cfgArr.push(`<:${emoji.check}> **Mode:** All suggestions are held for review`);
				break;
			case "autoapprove":
				cfgArr.push(`<:${emoji.check}> **Mode:** All suggestions are automatically approved`);
				break;
			default:
				cfgArr.push(`<:${emoji.x}> **Mode:** Broken mode configuration, please reconfigure the mode.`);
				issuesCountFatal++;
			}
			// Prefix
			cfgArr.push(`<:${emoji.check}> **Prefix:** ${Discord.escapeMarkdown(qServerDB.config.prefix)}`);
			// Notify
			cfgArr.push(`<:${emoji.check}> **Notifications:** ${qServerDB.config.notify ? "All suggestion actions DM the suggesting user" : "Suggestion actions do not DM the suggesting user"}`);
			//Clean Suggestion Command
			cfgArr.push(`<:${emoji.check}> **Clean Suggestion Command:** ${qServerDB.config.clean_suggestion_command ? "Suggestion commands are removed from the channel after a few seconds" : "Suggestion commands are not removed automatically"}`);

			let cfgEmbed = new Discord.MessageEmbed()
				.setTitle(`Server Configuration for **${server.name}**`)
				.setDescription(cfgArr.join("\n"));
			if (issuesCountFatal > 0) {
				cfgEmbed.setColor(colors.red)
					.addField("Config Status", `<:${emoji.x}> Not Fully Configured, Bot Will Not Work`);
			} else if (issuesCountMinor > 0) {
				cfgEmbed.setColor(colors.orange)
					.addField("Config Status", `<:${emoji.mid}> Not Fully Configured, Bot Will Still Work`);
			} else {
				cfgEmbed.setColor(colors.green)
					.addField("Config Status", `<:${emoji.check}> Fully Configured`);
			}

			return message.channel.send(cfgEmbed);
		}
		default:
			return message.channel.send(`<:${emoji.x}> Invalid configuration element specified. Please run this command with no parameters to view configuration instructions.`);
		}

	}
};
