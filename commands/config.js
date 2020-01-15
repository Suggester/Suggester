const { colors, emoji } = require("../config.json");
const { dbQueryNoNew, dbQuery, dbModify, channelPermissions } = require("../coreFunctions.js");
const nodeEmoji = require("node-emoji");
module.exports = {
	controls: {
		permission: 2,
		aliases: ["serverconfig", "cfg", "configure"],
		usage: "config <admin|staff|review|suggestions|denied|prefix|mode>`\n\n**admin**: <add|remove> <role name or @mention>\n**staff**: <add|remove> <role name or @mention>\n**review**: <channel id or #mention>\n**suggestions**: <channel id or #mention>\n**denied**: <channel id or #mention>\n**prefix**: <new prefix>\n**mode**: <reviewcmd|autoapprove>",
		description: "Shows/edits server configuration",
		enabled: true,
		docs: "admin/config",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		if (!args[0]) {
			let embed = new Discord.RichEmbed();
			embed.setDescription("Please see https://suggester.gitbook.io/docs/admin/config for information about the config command. You can use `setup` to walkthrough setting up your server.");
			embed.setColor(colors.default);
			message.channel.send(embed);
			return;
		}
		let checkQServerDB = await dbQueryNoNew("Server", {id: message.guild.id});
		if (!checkQServerDB) {
			const {Server} = require("../utils/schemas");
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
					gold_threshold: 20,
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

		switch (args[0]) {
		case "admin":
		case "adminrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = message.mentions.roles.first() || message.guild.roles.find(r => r.name.toLowerCase() === input.toLowerCase()) || message.guild.roles.find(r => r.id === input) || null;
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (qServerDB.config.admin_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role has already been added as an admin role.`);
				qServerDB.config.admin_roles.push(role.id);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Added **${role.name}** to the list of server admin roles.`);
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = message.mentions.roles.first() || message.guild.roles.find(r => r.name.toLowerCase() === input.toLowerCase()) || message.guild.roles.find(r => r.id === input) || null;
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (!qServerDB.config.admin_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role is not currently an admin role.`);
				qServerDB.config.admin_roles.splice(qServerDB.config.admin_roles.findIndex(r => r === role.id), 1);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Removed **${role.name}** from the list of server admin roles.`);
			}
			case "list": {
				if (!qServerDB.config.admin_roles || qServerDB.config.admin_roles.length < 1) {
					return message.channel.send(`**Admin Roles:** None Configured`);
				} else {
					let adminRoleList = [];
					qServerDB.config.admin_roles.forEach(roleId => {
						if (message.guild.roles.get(roleId)) {
							adminRoleList.push(`${message.guild.roles.get(roleId).name} (ID: \`${roleId}\`)`);
						} else {
							let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
							qServerDB.config.admin_roles.splice(index, 1);
						}
					});
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`**Admin Roles:** ${adminRoleList.join(", ")}`);
				}
			}
			default: {
				if (args[1]) return message.channel.send("Please specify either `add`, `remove` or `list`.");
				else {
					if (!qServerDB.config.admin_roles || qServerDB.config.admin_roles.length < 1) {
						return message.channel.send(`**Admin Roles:** None Configured`);
					} else {
						let adminRoleList = [];
						qServerDB.config.admin_roles.forEach(roleId => {
							if (message.guild.roles.get(roleId)) {
								adminRoleList.push(`${message.guild.roles.get(roleId).name} (ID: \`${roleId}\`)`);
							} else {
								let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
								qServerDB.config.admin_roles.splice(index, 1);
							}
						});
						await dbModify("Server", {id: message.guild.id}, qServerDB);
						return message.channel.send(`**Admin Roles:** ${adminRoleList.join(", ")}`);
					}
				}
			}
			}
			break;
		}
		case "staff":
		case "reviewrole": {
			switch (args[1]) {
			case "add":
			case "+": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = message.mentions.roles.first() || message.guild.roles.find(r => r.name.toLowerCase() === input.toLowerCase()) || message.guild.roles.find(r => r.id === input) || null;
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (qServerDB.config.staff_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role has already been added as a staff role.`);
				qServerDB.config.staff_roles.push(role.id);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Added **${role.name}** to the list of server staff roles.`);
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
				let input = args.splice(2).join(" ");
				let role = message.mentions.roles.first() || message.guild.roles.find(r => r.name.toLowerCase() === input.toLowerCase()) || message.guild.roles.find(r => r.id === input) || null;
				if (!role) return message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.`);
				if (!qServerDB.config.staff_roles.includes(role.id)) return message.channel.send(`<:${emoji.x}> This role is not currently a staff role.`);
				qServerDB.config.staff_roles.splice(qServerDB.config.staff_roles.findIndex(r => r === role.id), 1);
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Removed **${role.name}** from the list of server staff roles.`);
			}
			case "list": {
				if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
					return message.channel.send(`**Staff Roles:** None Configured`);
				} else {
					let staffRoleList = [];
					qServerDB.config.staff_roles.forEach(roleId => {
						if (message.guild.roles.get(roleId)) {
							staffRoleList.push(`${message.guild.roles.get(roleId).name} (ID: \`${roleId}\`)`);
						} else {
							let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
							qServerDB.config.staff_roles.splice(index, 1);
						}
					});
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`**Staff Roles:** ${staffRoleList.join(", ")}`);
				}
			}
			default: {
				if (args[1]) return message.channel.send("Please specify either `add`, `remove` or `list`.");
				else {
					if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
						return message.channel.send(`**Staff Roles:** None Configured`);
					} else {
						let staffRoleList = [];
						qServerDB.config.staff_roles.forEach(roleId => {
							if (message.guild.roles.get(roleId)) {
								staffRoleList.push(`${message.guild.roles.get(roleId).name} (ID: \`${roleId}\`)`);
							} else {
								let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
								qServerDB.config.staff_roles.splice(index, 1);
							}
						});
						await dbModify("Server", {id: message.guild.id}, qServerDB);
						return message.channel.send(`**Staff Roles:** ${staffRoleList.join(", ")}`);
					}
				}
			}
			}
			break;
		}
		case "review":
		case "reviewchannel": //Legacy from V1
			if (!args[1]) {
				qServerDB.config.channels.staff ? message.channel.send(`The suggestion review channel is currently configured to <#${qServerDB.config.channels.staff}>`) : message.channel.send("This server has no suggestion review channel set!");
				return;
			}
			let reviewInput = args.splice(1).join(" ").toLowerCase();
			let reviewChannel = message.mentions.channels.first() || message.guild.channels.find(channel => channel.id === reviewInput) || message.guild.channels.find(channel => channel.name === reviewInput) || null;
			if (!reviewChannel) return message.channel.send(`<:${emoji.x}> I could not find a channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let reviewPerms = channelPermissions(reviewChannel.memberPermissions(client.user.id), "staff", client);
			if (reviewPerms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${reviewChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${reviewPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${reviewChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.staff = reviewChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${reviewChannel.id}> as the suggestion review channel.`);
		case "suggestions":
		case "suggestionschannel": //Legacy from V1
			if (!args[1]) {
				qServerDB.config.channels.suggestions ? message.channel.send(`The approved suggestions channel is currently configured to <#${qServerDB.config.channels.staff}>`) : message.channel.send("This server has no approved suggestions channel set!");
				return;
			}
			let suggestionInput = args.splice(1).join(" ").toLowerCase();
			let suggestionChannel = message.mentions.channels.first() || message.guild.channels.find(channel => channel.id === suggestionInput) || message.guild.channels.find(channel => channel.name === suggestionInput) || null;
			if (!suggestionChannel) return message.channel.send(`<:${emoji.x}> I could not find a channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let suggestionPerms = channelPermissions(suggestionChannel.memberPermissions(client.user.id), "suggestions", client);
			if (suggestionPerms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${suggestionChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${suggestionPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${suggestionChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.suggestions = suggestionChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${suggestionChannel.id}> as the approved suggestions channel.`);
		case "denied":
		case "deniedchannel": //Legacy from V1
			if (!args[1]) {
				qServerDB.config.channels.denied ? message.channel.send(`The denied suggestions channel is currently configured to <#${qServerDB.config.channels.denied}>`) : message.channel.send("This server has no denied suggestions channel set!");
				return;
			}
			let deniedInput = args.splice(1).join(" ").toLowerCase();
			if (deniedInput === "none" || deniedInput === "reset") {
				qServerDB.config.channels.denied = "";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully reset the denied suggestions channel.`);
			}
			let deniedChannel = message.mentions.channels.first() || message.guild.channels.find(channel => channel.id === deniedInput) || message.guild.channels.find(channel => channel.name === deniedInput) || null;
			if (!deniedChannel) return message.channel.send(`<:${emoji.x}> I could not find a channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let deniedPerms = channelPermissions(deniedChannel.memberPermissions(client.user.id), "denied", client);
			if (deniedPerms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${deniedChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${deniedPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${deniedChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			qServerDB.config.channels.denied = deniedChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${deniedChannel.id}> as the denied suggestions channel.`);
		case "log":
		case "logs":
		case "logchannel": //Legacy from V1
			if (!args[1]) {
				qServerDB.config.channels.log ? message.channel.send(`The log channel is currently configured to <#${qServerDB.config.channels.log}>`) : message.channel.send("This server has no log channel set!");
				return;
			}
			let logInput = args.splice(1).join(" ").toLowerCase();
			if (logInput === "none" || logInput === "reset") {
				qServerDB.config.channels.log = "";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully reset the log channel.`);
			}
			let logChannel = message.mentions.channels.first() || message.guild.channels.find(channel => channel.id === logInput) || message.guild.channels.find(channel => channel.name === logInput) || null;
			if (!logChannel) return message.channel.send(`<:${emoji.x}> I could not find a channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
			let logPerms = channelPermissions(logChannel.memberPermissions(client.user.id), "log", client);
			if (logPerms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${logChannel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${logPerms.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${logChannel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed);
			}
			await logChannel.createWebhook("Suggester Logs", client.user.displayAvatarURL, "Create log channel").then(webhook => {
				qServerDB.config.loghook.id = webhook.id;
				qServerDB.config.loghook.token = webhook.token;
			});
			qServerDB.config.channels.log = logChannel.id;
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set <#${logChannel.id}> as the log channel.`);
		case "prefix":
			if (!args[1]) return message.channel.send(`The current prefix for this server is ${qServerDB.config.prefix}`);
			let prefix = args[1];
			let disallowed = ["suggester:", `${client.user.id}:`];
			if (disallowed.includes(prefix.toLowerCase())) return message.channel.send(`<:${emoji.x}> This prefix is disallowed, please choose a different prefix.`);
			qServerDB.config.prefix = prefix.toLowerCase();
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			return message.channel.send(`<:${emoji.check}> Successfully set this server's prefix to **${prefix.toLowerCase()}**`);
		case "mode":
			if (!args[1]) return message.channel.send(`The current mode for this server is **${qServerDB.config.mode}**.`);
			switch (args[1].toLowerCase()) {
			case "review":
				qServerDB.config.mode = "review";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set the mode for this server to **review**.`);
				break;
			case "autoapprove":
			case "auto-approve":
			case "auto_approve":
			case "auto":
				let suggestionsAwaitingReview = await dbQueryNoNew("Suggestion", {status: "awaiting_review", id: message.guild.id});
				if (suggestionsAwaitingReview) return message.channel.send(`<:${emoji.x}> All suggestions awaiting review must be cleared before the autoapprove mode is set.`);
				qServerDB.config.mode = "autoapprove";
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set the mode for this server to **autoapprove**.`);
				break;
			default:
				return message.channel.send(`<:${emoji.x}> Please specify a valid mode (either \`review\` or \`autoapprove\`.`);
			}
			break;
		case "emoji":
		case "emotes":
		case "emojis":
		case "emote":
		case "react":
		case "reactions":
			function checkEmoji(emoji) {
				if (nodeEmoji.find(emoji)) return emoji;
				else if (emoji.startsWith("a")) return `<${emoji}>`;
				else return `<:${emoji}>`;
			}

			if (!args[1]) {
				let reactEmbed = new Discord.RichEmbed()
					.setDescription(`Suggestion feed reactions are currently ${qServerDB.config.react ? "enabled" : "disabled"}`)
					.addField("Upvote", checkEmoji(qServerDB.config.emojis.up))
					.addField("Shrug/No Opinion", checkEmoji(qServerDB.config.emojis.mid))
					.addField("Downvote", checkEmoji(qServerDB.config.emojis.down))
					.setColor(qServerDB.config.react ? colors.default : colors.orange);
				return message.channel.send("Current server emoji settings:", reactEmbed);
			}

			switch (args[1].toLowerCase()) {
			case "up":
			case "upvote":
			case "yes":
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify an emoji.`);
				let inputEmojiUp;
				if (nodeEmoji.find(args[2])) {
					inputEmojiUp = emoji.find(args[2]).emoji;
				} else {
					let upsplit1 = args[2].split(":");
					let upid = upsplit1[upsplit1.length - 1].split(">")[0];
					if (message.guild.emojis.get(upid)) {
						if (args[2].startsWith("<a")) {
							inputEmojiUp = `a:${message.guild.emojis.get(upid).name}:${message.guild.emojis.get(upid).id}`;
						} else {
							inputEmojiUp = `${message.guild.emojis.get(upid).name}:${message.guild.emojis.get(upid).id}`;
						}
					} else {
						return message.channel.send(`<:${emoji.x}> The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.`);
					}
				}
				qServerDB.config.emojis.up = inputEmojiUp;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set the upvote emoji for this server to ${checkEmoji(qServerDB.config.emojis.up)}.`);
			case "shrug":
			case "neutral":
			case "middle":
			case "mid":
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify an emoji.`);
				let inputEmojiMid;
				if (nodeEmoji.find(args[2])) {
					inputEmojiMid = emoji.find(args[2]).emoji;
				} else {
					let midsplit1 = args[2].split(":");
					let midid = midsplit1[midsplit1.length - 1].split(">")[0];
					if (message.guild.emojis.get(midid)) {
						if (args[2].startsWith("<a")) {
							inputEmojiMid = `a:${message.guild.emojis.get(midid).name}:${message.guild.emojis.get(midid).id}`;
						} else {
							inputEmojiMid = `${message.guild.emojis.get(midid).name}:${message.guild.emojis.get(midid).id}`;
						}
					} else {
						return message.channel.send(`<:${emoji.x}> The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.`);
					}
				}
				qServerDB.config.emojis.mid = inputEmojiMid;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set the shrug/no opinion emoji for this server to ${checkEmoji(qServerDB.config.emojis.mid)}.`);
			case "down":
			case "downvote":
			case "no":
				if (!args[2]) return message.channel.send(`<:${emoji.x}> You must specify an emoji.`);
				let inputEmojiDown;
				if (nodeEmoji.find(args[2])) {
					inputEmojiDown = emoji.find(args[2]).emoji;
				} else {
					let downsplit1 = args[2].split(":");
					let downid = downsplit1[downsplit1.length - 1].split(">")[0];
					if (message.guild.emojis.get(downid)) {
						if (args[2].startsWith("<a")) {
							inputEmojiDown = `a:${message.guild.emojis.get(downid).name}:${message.guild.emojis.get(downid).id}`;
						} else {
							inputEmojiDown = `${message.guild.emojis.get(downid).name}:${message.guild.emojis.get(downid).id}`;
						}
					} else {
						return message.channel.send(`<:${emoji.x}> The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.`);
					}
				}
				qServerDB.config.emojis.down = inputEmojiDown;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				return message.channel.send(`<:${emoji.check}> Successfully set the downvote emoji for this server to ${checkEmoji(qServerDB.config.emojis.down)}.`);
			case "enable":
				if (!qServerDB.config.react) {
					qServerDB.config.react = true;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Enabled suggestion feed reactions.`);
				} else {
					return message.channel.send(`<:${emoji.x}> Suggestion feed reactions are already enabled!`);
				}
				break;
			case "disable":
				if (qServerDB.config.react) {
					qServerDB.config.react = false;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Disabled suggestion feed reactions.`);
				} else {
					return message.channel.send(`<:${emoji.x}> Suggestion feed reactions are already disabled!`);
				}
				break;
			case "toggle":
				if (qServerDB.config.react) {
					qServerDB.config.react = false;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Disabled suggestion feed reactions.`);
				} else {
					qServerDB.config.react = true;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Enabled suggestion feed reactions.`);
				}
				break;
			default:
				return message.channel.send("Please specify a valid emoji setting (`up`, `mid`, `down`, or `toggle`).");
			}
			break;
		case "notify":
			if (!args[1]) {
				qServerDB.config.notify ? message.channel.send("DM notifications on suggestion changes are currently **enabled**.") : message.channel.send("DM notifications on suggestion changes are currently **disabled**.");
				return;
			}
			switch (args[1].toLowerCase()) {
			case "enable":
				if (!qServerDB.config.notify) {
					qServerDB.config.notify = true;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Enabled user notifications.`);
				} else {
					return message.channel.send(`<:${emoji.x}> User notifications are already enabled!`);
				}
				break;
			case "disable":
				if (qServerDB.config.notify) {
					qServerDB.config.notify = false;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Disabled user notifications.`);
				} else {
					return message.channel.send(`<:${emoji.x}> User notifications are already disabled!`);
				}
				break;
			case "toggle":
				if (qServerDB.config.notify) {
					qServerDB.config.notify = false;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Disabled user notifications.`);
				} else {
					qServerDB.config.notify = true;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					return message.channel.send(`<:${emoji.check}> Enabled user notifications.`);
				}
				break;
			}
		case "list":
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
					if (server.roles.get(roleId)) {
						adminRoleList.push(`${server.roles.get(roleId).name} (ID: \`${roleId}\`)`);
					} else {
						let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
						qServerDB.config.admin_roles.splice(index, 1);
					}
				});
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				cfgArr.push(`<:${emoji.check}> **Admin Roles:** ${adminRoleList.join(", ")}`);
			}
			// Staff roles
			if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
				cfgArr.push(`<:${emoji.x}> **Staff Roles:** None Configured`);
				issuesCountFatal++;
			} else {
				let staffRoleList = [];
				qServerDB.config.staff_roles.forEach(roleId => {
					if (server.roles.get(roleId)) {
						staffRoleList.push(`${server.roles.get(roleId).name} (ID: \`${roleId}\`)`);
					} else {
						let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
						qServerDB.config.staff_roles.splice(index, 1);
					}
				});
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				cfgArr.push(`<:${emoji.check}> **Staff Roles:** ${staffRoleList.join(", ")}`);
			}
			// Staff review channel
			if (!qServerDB.config.channels.staff) {
				cfgArr.push(`<:${emoji.x}> **Suggestion Review Channel:** None Configured`);
				qServerDB.config.mode === "review" ? issuesCountFatal++ : issuesCountMinor++;
			} else {
				let channel = server.channels.get(qServerDB.config.channels.staff);
				if (!channel) {
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
				let channel = server.channels.get(qServerDB.config.channels.suggestions);
				if (!channel) {
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
				let channel = server.channels.get(qServerDB.config.channels.denied);
				if (!channel) {
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
				let channel = server.channels.get(qServerDB.config.channels.log);
				if (!channel) {
					qServerDB.config.channels.log = "";
					issuesCountMinor++;
					await dbModify("Server", {id: message.guild.id}, qServerDB);
					cfgArr.push(`<:${emoji.x}> **Log Channel:** None Configured`);
				} else {
					cfgArr.push(`<:${emoji.check}> **Log Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Emojis
			let upEmoji;
			let midEmoji;
			let downEmoji;
			if (qServerDB.config.emojis.up) {
				if (nodeEmoji.find(qServerDB.config.emojis.up)) {
					upEmoji = qServerDB.config.emojis.up;
				} else if (qServerDB.config.emojis.up.startsWith("a")) {
					upEmoji = `<${qServerDB.config.emojis.up}>`;
				} else {
					upEmoji = `<:${qServerDB.config.emojis.up}>`;
				}
			} else {
				upEmoji = "No Upvote Emoji";
			}
			if (qServerDB.config.emojis.mid) {
				if (nodeEmoji.find(qServerDB.config.emojis.mid)) {
					midEmoji = qServerDB.config.emojis.mid;
				} else if (qServerDB.config.emojis.mid.startsWith("a")) {
					midEmoji = `<${qServerDB.config.emojis.mid}>`;
				} else {
					midEmoji = `<:${qServerDB.config.emojis.mid}>`;
				}
			} else {
				midEmoji = "No Middle Emoji";
			}
			if (qServerDB.config.emojis.down) {
				if (nodeEmoji.find(qServerDB.config.emojis.down)) {
					downEmoji = qServerDB.config.emojis.down;
				} else if (qServerDB.config.emojis.down.startsWith("a")) {
					downEmoji = `<${qServerDB.config.emojis.down}>`;
				} else {
					downEmoji = `<:${qServerDB.config.emojis.down}>`;
				}
			} else {
				downEmoji = "No Downvote Emoji";
			}

			cfgArr.push(`<:${emoji.check}> **Reaction Emojis:** ${upEmoji}, ${midEmoji}, ${downEmoji}`);
			qServerDB.config.react ? cfgArr.push(`<:${emoji.check}> **Suggestion Feed Reactions:** Enabled`) : cfgArr.push(`<:${emoji.check}> **Suggestion Feed Reactions:** Disabled`);
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
			cfgArr.push(`<:${emoji.check}> **Prefix:** ${qServerDB.config.prefix}`);
			// Notify
			qServerDB.config.notify ? cfgArr.push(`<:${emoji.check}> **Notifications:** All suggestion actions DM the suggesting user`) : cfgArr.push(`<:${emoji.check}> **Notifications:** Suggestion actions do not DM the suggesting user`);

			let cfgEmbed = new Discord.RichEmbed()
				.setTitle(`Server Configuration for ${server.name}`)
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
		default:
			return message.channel.send(`<:${emoji.x}> Invalid configuration element specified. Please run this command with no parameters to view configuration instructions.`);
		}

	}
};
