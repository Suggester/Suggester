const config = require("../config.json");
const core = require("../coreFunctions.js");
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
	do: (message, client, args, Discord) => {
		if (!args[0]) {
			let embed = new Discord.RichEmbed();
			embed.setDescription("Please see https://suggester.gitbook.io/docs/admin/config for information about the config command. You can use `setup` to walkthrough setting up your server.");
			embed.setColor(config.default_color);
			message.channel.send(embed);
			return;
		}
		client.servers.ensure(message.guild.id, {
			prefix: config.prefix,
			admin_roles: [],
			staff_roles: [],
			channels: {
				suggestions: "",
				staff: "",
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
			}
		});
		switch (args[0]) {
		case "help": {
			let embed = new Discord.RichEmbed()
				.setTitle("Server Configuration Help")
				.setDescription("You will need to configure certain elements before you can use the bot. Setting these tells the bot which roles have permission to use commands and which channels suggestions should be sent in when they are accepted, denied, or pending review.")
				.addField("Channel Configuration", "There are three channel configuraton elements - `suggestions`, `review`, and `denied`. Channel configuration elements take a channel ID or channel #mention as input.\nThe `suggestions` channel is where approved suggestions will be posted.\nThe `review` channel is where suggestions are sent immediately after submission to be reviewed by staff.\nThe `denied` channel is optional and is a log of suggestions that have been denied or deleted.")
				.addField("Role Configuration", "There are two role configuration elements - `admin` and `staff`. Role configuration elements take a role name or role @mention as input.\nAny roles input into the `staff` element will have permission to accept and deny suggestions, as well as interact with them in other ways.\nRoles in the `admin` element inherit `staff` permissions, but also have permission to configure server settings.")
				.addField("Prefix", "The `prefix` element configures the bot prefix for the server. By default, the prefix is `.` but can be changed to any string with no spaces.")
				.addField("Mode", "The `mode` element configures the mode of suggestion handling. Setting this to `review` will put all suggestions through the review process before sending them to the suggestions channel. Setting this to `autoapprove` will automatically send all submitted suggestions to the suggestions feed.\nNote: The `review` element does not need configured for the `autoapprove` mode.")
				.setColor(config.default_color);
			return message.channel.send(embed);
		}
		case "admin":
		case "adminrole": { //Legacy from V1
			if (!args[1]) return superRoles("admin_roles");
			switch (args[1]) {
			case "add":
			case "+": {
				if (!args[2]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
				let role = getRole(args[2]);
				if (!role) return message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${args[2]}\` on this server! Please check that the spelling is correct.`);
				if (client.servers.get(message.guild.id, "admin_roles").includes(role.id)) return message.channel.send(`<:${config.emoji.x}> This role has already been added as an admin role.`);
				client.servers.push(message.guild.id, role.id, "admin_roles");
				return message.channel.send(`<:${config.emoji.check}:> Added **${role.name}** to the list of server admin roles.`);
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				if (!args[2]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
				let role = getRole(args[2]);
				if (!role) return message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${args[2]}\` on this server! Please check that the spelling is correct.`);
				if (!client.servers.get(message.guild.id, "admin_roles").includes(role.id)) return message.channel.send(`<:${config.emoji.x}> The role **${role.name}** is not currently a server admin role.`);
				client.servers.remove(message.guild.id, role.id, "admin_roles");
				return message.channel.send(`<:${config.emoji.check}> Removed **${role.name}** from the list of server admin roles.`);
			}
			case "list": {
				return superRoles("admin_roles");
			}
			default: {
				return message.channel.send("Please specify either `add`, `remove` or `list`.");
			}
			}
			break;
		}
		case "staff":
		case "reviewrole": {//Legacy from V1
			if (!args[1]) {
				return superRoles("staff_roles");
			}
			switch (args[1]) {
			case "add":
			case "+": {
				if (!args[2]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
				let role = getRole(args[2]);
				if (!role) return message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${args[2]}\` on this server! Please check that the spelling is correct.`);
				if (client.servers.get(message.guild.id, "staff_roles").includes(role.id)) return message.channel.send(`<:${config.emoji.x}> This role has already been added as a staff role.`);
				client.servers.push(message.guild.id, role.id, "staff_roles");
				return message.channel.send(`<:${config.emoji.check}:> Added **${role.name}** to the list of server staff roles.`);
			}
			case "remove":
			case "-":
			case "rm":
			case "delete": {
				if (!args[2]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
				let role = getRole(args[2]);
				if (!role) return message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${args[2]}\` on this server! Please check that the spelling is correct.`);
				if (!client.servers.get(message.guild.id, "staff_roles").includes(role.id)) return message.channel.send(`<:${config.emoji.x}> The role **${role.name}** is not currently a server staff role.`);
				client.servers.remove(message.guild.id, role.id, "staff_roles");
				return message.channel.send(`<:${config.emoji.check}> Removed **${role.name}** from the list of server staff roles.`);
			}
			case "list": {
				return superRoles("staff_roles");
			}
			default:
				return message.channel.send("Please specify either `add` or `remove`.");
			}
			break;
		}
		case "review":
		case "reviewchannel": //Legacy from V1
			if (!args[1]) {
				if (!client.servers.get(message.guild.id, "channels.staff")) {
					return message.channel.send("This server has no suggestion review channel set!");
				} else {
					return message.channel.send(`The suggestion review channel is currently configured to <#${client.servers.get(message.guild.id, "channels.staff")}>`);
				}
			}
			var channel;
			if (message.mentions.channels.first()) {
				channel = message.mentions.channels.first();
			} else if (message.guild.channels.get(args[1])) {
				channel = message.guild.channels.get(args[1]);
			} else {
				return message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${inputName}\` on this server! Please check that the ID is correct or #mention a channel.`);
			}
			var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "staff", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
			client.servers.set(message.guild.id, channel.id, "channels.staff");
			return message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the suggestion review channel.`);
		case "suggestions":
		case "suggestionschannel": //Legacy from V1
			if (!args[1]) {
				if (!client.servers.get(message.guild.id, "channels.suggestions")) {
					return message.channel.send("This server has no approved suggestions channel set!");
				} else {
					return message.channel.send(`The approved suggestions channel is currently configured to <#${client.servers.get(message.guild.id, "channels.suggestions")}>`);
				}
			}
			var channel;
			if (message.mentions.channels.first()) {
				channel = message.mentions.channels.first();
			} else if (message.guild.channels.get(args[1])) {
				channel = message.guild.channels.get(args[1]);
			} else {
				return message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${inputName}\` on this server! Please check that the ID is correct or #mention a channel.`);
			}
			var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "suggestions", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
			client.servers.set(message.guild.id, channel.id, "channels.suggestions");
			return message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the approved suggestions channel.`);
			break;
		case "denied":
		case "deniedchannel": //Legacy from V1
			if (!args[1]) {
				if (!client.servers.get(message.guild.id, "channels.denied")) {
					return message.channel.send("This server has no denied suggestions channel set!");
				} else {
					return message.channel.send(`The denied suggestions channel is currently configured to <#${client.servers.get(message.guild.id, "channels.denied")}>`);
				}
			}
			if (args[1].toLowerCase() === "none") {
				client.servers.delete(message.guild.id, "channels.denied");
				return message.channel.send(`<:${config.emoji.check}> Successfully reset the denied suggestions channel.`);
			}
			var channel;
			if (message.mentions.channels.first()) {
				channel = message.mentions.channels.first();
			} else if (message.guild.channels.get(args[1])) {
				channel = message.guild.channels.get(args[1]);
			} else {
				return message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${inputName}\` on this server! Please check that the ID is correct or #mention a channel.`);
			}
			var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "denied", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
			client.servers.set(message.guild.id, channel.id, "channels.denied");
			return message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the denied suggestions channel.`);
			break;
		case "log":
		case "logs":
		case "logchannel": //Legacy from V1
			if (!args[1]) {
				if (!client.servers.get(message.guild.id, "channels.log")) {
					return message.channel.send("This server has no log channel set!");
				} else {
					return message.channel.send(`The log channel is currently configured to <#${client.servers.get(message.guild.id, "channels.log")}>`);
				}
			}
			if (args[1].toLowerCase() === "none") {
				client.servers.delete(message.guild.id, "channels.log");
				return message.channel.send(`<:${config.emoji.check}> Successfully reset the log channel.`);
			}
			var channel;
			if (message.mentions.channels.first()) {
				channel = message.mentions.channels.first();
			} else if (message.guild.channels.get(args[1])) {
				channel = message.guild.channels.get(args[1]);
			} else {
				return message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${inputName}\` on this server! Please check that the ID is correct or #mention a channel.`);
			}
			var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "log", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
			client.servers.set(message.guild.id, channel.id, "channels.log");
			channel.createWebhook("Suggester Logs", client.user.displayAvatarURL, "Create log channel").then(hook => {
				client.servers.set(message.guild.id, [hook.id, hook.token], "loghook");
			});

			return message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the log channel.`);
			break;
		case "prefix":
			if (!args[1]) {
				if (client.servers.get(message.guild.id) && client.servers.get(message.guild.id, "prefix")) {
					return message.channel.send(`The current prefix for this server is **${client.servers.get(message.guild.id, "prefix")}**.`);
				} else {
					return message.channel.send(`The current prefix for this server is **${config.prefix}**.`);
				}
			}
			var prefix = args[1];
			var disallowed = ["suggester:"];
			if (disallowed.includes(prefix.toLowerCase())) return message.channel.send(`<:${config.emoji.x}> This prefix is disallowed`);
			client.servers.set(message.guild.id, prefix, "prefix");
			return message.channel.send(`<:${config.emoji.check}> Successfully set this server's prefix to **${prefix}**`);
			break;
		case "mode":
			if (!args[1]) return message.channel.send(`The current mode for this server is **${client.servers.get(message.guild.id, "mode")}**.`);
			switch (args[1].toLowerCase()) {
			case "review":
				client.servers.set(message.guild.id, "review", "mode");
				return message.channel.send(`<:${config.emoji.check}> Successfully set the mode for this server to **review**.`);
				break;
			case "autoapprove":
			case "auto-approve":
			case "auto_approve":
				if (client.suggestions.filter(s => s.status == "awaiting_review" && s.guild == message.guild.id).array().length > 0) return message.channel.send(`<:${config.emoji.x}> All suggestions awaiting review must be cleared before the autoapprove mode is set.`);
				client.servers.set(message.guild.id, "autoapprove", "mode");
				return message.channel.send(`<:${config.emoji.check}> Successfully set the mode for this server to **autoapprove**.`);
				break;
			case "auto":
				if (args[2] && args[2].toLowerCase() === "approve") {
					client.servers.set(message.guild.id, "autoapprove", "mode");
					return message.channel.send(`<:${config.emoji.check}> Successfully set the mode for this server to **autoapprove**.`);
				} else {
					return message.channel.send("Please specify a valid mode.");
				}
				break;
			default:
				return message.channel.send("Please specify a valid mode.");
			}
			break;
		case "emoji":
		case "emotes":
		case "emojis":
		case "emote":
			var emoji = require("node-emoji");
			if (!args[1]) {
				let reactEmbed = new Discord.RichEmbed();
				if (client.servers.get(message.guild.id, "emojis.up")) {
					var upEmoji;
					if (emoji.find(client.servers.get(message.guild.id, "emojis.up"))) {
						upEmoji = client.servers.get(message.guild.id, "emojis.up");
					} else if (client.servers.get(message.guild.id, "emojis.up").startsWith("a")) {
						upEmoji = `<${client.servers.get(message.guild.id, "emojis.up")}>`;
					} else {
						upEmoji = `<:${client.servers.get(message.guild.id, "emojis.up")}>`;
					}
					reactEmbed.addField("Upvote", upEmoji);
				} else {
					reactEmbed.addField("Upvote", config.initial.reactions.upvote);
				}
				if (client.servers.get(message.guild.id, "emojis.mid")) {
					var midEmoji;
					if (emoji.find(client.servers.get(message.guild.id, "emojis.mid"))) {
						midEmoji = client.servers.get(message.guild.id, "emojis.mid");
					} else if (client.servers.get(message.guild.id, "emojis.mid").startsWith("a")) {
						midEmoji = `<${client.servers.get(message.guild.id, "emojis.mid")}>`;
					} else {
						midEmoji = `<:${client.servers.get(message.guild.id, "emojis.mid")}>`;
					}
					reactEmbed.addField("Shrug/No Opinion", midEmoji);
				} else {
					reactEmbed.addField("Shrug/No Opinion", config.initial.reactions.shrug);
				}
				if (client.servers.get(message.guild.id, "emojis.down")) {
					var downEmoji;
					if (emoji.find(client.servers.get(message.guild.id, "emojis.down"))) {
						downEmoji = client.servers.get(message.guild.id, "emojis.down");
					} else if (client.servers.get(message.guild.id, "emojis.down").startsWith("a")) {
						downEmoji = `<${client.servers.get(message.guild.id, "emojis.down")}>`;
					} else {
						downEmoji = `<:${client.servers.get(message.guild.id, "emojis.down")}>`;
					}
					reactEmbed.addField("Downvote", downEmoji);
				} else {
					reactEmbed.addField("Downvote", config.initial.reactions.downvote);
				}
				reactEmbed.setColor(config.default_color);
				return message.channel.send("Current server emoji settings:", reactEmbed);
			}

			switch (args[1].toLowerCase()) {
			case "up":
			case "upvote":
			case "yes":
				if (!args[2]) return message.channel.send(`<:${config.emoji.x}> You must specify an emoji.`);
				var inputEmoji;
				if (emoji.find(args[2])) {
					inputEmoji = emoji.find(args[2]).emoji;
				} else {
					var split1 = args[2].split(":");
					var id = split1[split1.length - 1].split(">")[0];
					if (message.guild.emojis.get(id)) {
						if (args[2].startsWith("<a")) {
							inputEmoji = `a:${message.guild.emojis.get(id).name}:${message.guild.emojis.get(id).id}`;
						} else {
							inputEmoji = `${message.guild.emojis.get(id).name}:${message.guild.emojis.get(id).id}`;
						}
					} else {
						return message.channel.send(`<:${config.emoji.x}> The emoji \`${args[2]}\` was not found.`);
					}
				}
				if (!client.servers.get(message.guild.id, "emojis")) {
					client.servers.get(message.guild.id, "emojis", {
						up: "👍",
						mid: "🤷",
						down: "👎"
					});
				}
				client.servers.set(message.guild.id, inputEmoji, "emojis.up");
				if (emoji.find(client.servers.get(message.guild.id, "emojis.up"))) {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the upvote emoji for this server to ${client.servers.get(message.guild.id, "emojis.up")}.`);
				} else if (client.servers.get(message.guild.id, "emojis.up").startsWith("a")) {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the upvote emoji for this server to <${client.servers.get(message.guild.id, "emojis.up")}>.`);
				} else {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the upvote emoji for this server to <:${client.servers.get(message.guild.id, "emojis.up")}>.`);
				}
				break;
			case "shrug":
			case "neutral":
			case "middle":
			case "mid":
				if (!args[2]) return message.channel.send(`<:${config.emoji.x}> You must specify an emoji.`);
				var inputEmoji;
				if (emoji.find(args[2])) {
					inputEmoji = emoji.find(args[2]).emoji;
				} else {
					var split1 = args[2].split(":");
					var id = split1[split1.length - 1].split(">")[0];
					if (message.guild.emojis.get(id)) {
						if (args[2].startsWith("<a")) {
							inputEmoji = `a:${message.guild.emojis.get(id).name}:${message.guild.emojis.get(id).id}`;
						} else {
							inputEmoji = `${message.guild.emojis.get(id).name}:${message.guild.emojis.get(id).id}`;
						}
					} else {
						return message.channel.send(`<:${config.emoji.x}> The emoji \`${args[2]}\` was not found.`);
					}
				}
				if (!client.servers.get(message.guild.id, "emojis")) {
					client.servers.get(message.guild.id, "emojis", {
						up: "👍",
						mid: "🤷",
						down: "👎"
					});
				}
				client.servers.set(message.guild.id, inputEmoji, "emojis.mid");
				if (emoji.find(client.servers.get(message.guild.id, "emojis.mid"))) {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the shrug/no opinion emoji for this server to ${client.servers.get(message.guild.id, "emojis.mid")}.`);
				} else if (client.servers.get(message.guild.id, "emojis.mid").startsWith("a")) {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the shrug/no opinion emoji for this server to <${client.servers.get(message.guild.id, "emojis.mid")}>.`);
				} else {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the shrug/no opinion emoji for this server to <:${client.servers.get(message.guild.id, "emojis.mid")}>.`);
				}
				break;
			case "down":
			case "downvote":
			case "no":
				if (!args[2]) return message.channel.send(`<:${config.emoji.x}> You must specify an emoji.`);
				var inputEmoji;
				if (emoji.find(args[2])) {
					inputEmoji = emoji.find(args[2]).emoji;
				} else {
					var split1 = args[2].split(":");
					var id = split1[split1.length - 1].split(">")[0];
					if (message.guild.emojis.get(id)) {
						if (args[2].startsWith("<a")) {
							inputEmoji = `a:${message.guild.emojis.get(id).name}:${message.guild.emojis.get(id).id}`;
						} else {
							inputEmoji = `${message.guild.emojis.get(id).name}:${message.guild.emojis.get(id).id}`;
						}
					} else {
						return message.channel.send(`<:${config.emoji.x}> The emoji \`${args[2]}\` was not found.`);
					}
				}
				if (!client.servers.get(message.guild.id, "emojis")) {
					client.servers.get(message.guild.id, "emojis", {
						up: "👍",
						mid: "🤷",
						down: "👎"
					});
				}
				client.servers.set(message.guild.id, inputEmoji, "emojis.down");
				if (emoji.find(client.servers.get(message.guild.id, "emojis.down"))) {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the downvote emoji for this server to ${client.servers.get(message.guild.id, "emojis.down")}.`);
				} else if (client.servers.get(message.guild.id, "emojis.down").startsWith("a")) {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the downvote opinion emoji for this server to <${client.servers.get(message.guild.id, "emojis.down")}>.`);
				} else {
					return message.channel.send(`<:${config.emoji.check}> Successfully set the downvote emoji for this server to <:${client.servers.get(message.guild.id, "emojis.down")}>.`);
				}
				break;
			case "toggle":
				if (!client.servers.get(message.guild.id, "react") || client.servers.get(message.guild.id, "react") == false) {
					client.servers.set(message.guild.id, true, "react");
					return message.channel.send(`<:${config.emoji.check}> Enabled suggestion feed reactions.`);
				} else {
					client.servers.set(message.guild.id, false, "react");
					return message.channel.send(`<:${config.emoji.check}> Disabled suggestion feed reactions.`);
				}
				break;
			default:
				return message.channel.send("Please specify a valid emoji setting.");
			}
			break;
		case "notify":
			if (!args[1]) {
				if (!client.servers.get(message.guild.id, "notify") || client.servers.get(message.guild.id, "notify") == false) {
					return message.channel.send("DM notifications on suggestion changes are currently **disabled**.");
				} else {
					return message.channel.send("DM notifications on suggestion changes are currently **enabled**.");
				}
			}
			switch (args[1].toLowerCase()) {
			case "enable":
				if (!client.servers.get(message.guild.id, "notify") || client.servers.get(message.guild.id, "notify") == false) {
					client.servers.set(message.guild.id, true, "notify");
					return message.channel.send(`<:${config.emoji.check}> Enabled user notifications.`);
				} else {
					return message.channel.send(`<:${config.emoji.x}> User notifications are already enabled!`);
				}
				break;
			case "disable":
				if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") == true) {
					client.servers.set(message.guild.id, false, "notify");
					return message.channel.send(`<:${config.emoji.check}> Disabled user notifications.`);
				} else {
					return message.channel.send(`<:${config.emoji.x}> User notifications are already disabled!`);
				}
				break;
			case "toggle":
				if (!client.servers.get(message.guild.id, "notify") || client.servers.get(message.guild.id, "notify") == false) {
					client.servers.set(message.guild.id, true, "notify");
					return message.channel.send(`<:${config.emoji.check}> Enabled user notifications.`);
				} else {
					client.servers.set(message.guild.id, false, "notify");
					return message.channel.send(`<:${config.emoji.check}> Disabled user notifications.`);
				}
				break;
			}
		case "list":

			var cfgArr = [];
			var issuesAlert = 0;
			var issuesFine = 0;
			// Admin roles
			if (!client.servers.get(message.guild.id, "admin_roles") || client.servers.get(message.guild.id, "admin_roles").length < 1) {
				cfgArr.push(`<:${config.emoji.x}> **Admin Roles:** None Configured`);
				issuesAlert++;
			} else {
				var adminRoleList = [];
				var configRoles = client.servers.get(message.guild.id, "admin_roles");
				configRoles.forEach(id => {
					if (message.guild.roles.get(id)) {
						//Push to the list
						adminRoleList.push(`${message.guild.roles.get(id).name} (ID: \`${id}\`)`);
					} else {
						// Fix role list and delete the old no longer found role
						var index = client.servers.get(message.guild.id, "admin_roles").findIndex(r => r == id);
						client.servers.set(message.guild.id, client.servers.get(message.guild.id, "admin_roles").splice(index, 1), "admin_roles");
					}
				});
				if (adminRoleList.length < 1) {
					cfgArr.push(`<:${config.emoji.x}> **Admin Roles:** None Configured`);
					issuesAlert++;
				} else {
					cfgArr.push(`<:${config.emoji.check}> **Admin Roles:** ${adminRoleList.join(", ")}`);
				}
			}
			// Staff roles
			if (!client.servers.get(message.guild.id, "staff_roles") || client.servers.get(message.guild.id, "staff_roles").length < 1) {
				cfgArr.push(`<:${config.emoji.x}> **Staff Roles:** None Configured`);
				issuesAlert++;
			} else {
				var staffRoleList = [];
				var configRoles = client.servers.get(message.guild.id, "staff_roles");
				configRoles.forEach(id => {
					if (message.guild.roles.get(id)) {
						//Push to the list
						staffRoleList.push(`${message.guild.roles.get(id).name} (ID: \`${id}\`)`);
					} else {
						// Fix role list and delete the old no longer found role
						var index = client.servers.get(message.guild.id, "staff_roles").findIndex(r => r == id);
						client.servers.set(message.guild.id, client.servers.get(message.guild.id, "staff_roles").splice(index, 1), "staff_roles");
					}
				});
				if (staffRoleList.length < 1) {
					cfgArr.push(`<:${config.emoji.x}> **Staff Roles:** None Configured`);
					issuesAlert++;
				} else {
					cfgArr.push(`<:${config.emoji.check}> **Staff Roles:** ${staffRoleList.join(", ")}`);
				}
			}
			// Staff review channel
			if (!client.servers.get(message.guild.id, "channels.staff")) {
				cfgArr.push(`<:${config.emoji.x}> **Suggestion Review Channel:** None Configured`);
				if (client.servers.get(message.guild.id, "mode") === "review") {
					issuesAlert++;
				} else {
					issuesFine++;
				}
			} else {
				var channel = client.channels.get(client.servers.get(message.guild.id, "channels.staff"));
				if (!channel) {
					client.servers.delete(message.guild.id, "channels.staff");
					cfgArr.push(`<:${config.emoji.x}> **Suggestion Review Channel:** None Configured`);
					if (client.servers.get(message.guild.id, "mode") === "review") {
						issuesAlert++;
					} else {
						issuesFine++;
					}
				} else {
					cfgArr.push(`<:${config.emoji.check}> **Suggestion Review Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Suggestions channel
			if (!client.servers.get(message.guild.id, "channels.suggestions")) {
				cfgArr.push(`<:${config.emoji.x}> **Approved Suggestions Channel:** None Configured`);
				issuesAlert++;
			} else {
				var channel = client.channels.get(client.servers.get(message.guild.id, "channels.suggestions"));
				if (!channel) {
					client.servers.delete(message.guild.id, "channels.suggestions");
					cfgArr.push(`<:${config.emoji.x}> **Approved Suggestions Channel:** None Configured`);
					issuesAlert++;
				} else {
					cfgArr.push(`<:${config.emoji.check}> **Approved Suggestions Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Denied channel
			if (!client.servers.get(message.guild.id, "channels.denied")) {
				cfgArr.push(`<:${config.emoji.x}> **Denied Suggestions Channel:** None Configured`);
				issuesFine++;
			} else {
				var channel = client.channels.get(client.servers.get(message.guild.id, "channels.denied"));
				if (!channel) {
					client.servers.delete(message.guild.id, "channels.denied");
					cfgArr.push(`<:${config.emoji.x}> **Denied Suggestions Channel:** None Configured`);
					issuesFine++;
				} else {
					cfgArr.push(`<:${config.emoji.check}> **Denied Suggestions Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Log channel
			if (!client.servers.get(message.guild.id, "channels.log")) {
				cfgArr.push(`<:${config.emoji.x}> **Log Channel:** None Configured`);
				issuesFine++;
			} else {
				var channel = client.channels.get(client.servers.get(message.guild.id, "channels.log"));
				if (!channel) {
					client.servers.delete(message.guild.id, "channels.log");
					cfgArr.push(`<:${config.emoji.x}> **Log Channel:** None Configured`);
					issuesFine++;
				} else {
					cfgArr.push(`<:${config.emoji.check}> **Log Channel:** <#${channel.id}> (${channel.id})`);
				}
			}
			// Emojis
			var emoji = require("node-emoji");
			var upEmoji;
			var midEmoji;
			var downEmoji;
			if (client.servers.get(message.guild.id, "emojis.up")) {
				if (emoji.find(client.servers.get(message.guild.id, "emojis.up"))) {
					upEmoji = client.servers.get(message.guild.id, "emojis.up");
				} else if (client.servers.get(message.guild.id, "emojis.up").startsWith("a")) {
					upEmoji = `<${client.servers.get(message.guild.id, "emojis.up")}>`;
				} else {
					upEmoji = `<:${client.servers.get(message.guild.id, "emojis.up")}>`;
				}
			} else {
				upEmoji = config.initial.reactions.upvote;
			}
			if (client.servers.get(message.guild.id, "emojis.mid")) {
				if (emoji.find(client.servers.get(message.guild.id, "emojis.mid"))) {
					midEmoji = client.servers.get(message.guild.id, "emojis.mid");
				} else if (client.servers.get(message.guild.id, "emojis.mid").startsWith("a")) {
					midEmoji = `<${client.servers.get(message.guild.id, "emojis.mid")}>`;
				} else {
					midEmoji = `<:${client.servers.get(message.guild.id, "emojis.mid")}>`;
				}
			} else {
				midEmoji = config.initial.reactions.shrug;
			}
			if (client.servers.get(message.guild.id, "emojis.down")) {
				if (emoji.find(client.servers.get(message.guild.id, "emojis.down"))) {
					downEmoji = client.servers.get(message.guild.id, "emojis.down");
				} else if (client.servers.get(message.guild.id, "emojis.down").startsWith("a")) {
					downEmoji = `<${client.servers.get(message.guild.id, "emojis.down")}>`;
				} else {
					downEmoji = `<:${client.servers.get(message.guild.id, "emojis.down")}>`;
				}
			} else {
				downEmoji = config.initial.reactions.downvote;
			}

			cfgArr.push(`<:${config.emoji.check}> **Reaction Emojis:** ${upEmoji}, ${midEmoji}, ${downEmoji}`);
			if (!client.servers.get(message.guild.id, "react")) client.servers.get(message.guild.id, true, "react");
			if (client.servers.get(message.guild.id, "react") && client.servers.get(message.guild.id, "react") == true) {
				cfgArr.push(`<:${config.emoji.check}> **Suggestion Feed Reactions:** Enabled`);
			} else if (!client.servers.get(message.guild.id, "react") || client.servers.get(message.guild.id, "react") == false) cfgArr.push(`<:${config.emoji.check}> **Suggestion Feed Reactions:** Enabled`);
			// Mode
			switch (client.servers.get(message.guild.id, "mode")) {
			case "review":
				cfgArr.push(`<:${config.emoji.check}> **Mode:** All suggestions are held for review`);
				break;
			case "autoapprove":
				cfgArr.push(`<:${config.emoji.check}> **Mode:** All suggestions are automatically approved`);
				break;
			default:
				cfgArr.push(`<:${config.emoji.x}> **Mode:** Broken mode configuration, please reconfigure the mode.`);
				issuesAlert++;
			}
			// Prefix
			cfgArr.push(`<:${config.emoji.check}> **Prefix:** ${client.servers.get(message.guild.id, "prefix")}`);
			// Notify
			if (!client.servers.get(message.guild.id, "notify")) client.servers.set(message.guild.id, true, "notify");
			if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") == true) {
				cfgArr.push(`<:${config.emoji.check}> **Notifications:** All suggestion actions DM the suggesting user`);
			} else if (!client.servers.get(message.guild.id, "notify") || client.servers.get(message.guild.id, "notify") == false) cfgArr.push(`<:${config.emoji.check}> **Notifications:** Suggestion actions do not DM the suggesting user`);

			let cfgEmbed = new Discord.RichEmbed()
				.setTitle(`Server Configuration for ${message.guild.name}`)
				.setDescription(cfgArr.join("\n"));
			if (issuesAlert > 0) {
				cfgEmbed.setColor("#e74c3c")
					.addField("Config Status", `<:${config.emoji.x}> Not Fully Configured, Bot Will Not Work`);
			} else if (issuesFine > 0) {
				cfgEmbed.setColor("#e67e22")
					.addField("Config Status", ":shrug: Not Fully Configured, Bot Will Still Work");
			} else {
				cfgEmbed.setColor("#2ecc71")
					.addField("Config Status", `<:${config.emoji.check}> Fully Configured`);
			}
			return message.channel.send(cfgEmbed);
		default:
			return message.channel.send(`<:${config.emoji.x}> Invalid configuration element specified. Please run this command with no parameters to view configuration instructions.`);
		}

	}
};
