const { emoji, support_invite } = require("../../config.json");
const { dbQueryNoNew, dbQuery, dbModify } = require("../../utils/db");
const { findRole, handleChannelInput, findEmoji, handleRoleInput, findChannel } = require("../../utils/config");
const { checkPermissions, channelPermissions } = require("../../utils/checks");
const { confirmation, pages } = require("../../utils/actions");
const nodeEmoji = require("node-emoji");
const { string, list } = require("../../utils/strings");
const colorstring = require("color-string");
module.exports = {
	controls: {
		name: "config",
		permission: 2,
		aliases: ["serverconfig", "cfg", "configure"],
		usage: "config (element) (additional parameters)",
		description: "Shows/edits server configuration",
		image: "images/Config.gif",
		enabled: true,
		examples: "Use `{{p}}config help` to view detailed instructions",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
		cooldown: 5
	},
	do: async (locale, message, client, args, Discord) => {
		let server;
		let permission = await checkPermissions(message.member, client);
		if (!args[0] || permission > 1) server = message.guild;
		else if (args[0].match(/\d+/)) {
			try {
				let foundApi = await client.api.guilds(args[0]).get();
				if (foundApi) server = foundApi;
				server.roles.cache = server.roles;
				server.emojis.cache = server.emojis;
				server.channels = {};
				server.channels.cache = await client.api.guilds(args[0]).channels.get();
				server.channels.cache.get = function(toGet) {
					return this.find(i => i.id === toGet);
				};
				server.roles.cache.get = function(toGet) {
					return this.find(i => i.id === toGet);
				};
				server.iconURL = function(params) {
					return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${this.icon.startsWith("a_") && params.dynamic ? "gif" : (params.format || "png")}`;
				};
				args = args.splice(1);
				// eslint-disable-next-line no-empty
			} catch (e) {}
		}
		if (!server) server = message.guild;
		let qServerDB = await dbQuery("Server", {id: server.id});

		async function listRoles (roleList, server, title, fatal, append) {
			if (!roleList) return `**${string(locale, title, {}, fatal ? "error" : "success")}:** ${string(locale, "NONE_CONFIGURED")}`;
			if (typeof roleList === "string") {
				let role;
				if (server.roles.cache.get(roleList)) role = `**${string(locale, title, {}, "success")}:** ${server.roles.cache.get(roleList).name} (ID: \`${roleList}\`)`;
				else if (roleList) {
					roleList = "";
					await dbModify("Server", {id: server.id}, qServerDB);
				}
				return !role ? `**${string(locale, title, {}, fatal ? "error" : "success")}:** ${string(locale, "NONE_CONFIGURED")}` : role;
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
				if (roles.length < 1) return [`**${string(locale, title, {}, fatal ? "error" : "success")}:** ${string(locale, "NONE_CONFIGURED")} ${append ? append : ""}`, fatal ? true : null];
				else return [`**${string(locale, title, {}, "success")}:**\n> ${roles.join("\n> ")}`];
			}
		}

		async function showChannel (channel, server, title, fatal, append) {
			let foundChannel = server.channels.cache.get(channel);
			if (!foundChannel || !["text", 0].includes(foundChannel.type)) {
				return [`**${string(locale, title, {}, "error")}:** ${string(locale, "NONE_CONFIGURED")} ${append ? append : ""}`, true];
			}
			return [`**${string(locale, title, {}, "success")}:** <#${foundChannel.id}> (\`${foundChannel.id}\`)`];
		}

		async function showCommandsChannels (channels, oldChannel, server, title, fatal, append) {
			let channelsToTest = channels;
			if (oldChannel) channelsToTest.push(oldChannel);
			let foundChannels = [];
			for await (let c of channelsToTest) {
				let foundChannel = server.channels.cache.get(c);
				if (foundChannel && ["text", 0].includes(foundChannel.type)) foundChannels.push(foundChannel);
			}
			return foundChannels.length > 0 ? [`**${string(locale, title, {}, "success")}:** ${foundChannels.map(c => `<#${c.id}> (\`${c.id}\`)`).join(", ")}`] : [`**${string(locale, title, {}, "error")}:** ${string(locale, "NONE_CONFIGURED")} ${append ? append : ""}`, true];
		}

		function checkEmoji(emoji) {
			if (emoji === "none") return string(locale, "DISABLED");
			else if (nodeEmoji.find(emoji)) return emoji;
			else if (emoji.startsWith("a")) return `<${emoji}>`;
			else return `<:${emoji}>`;
		}

		async function handleEmojiInput (input, server, current_name, disabled_str, success_str) {
			if (!input) return string(locale, "CFG_NO_EMOJI_ERROR", {}, "error");
			if (["none", "off", "disable"].includes(input.toLowerCase())) {
				if (qServerDB.config.emojis[current_name] === "none") return string(locale, "CFG_EMOJI_DISABLED_ERROR", {}, "error");
				qServerDB.config.emojis[current_name] = "none";
				await dbModify("Server", {id: server.id}, qServerDB);
				return string(locale, disabled_str, {}, "success");
			}
			let emote = await findEmoji(input, server.emojis.cache);
			if (emote[0]) {
				if (Object.values(qServerDB.config.emojis).includes(emote[0])) return string(locale, "CFG_EMOJI_ALREADY_SET_ERROR", {}, "error");
				qServerDB.config.emojis[current_name] = emote[0];
				await dbModify("Server", {id: server.id}, qServerDB);
				return string(locale, success_str, { emote: emote[1] }, "success");
			} else return string(locale, "CFG_EMOJI_NOT_FOUND_ERROR", {}, "error");
		}

		async function handleCommandsChannelInput (locale, input, server, current_name, check_perms, done_str, action) {
			if (!input) return string(locale, "CFG_NO_CHANNEL_SPECIFIED_ERROR", {}, "error");
			let qServerDB = await server.db;

			let channel = await findChannel(input, server.channels.cache);
			if (!channel || channel.type !== "text") return string(locale, "CFG_INVALID_CHANNEL_ERROR", {}, "error");
			let permissions = await channelPermissions(locale, check_perms, channel, server.client);
			if (permissions) return permissions;

			if (qServerDB.config.channels.commands) {
				qServerDB.config.channels.commands_new.push(qServerDB.config.channels.commands);
				qServerDB.config.channels.commands = "";
			}
			switch (action) {
			case "add":
				if (qServerDB.config.channels.commands_new.includes(channel.id)) return string(locale, "CFG_COMMANDS_ALREADY_ADDED_ERROR", {}, "error");
				qServerDB.config.channels.commands_new.push(channel.id);
				break;
			case "remove":
				if (!qServerDB.config.channels.commands_new.includes(channel.id)) return string(locale, "CFG_COMMANDS_NOT_ADDED_ERROR", {}, "error");
				qServerDB.config.channels.commands_new.splice(qServerDB.config.channels.commands_new.findIndex(c => c.toString() === channel.id), 1);
				break;
			}

			await dbModify("Server", {id: server.id}, qServerDB);
			return string(locale, done_str, { channel: `<#${channel.id}>` }, "success");
		}

		let elements = [{
			names: ["admin", "adminrole", "adminroles"],
			name: "Admin Roles",
			description: "Roles that are allowed to edit server configuration, as well as use all staff commands. (Members with the **Manage Server** permission also have access to these commands)",
			examples: "`{{p}}config admin add Owner`\nAdds the \"Owner\" role as an admin role\n\n`{{p}}config admin add @Management`\nAdds the mentioned \"Management\" role as an admin role\n\n`{{p}}config admin add 658753146910408724`\nAdds a role with ID 658753146910408724 as an admin role\n\n`{{p}}config admin remove Owner`\nRemoves the \"Owner\" role from the list of admin roles",
			cfg: async function() {

				switch (args[1]) {
				case "add":
				case "+": {
					let origRole = args.splice(2).join(" ");
					let output = await handleRoleInput(locale, "add", origRole, server.roles.cache, "admin_roles", "CFG_ALREADY_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_ADD_SUCCESS");
					if (output === "CONFIRM") {
						if ((
							await confirmation(
								message,
								string(locale, "EVERYONE_PERMISSION_WARNING", { check: `<:${emoji.check}>`, x: `<:${emoji.x}>`}),
								{
									deleteAfterReaction: true
								}
							)
						)) return message.channel.send((await handleRoleInput(locale, "add", origRole, server.roles.cache, "admin_roles", "CFG_ALREADY_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_ADD_SUCCESS", null, true)), { disableMentions: "everyone" });
						else return message.channel.send(string(locale, "CANCELLED", {}, "error"));
					} else return message.channel.send(output, { disableMentions: "everyone" });
				}
				case "remove":
				case "-":
				case "rm":
				case "delete": {
					return message.channel.send((await handleRoleInput(locale, "remove", args.splice(2).join(" "), server.roles.cache, "admin_roles", "CFG_NOT_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_REMOVE_SUCCESS")), { disableMentions: "everyone" });
				}
				case "list": {
					return message.channel.send((await listRoles(qServerDB.config.admin_roles, server, "CONFIG_NAME:ADMIN", true))[0]);
				}
				default: {
					if (args[1]) return message.channel.send(string(locale, "CFG_INVALID_ROLE_PARAM_ERROR"));
					else return message.channel.send((await listRoles(qServerDB.config.admin_roles, server, "CONFIG_NAME:ADMIN", true))[0]);
				}
				}
			}
		},
		{
			names: ["staff", "staffrole", "staffroles", "reviewrole"],
			name: "Staff Roles",
			description: "Roles that have access to suggestion management commands like `approve`, `deny`, `comment`, and `mark`.",
			examples: "`{{p}}config staff add Staff`\nAdds the \"Staff\" role as a staff role\n\n`{{p}}config staff add @Moderator`\nAdds the mentioned \"Moderator\" role as a staff role\n\n`{{p}}config staff add 658753146910408724`\nAdds a role with ID 658753146910408724 as a staff role\n\n`{{p}}config staff remove Moderator`\nRemoves the \"Moderator\" role from the list of staff roles",
			cfg: async function() {
				switch (args[1]) {
				case "add":
				case "+": {
					let origRole = args.splice(2).join(" ");
					let output = await handleRoleInput(locale, "add", origRole, server.roles.cache, "staff_roles", "CFG_ALREADY_STAFF_ROLE_ERROR", "CFG_STAFF_ROLE_ADD_SUCCESS");
					if (output === "CONFIRM") {
						if ((
							await confirmation(
								message,
								string(locale, "EVERYONE_PERMISSION_WARNING", {
									check: `<:${emoji.check}>`,
									x: `<:${emoji.x}>`
								}),
								{
									deleteAfterReaction: true
								}
							)
						)) return message.channel.send((await handleRoleInput(locale, "add", origRole, server.roles.cache, "staff_roles", "CFG_ALREADY_STAFF_ROLE_ERROR", "CFG_STAFF_ROLE_ADD_SUCCESS", null, true)), {disableMentions: "everyone"});
						else return message.channel.send(string(locale, "CANCELLED", {}, "error"));
					} else return message.channel.send(output, {disableMentions: "everyone"});
				}
				case "remove":
				case "-":
				case "rm":
				case "delete": {
					return message.channel.send((await handleRoleInput(locale, "remove", args.splice(2).join(" "), server.roles.cache, "staff_roles", "CFG_NOT_STAFF_ROLE_ERROR", "CFG_STAFF_ROLE_REMOVE_SUCCESS")), {disableMentions: "everyone"});
				}
				case "list": {
					return message.channel.send((await listRoles(qServerDB.config.staff_roles, server, "CONFIG_NAME:STAFF", true))[0]);
				}
				default: {
					if (args[1]) return message.channel.send(string(locale, "CFG_INVALID_ROLE_PARAM_ERROR"));
					else return message.channel.send((await listRoles(qServerDB.config.staff_roles, server, "CONFIG_NAME:STAFF", true))[0]);
				}
				}
			}
		},
		{
			names: ["allowed", "allowedrole", "suggestrole"],
			name: "Allowed Suggesting Roles",
			description: "Roles that are allowed to submit suggestions. If no roles are configured, all users can submit suggestions.",
			examples: "`{{p}}config allowed add Trusted`\nAdds the \"Trusted\" role to the list of allowed roles\n\n`{{p}}config allowed add @Cool Person`\nAdds the mentioned \"Cool Person\" role as an allowed role\n\n`{{p}}config allowed add 658753146910408724`\nAdds a role with ID 658753146910408724 to the list of allowed roles\n\n`{{p}}config allowed remove Trusted`\nRemoves the \"Trusted\" role from the list of allowed roles",
			cfg: async function() {
				switch (args[1]) {
				case "add":
				case "+": {
					return message.channel.send((await handleRoleInput(locale, "add", args.splice(2).join(" "), server.roles.cache, "allowed_roles", "CFG_ALREADY_ALLOWED_ROLE_ERROR", "CFG_ALLOWED_ROLE_ADD_SUCCESS")), { disableMentions: "everyone" });
				}
				case "remove":
				case "-":
				case "rm":
				case "delete": {
					return message.channel.send((await handleRoleInput(locale, "remove", args.splice(2).join(" "), server.roles.cache, "allowed_roles", "CFG_NOT_ALLOWED_ROLE_ERROR", "CFG_ALLOWED_ROLE_REMOVE_SUCCESS", "CFG_ALLOWED_ROLES_APPEND_NOW")), { disableMentions: "everyone" });
				}
				case "list": {
					return message.channel.send((await listRoles(qServerDB.config.allowed_roles, server, "CONFIG_NAME:ALLOWED", true))[0]);
				}
				default: {
					if (args[1]) return message.channel.send(string(locale, "CFG_INVALID_ROLE_PARAM_ERROR"));
					else return message.channel.send((await listRoles(qServerDB.config.allowed_roles, server, "CONFIG_NAME:ALLOWED", true))[0]);
				}
				}
			}
		},
		{
			names: ["voting", "voterole", "voteroles", "votingroles", "votingrole"],
			name: "Voting Roles",
			description: "Roles that are allowed to vote on suggestions in the approved suggestion feed. If no roles are configured, all users can vote on suggestions.",
			examples: "`{{p}}config voting add Trusted`\nAdds the \"Trusted\" role to the list of allowed voting roles\n\n`{{p}}config voting add @Cool Person`\nAdds the mentioned \"Cool Person\" role as an allowed voting role\n\n`{{p}}config voting add 658753146910408724`\nAdds a role with ID 658753146910408724 to the list of allowed voting roles\n\n`{{p}}config voting remove Trusted`\nRemoves the \"Trusted\" role from the list of allowed voting roles",
			cfg: async function() {
				switch (args[1]) {
				case "add":
				case "+": {
					return message.channel.send((await handleRoleInput(locale, "add", args.splice(2).join(" "), server.roles.cache, "voting_roles", "CFG_ALREADY_VOTING_ROLE_ERROR", "CFG_VOTING_ROLE_ADD_SUCCESS")), { disableMentions: "everyone" });
				}
				case "remove":
				case "-":
				case "rm":
				case "delete": {
					return message.channel.send((await handleRoleInput(locale, "remove", args.splice(2).join(" "), server.roles.cache, "voting_roles", "CFG_NOT_VOTING_ROLE_ERROR", "CFG_VOTING_ROLE_REMOVE_SUCCESS", "CFG_VOTING_ROLES_APPEND_NOW")), { disableMentions: "everyone" });
				}
				case "list": {
					return message.channel.send((await listRoles(qServerDB.config.voting_roles, server, "CONFIG_NAME:VOTING", true, string(locale, "CFG_VOTING_ROLES_APPEND")))[0]);
				}
				default: {
					if (args[1]) return message.channel.send(string(locale, "CFG_INVALID_ROLE_PARAM_ERROR"));
					else return message.channel.send((await listRoles(qServerDB.config.voting_roles, server, "CONFIG_NAME:VOTING", true, string(locale, "CFG_VOTING_ROLES_APPEND")))[0]);
				}
				}
			}
		},
		{
			names: ["blocked", "blockedroles", "blockrole"],
			name: "Blocked Roles",
			description: "Roles that are blocked from using the bot on this server. If you want to block one specific user, use the `block` command.",
			examples: "`{{p}}config blocked add Restricted`\nAdds the \"Restricted\" role to the list of blocked roles\n\n`{{p}}config blocked add @Bad Person`\nAdds the mentioned \"Bad Person\" role as a blocked role\n\n`{{p}}config blocked add 658753146910408724`\nAdds a role with ID 658753146910408724 to the list of blocked roles\n\n`{{p}}config blocked remove Annoying`\nRemoves the \"Annoying\" role from the list of blocked roles, allowing members with that role to use the bot again",
			cfg: async function() {
				switch (args[1]) {
				case "add":
				case "+": {
					return message.channel.send((await handleRoleInput(locale, "add", args.splice(2).join(" "), server.roles.cache, "blocked_roles", "CFG_ALREADY_BLOCKED_ROLE_ERROR", "CFG_BLOCKED_ROLE_ADD_SUCCESS")), { disableMentions: "everyone" });
				}
				case "remove":
				case "-":
				case "rm":
				case "delete": {
					return message.channel.send((await handleRoleInput(locale, "remove", args.splice(2).join(" "), server.roles.cache, "blocked_roles", "CFG_NOT_BLOCKED_ROLE_ERROR", "CFG_BLOCK_ROLE_REMOVE_SUCCESS")), { disableMentions: "everyone" });
				}
				case "list": {
					return message.channel.send((await listRoles(qServerDB.config.blocked_roles, server, "CONFIG_NAME:BLOCKED", false))[0]);
				}
				default: {
					if (args[1]) return message.channel.send(string(locale, "CFG_INVALID_ROLE_PARAM_ERROR"));
					else return message.channel.send((await listRoles(qServerDB.config.blocked_roles, server, "CONFIG_NAME:BLOCKED", false))[0]);
				}
				}
			}
		},
		{
			names: ["approverole", "approvedrole"],
			name: "Approved Suggestion Role",
			description: "The role that is given to members that have a suggestion approved.",
			examples: "`{{p}}config approverole Suggestion Submitter`\nSets the \"Suggestion Submitter\" as the role given when a member has their suggestion approved\n\n`{{p}}config approverole none`\nResets the role given when a member has their suggestion approved, meaning no role will be given",
			cfg: async function() {
				if (!args[1]) return message.channel.send((await listRoles(qServerDB.config.approved_role, server, "CONFIG_NAME:APPROVEROLE", false)));
				let input = args.splice(1).join(" ");
				if (input.toLowerCase() === "none" || input.toLowerCase() === "reset") {
					qServerDB.config.approved_role = "";
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, "CFG_RESET_APPROVED_ROLE_SUCCESS", {}, "success"));
				}
				if (!server.me.permissions.has("MANAGE_ROLES")) return message.channel.send(string(locale, "CFG_NO_MANAGE_ROLES_ERROR", { bot: `<@${client.user.id}>` }, "error"));
				let role = await findRole(input, server.roles.cache);
				if (!role) return message.channel.send(string(locale, "CFG_INVALID_ROLE_ERROR", {}, "error"));
				if (qServerDB.config.approved_role === role.id) return message.channel.send(string(locale, "CFG_ALREADY_APPROVED_ROLE_ERROR", {}, "error"));
				if (!role.editable || role.managed) return message.channel.send(string(locale, "CFG_UNMANAGEABLE_ROLE_ERROR", { role: role.name }, "error"), {disableMentions: "everyone"});
				qServerDB.config.approved_role = role.id;
				await dbModify("Server", {id: server.id}, qServerDB);
				return message.channel.send(string(locale, "CFG_APPROVED_ROLE_SUCCESS", { role: role.name }, "success"), {disableMentions: "everyone"});
			}
		},
		{
			names: ["pingrole", "ping"],
			name: "Suggestion Submitted Mention Role",
			description: "The role that is mentioned when a new suggestion is submitted for review.",
			examples: "`{{p}}config pingrole Staff`\nSets the \"Staff\" as the role mentioned when a suggestion is submitted for review\n\n`{{p}}config pingrole none`\nResets the role mentioned when a suggestion is submitted for review, meaning no role will be mentioned",
			cfg: async function() {
				if (!args[1]) return message.channel.send((await listRoles(qServerDB.config.ping_role, server, "CONFIG_NAME:PINGROLE", false)));
				let input = args.splice(1).join(" ");
				if (input.toLowerCase() === "none" || input.toLowerCase() === "reset") {
					qServerDB.config.ping_role = "";
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, "CFG_RESET_PING_ROLE_SUCCESS", {}, "success"));
				}
				if (!server.me.permissions.has("MENTION_EVERYONE")) return message.channel.send(string(locale, "CFG_NO_MENTION_EVERYONE_ERROR", { bot: `<@${client.user.id}>` }, "error"));
				let role = await findRole(input, server.roles.cache);
				if (!role) return message.channel.send(string(locale, "CFG_INVALID_ROLE_ERROR", {}, "error"));
				if (qServerDB.config.ping_role === role.id) return message.channel.send(string(locale, "CFG_ALREADY_PING_ROLE_ERROR", {}, "error"));
				qServerDB.config.ping_role = role.id;
				await dbModify("Server", {id: server.id}, qServerDB);
				return message.channel.send(string(locale, "CFG_PING_ROLE_SUCCESS", { role: role.name }, "success"), {disableMentions: "everyone"});
			}
		},
		{
			names: ["review", "reviewchannel"],
			name: "Suggestion Review Channel",
			description: "The channel where suggestions are sent once they are submitted for review.",
			examples: "`{{p}}config review #suggestions-review`\nSets the #suggestions-review channel as the channel where suggestions awaiting review are sent",
			cfg: async function() {
				if (!args[1]) return message.channel.send((await showChannel(qServerDB.config.channels.staff, server, "CONFIG_NAME:REVIEW", qServerDB.config.mode === "review", qServerDB.config.mode === "autoapprove" ? string(locale, "CFG_REVIEW_NOT_NECESSARY_APPEND") : ""))[0]);
				return message.channel.send((await handleChannelInput(locale, args.splice(1).join(" ").toLowerCase(), server, "staff", "staff", "CFG_REVIEW_SET_SUCCESS")));
			}
		},
		{
			names: ["suggestions", "suggestionchannel", "suggestionschannel"],
			name: "Approved Suggestions Channel",
			description: "The channel where suggestions are sent once they are approved (or submitted when the mode is set to `autoapprove`).",
			examples: "`{{p}}config suggestions #suggestions`\nSets the #suggestions channel as the channel where approved suggestions are sent",
			cfg: async function() {
				if (!args[1]) return message.channel.send((await showChannel(qServerDB.config.channels.suggestions, server, "CONFIG_NAME:SUGGESTIONS", true))[0]);
				return message.channel.send((await handleChannelInput(locale, args.splice(1).join(" ").toLowerCase(), server, "suggestions", "suggestions", "CFG_SUGGESTIONS_SET_SUCCESS")));
			}
		},
		{
			names: ["denied", "deniedchannel"],
			name: "Denied Suggestions Channel",
			description: "The channel where suggestions are sent when they are denied or deleted.",
			examples: "`{{p}}config denied #denied-suggestions`\nSets the #denied-suggestions channel as the channel where denied or deleted suggestions are sent\n\n`{{p}}config denied none`\nResets the denied suggestions channel, making there be none set",
			cfg: async function() {
				if (!args[1]) return message.channel.send((await showChannel(qServerDB.config.channels.denied, server, "CONFIG_NAME:DENIED", false))[0]);
				return message.channel.send((await handleChannelInput(locale, args.splice(1).join(" ").toLowerCase(), server, "denied", "denied", "CFG_DENIED_SET_SUCCESS", "CFG_DENIED_RESET_SUCCESS")));
			}
		},
		{
			names: ["log", "logs", "logchannel", "logschannel"],
			name: "Log Channel",
			description: "The channel where suggestions submitted and actions taken on them are logged.",
			examples: "`{{p}}config log #suggestion-log`\nSets the #suggestion-log channel as log channel for suggestions and actions taken on them\n\n`{{p}}config log none`\nResets the log channel, making there be none set",
			cfg: async function() {
				if (!args[1]) return message.channel.send((await showChannel(qServerDB.config.channels.log, server, "CONFIG_NAME:LOG", false))[0]);
				return message.channel.send((await handleChannelInput(locale, args.splice(1).join(" ").toLowerCase(), server, "log", "log", "CFG_LOG_SET_SUCCESS", "CFG_LOG_RESET_SUCCESS")));
			}
		},
		{
			names: ["commandschannels", "commandchannels", "command", "commandchannel", "commands"],
			name: "Suggestion Commands Channels",
			description: "This setting locks using the `suggest` command to only the configured channels. Configuring no channels will allow the command to be used in any channel.",
			examples: "`{{p}}config commands add #bot-commands`\nLimits using the `suggest` command to the #bot-commands channel\n\n`{{p}}config commands remove 567385190196969493`\nRemoves the 567385190196969493 channel from the list of commands channels\n\n`{{p}}config commands list`\nLists the configured commands channels",
			cfg: async function() {
				switch (args[1] || "") {
				case "add":
				case "+": {
					return message.channel.send((await handleCommandsChannelInput(locale, args.splice(2).join(" ").toLowerCase(), server, "commands", "commands", "CFG_COMMANDS_ADD_SUCCESS", "add")));
				}
				case "remove":
				case "-":
				case "rm":
				case "delete": {
					return message.channel.send((await handleCommandsChannelInput(locale, args.splice(2).join(" ").toLowerCase(), server, "commands", "commands", "CFG_COMMANDS_REMOVED_SUCCESS", "remove")));
				}
				case "list": {
					return message.channel.send((await showCommandsChannels(qServerDB.config.channels.commands_new, qServerDB.config.channels.commands, server, "CONFIG_NAME:COMMANDSCHANNELS", false, string(locale, "CFG_COMMANDS_CHANNEL_APPEND")))[0]);
				}
				default: {
					if (args[1]) return message.channel.send(string(locale, "CFG_INVALID_ROLE_PARAM_ERROR"));
					else return message.channel.send((await showCommandsChannels(qServerDB.config.channels.commands_new, qServerDB.config.channels.commands, server, "CONFIG_NAME:COMMANDSCHANNELS", false, string(locale, "CFG_COMMANDS_CHANNEL_APPEND")))[0]);
				}
				}
			}
		},
		{
			names: ["implemented", "archivechannel", "archive", "implementedchannel", "done", "donechannel"],
			name: "Implemented Suggestions Archive Channel",
			description: "The channel where suggestions marked as \"Implemented\" via the `mark` command are sent. If no channel is configured, implemented suggestions will remain in the suggestions feed",
			examples: "`{{p}}config implemented #implemented-suggestions`\nSets the #implemented-suggestions channel as the channel where implemented suggestions are sent\n\n`{{p}}config implemented none`\nResets the implemented suggestions archive channel, making there be none set",
			cfg: async function() {
				if (!args[1]) return message.channel.send((await showChannel(qServerDB.config.channels.archive, server, "CONFIG_NAME:IMPLEMENTED", false))[0]);
				return message.channel.send((await handleChannelInput(locale, args.splice(1).join(" ").toLowerCase(), server, "archive", "denied", "CFG_ARCHIVE_SET_SUCCESS", "CFG_ARCHIVE_RESET_SUCCESS")));
			}
		},
		{
			names: ["prefix"],
			name: "Prefix",
			description: "The string of characters (usually a symbol) used to invoke a bot command. For example, in `.vote` the prefix is `.`",
			examples: "`{{p}}config prefix ?`\nSets the bot prefix to `?`",
			cfg: async function() {
				if (!args[1]) return message.channel.send(`${string(locale, "CONFIG_NAME:PREFIX", {}, "success")} ${Discord.escapeMarkdown(qServerDB.config.prefix)}`);
				let prefix = args[1];
				if (prefix.length > 20) return message.channel.send(string(locale, "CFG_PREFIX_TOO_LONG_ERROR", {}, "error"));
				let disallowed = ["suggester:", `${client.user.id}:`];
				if (disallowed.includes(prefix.toLowerCase())) return message.channel.send(string(locale, "CFG_PREFIX_DISALLOWED_ERROR", {}, "error"));
				qServerDB.config.prefix = prefix.toLowerCase();
				await dbModify("Server", {id: server.id}, qServerDB);
				return message.channel.send(string(locale, "CFG_PREFIX_SET_SUCCESS", { prefix: Discord.escapeMarkdown(prefix.toLowerCase()) }, "success"));
			}
		},
		{
			names: ["mode"],
			name: "Mode",
			description: "The mode of handling suggestions. This can be `review` (all suggestions are held for manual review by staff) or `autoapprove` (all suggestions are automatically posted to the suggestions feed)",
			examples: "`{{p}}config mode review`\nSets the mode to `review`\n\n`{{p}}config mode autoapprove`\nSets the mode to `autoapprove`",
			cfg: async function() {
				if (!args[1]) return message.channel.send(`${string(locale, "CONFIG_NAME:MODE", {}, "success")} ${qServerDB.config.mode}`);
				switch (args[1].toLowerCase()) {
				case "review":
					qServerDB.config.mode = "review";
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, "CFG_MODE_REVIEW_SET_SUCCESS", {}, "success"));
				case "autoapprove":
				case "auto-approve":
				case "auto_approve":
				case "auto": {
					if ((await dbQueryNoNew("Suggestion", {status: "awaiting_review", id: server.id}))) return message.channel.send(string(locale, "CFG_SUGGESTIONS_AWAITING_REVIEW_ERROR_Q", { prefix: qServerDB.config.prefix }, "error"));
					qServerDB.config.mode = "autoapprove";
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, "CFG_MODE_AUTOAPPROVE_SET_SUCCESS", {}, ""));
				}
				default:
					return message.channel.send(string(locale, "CFG_MODE_INVALID_ERROR", {}, "error"));
				}
			}
		},
		{
			names: ["emojis", "emojis", "emotes", "emoji", "emote", "react", "reactions"],
			name: "Suggestion Feed Reactions",
			description: "Settings for managing the emojis that are added to suggestions posted to the suggestions feed",
			examples: "`{{p}}config emojis up 👍`\nSets the upvote emoji to 👍\n\n`{{p}}config emojis mid 🤷`\nSets the shrug/no opinion emoji to 🤷\n\n`{{p}}config emojis down 👎`\nSets the downvote emoji to 👎\n\n`{{p}}config emojis up disable`\nDisables the upvote reaction (this can be done for any reaction, just change `up` to any of the other types)\n\n`{{p}}config emojis disable`\nDisables all suggestion feed reactions\n\n`{{p}}config emojis enable`\nEnables suggestion feed reactions if they are disabled",
			cfg: async function() {
				if (!args[1]) {
					let reactEmbed = new Discord.MessageEmbed()
						.setDescription(string(locale, qServerDB.config.react ? "CFG_FEED_REACTIONS_ENABLED" : "CFG_FEED_REACTIONS_DISABLED"))
						.addField(string(locale, "CFG_EMOJI_UPVOTE_TITLE"), (await findEmoji(checkEmoji(qServerDB.config.emojis.up), server.emojis.cache))[1] || (qServerDB.config.emojis.up === "none" ? string(locale, "DISABLED") : "👍"))
						.addField(string(locale, "CFG_EMOJI_MID_TITLE"), (await findEmoji(checkEmoji(qServerDB.config.emojis.mid), server.emojis.cache))[1] || (qServerDB.config.emojis.mid === "none" ? string(locale, "DISABLED") : "🤷"))
						.addField(string(locale, "CFG_EMOJI_DOWNVOTE_TITLE"), (await findEmoji(checkEmoji(qServerDB.config.emojis.down), server.emojis.cache))[1] || (qServerDB.config.emojis.down === "none" ? string(locale, "DISABLED") : "👎"))
						.setColor(qServerDB.config.react ? client.colors.default : client.colors.orange);
					return message.channel.send(reactEmbed);
				}

				switch (args[1].toLowerCase()) {
				case "up":
				case "upvote":
				case "yes": {
					return message.channel.send((await handleEmojiInput(args[2], server, "up", "CFG_EMOJI_UP_DISABLE_SUCCESS", "CFG_EMOJI_UP_SET_SUCCESS")));
				}
				case "shrug":
				case "neutral":
				case "middle":
				case "mid": {
					return message.channel.send((await handleEmojiInput(args[2], server, "mid", "CFG_EMOJI_MID_DISABLE_SUCCESS", "CFG_EMOJI_MID_SET_SUCCESS")));
				}
				case "down":
				case "downvote":
				case "no": {
					return message.channel.send((await handleEmojiInput(args[2], server, "down", "CFG_EMOJI_DOWN_DISABLE_SUCCESS", "CFG_EMOJI_DOWN_SET_SUCCESS")));
				}
				case "enable":
				case "on": {
					if (!qServerDB.config.react) {
						qServerDB.config.react = true;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_FEED_REACTIONS_ENABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_FEED_REACTIONS_ALREADY_ENABLED", {}, "error"));
				}
				case "disable":
				case "off": {
					if (qServerDB.config.react) {
						qServerDB.config.react = false;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_FEED_REACTIONS_DISABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_FEED_REACTIONS_ALREADY_DISABLED", {}, "error"));
				}
				case "toggle":
					qServerDB.config.react = !qServerDB.config.react;
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, qServerDB.config.react ? "CFG_FEED_REACTIONS_ENABLED" : "CFG_FEED_REACTIONS_DISABLED", {}, "success"));
				default:
					return message.channel.send(string(locale, "CFG_EMOJI_INVALID_SETTING_ERROR", {}, "error"));
				}
			}
		},
		{
			names: ["notify", "notif", "notifications", "notification"],
			name: "DM Notifications",
			description: "Settings for server notifications, whether or not users are sent a DM when an action is taken on one of their suggestions",
			examples: "`{{p}}config notify on`\nEnables DM notifications for suggestions in this server\n\n`{{p}}config notify off`\nDisables DM notifications for suggestions in this server",
			cfg: async function() {
				if (!args[1]) return message.channel.send(string(locale, qServerDB.config.notify ? "GUILD_NOTIFICATIONS_ENABLED" : "GUILD_NOTIFICATIONS_DISABLED"));
				switch (args[1].toLowerCase()) {
				case "enable":
				case "on": {
					if (!qServerDB.config.notify) {
						qServerDB.config.notify = true;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "GUILD_NOTIFICATIONS_ENABLED", {}, "success"));
					} else return message.channel.send(string(locale, "GUILD_NOTIFICATIONS_ALREADY_ENABLED", {}, "error"));
				}
				case "disable":
				case "off": {
					if (qServerDB.config.notify) {
						qServerDB.config.notify = false;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "GUILD_NOTIFICATIONS_DISABLED", {}, "success"));
					} else return message.channel.send(string(locale, "GUILD_NOTIFICATIONS_ALREADY_DISABLED", {}, "error"));
				}
				case "toggle":
					qServerDB.config.notify = !qServerDB.config.notify;
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, qServerDB.config.notify ? "GUILD_NOTIFICATIONS_ENABLED" : "GUILD_NOTIFICATIONS_DISABLED", {}, "success"));
				default:
					return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
				}
			}
		},
		{
			names: ["clearcommands", "cleancommand", "clear", "clean", "cleancommands", "clearcommand"],
			name: "Clean Commands",
			description: "This setting controls whether or not some commands and the response are removed after a few seconds. This is useful for keeping your channels clean!",
			examples: "`{{p}}config cleancommands on`\nEnables cleaning of commands\n\n`{{p}}config cleancommands off`\nDisables cleaning of commands",
			cfg: async function() {
				if (!args[1]) return message.channel.send(string(locale, qServerDB.config.clean_suggestion_command ? "CFG_CLEAR_COMMANDS_ENABLED" : "CFG_CLEAR_COMMANDS_DISABLED"));
				switch (args[1].toLowerCase()) {
				case "enable":
				case "on": {
					if (!qServerDB.config.clean_suggestion_command) {
						if (!server.me.permissions.has("MANAGE_MESSAGES")) return message.channel.send(string(locale, "CFG_CLEAR_COMMANDS_NO_MANAGE_MESSAGES", {}, "error"));
						qServerDB.config.clean_suggestion_command = true;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_CLEAR_COMMANDS_ENABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_CLEAR_COMMANDS_ALREADY_ENABLED", {}, "error"));
				}
				case "disable":
				case "off": {
					if (qServerDB.config.clean_suggestion_command) {
						qServerDB.config.clean_suggestion_command = false;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_CLEAR_COMMANDS_DISABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_CLEAR_COMMANDS_ALREADY_DISABLED", {}, "error"));
				}
				case "toggle":
					if (!qServerDB.config.clean_suggestion_command && !server.me.permissions.has("MANAGE_MESSAGES")) return message.channel.send(string(locale, "CFG_CLEAR_COMMANDS_NO_MANAGE_MESSAGES", {}, "error"));
					qServerDB.config.clean_suggestion_command = !qServerDB.config.clean_suggestion_command;
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, qServerDB.config.clean_suggestion_command ? "CFG_CLEAR_COMMANDS_ENABLED" : "CFG_CLEAR_COMMANDS_DISABLED", {}, "success"));
				default:
					return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
				}
			}
		},
		{
			names: ["selfvote", "suggestervote", "self"],
			name: "Voting on Own Suggestions",
			description: "This setting controls whether or not the user who made a suggestion can vote on their own suggestion when it has been approved.",
			examples: "`{{p}}config selfvote on`\nAllows suggestion authors to vote on their own suggestions\n\n`{{p}}config selfvote off`\nPrevents suggestion authors from voting on their own suggestions",
			cfg: async function() {
				if (!args[1]) return message.channel.send(string(locale, qServerDB.config.reactionOptions.suggester ? "CFG_SELF_VOTE_ENABLED" : "CFG_SELF_VOTE_DISABLED"));
				switch (args[1].toLowerCase()) {
				case "enable":
				case "on": {
					if (!qServerDB.config.reactionOptions.suggester) {
						qServerDB.config.reactionOptions.suggester = true;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_SELF_VOTE_ENABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_SELF_VOTE_ALREADY_ENABLED", {}, "error"));
				}
				case "disable":
				case "off": {
					if (qServerDB.config.reactionOptions.suggester) {
						qServerDB.config.reactionOptions.suggester = false;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_SELF_VOTE_DISABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_SELF_VOTE_ALREADY_DISABLED", {}, "error"));
				}
				case "toggle":
					qServerDB.config.reactionOptions.suggester = !qServerDB.config.reactionOptions.suggester;
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, qServerDB.config.reactionOptions.suggester ? "CFG_SELF_VOTE_ENABLED" : "CFG_SELF_VOTE_DISABLED", {}, "success"));
				default:
					return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
				}
			}
		},
		{
			names: ["onevote", "one", "singlevote"],
			name: "Multiple Reaction Voting",
			description: "This setting controls whether or not users can choose multiple voting options on a suggestion (For example, both upvote and downvote).",
			examples: "`{{p}}config onevote on`\nAllows users to choose only one option when voting\n\n`{{p}}config onevote off`\nAllows users to choose multiple options when voting",
			cfg: async function() {
				if (!args[1]) return message.channel.send(string(locale, qServerDB.config.reactionOptions.one ? "CFG_ONE_VOTE_ENABLED" : "CFG_ONE_VOTE_DISABLED"));
				switch (args[1].toLowerCase()) {
				case "enable":
				case "on": {
					if (!qServerDB.config.reactionOptions.one) {
						qServerDB.config.reactionOptions.one = true;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_ONE_VOTE_ENABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_ONE_VOTE_ALREADY_ENABLED", {}, "error"));
				}
				case "disable":
				case "off": {
					if (qServerDB.config.reactionOptions.one) {
						qServerDB.config.reactionOptions.one = false;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_ONE_VOTE_DISABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_ONE_VOTE_ALREADY_DISABLED", {}, "error"));
				}
				case "toggle":
					qServerDB.config.reactionOptions.one = !qServerDB.config.reactionOptions.one;
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, qServerDB.config.reactionOptions.one ? "CFG_ONE_VOTE_ENABLED" : "CFG_ONE_VOTE_DISABLED", {}, "success"));
				default:
					return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
				}
			}
		},
		{
			names: ["inchannelsuggestions", "sendinchannel", "suggestionsinchannel", "sendinchnl"],
			name: "In-Suggestions Channel Suggestion Submission",
			description: "This setting controls whether or not users can submit suggestions via sending a message in the suggestions feed channel.",
			examples: "`{{p}}config inchannelsuggestions on`\nAllows users to submit suggestions via any message in the suggestions feed channel\n\n`{{p}}config inchannelsuggestions off`\nPrevents users from submitting suggestions via any message in the suggestions feed channel",
			cfg: async function() {
				if (!args[1]) return message.channel.send(string(locale, qServerDB.config.in_channel_suggestions ? "CFG_INCHANNEL_ENABLED" : "CFG_INCHANNEL_DISABLED"));
				switch (args[1].toLowerCase()) {
				case "enable":
				case "on": {
					if (!qServerDB.config.in_channel_suggestions) {
						qServerDB.config.in_channel_suggestions = true;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_INCHANNEL_ENABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_INCHANNEL_ALREADY_ENABLED", {}, "error"));
				}
				case "disable":
				case "off": {
					if (qServerDB.config.in_channel_suggestions) {
						qServerDB.config.in_channel_suggestions = false;
						await dbModify("Server", {id: server.id}, qServerDB);
						return message.channel.send(string(locale, "CFG_INCHANNEL_DISABLED", {}, "success"));
					} else return message.channel.send(string(locale, "CFG_INCHANNEL_ALREADY_DISABLED", {}, "error"));
				}
				case "toggle":
					qServerDB.config.in_channel_suggestions = !qServerDB.config.in_channel_suggestions;
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, qServerDB.config.in_channel_suggestions ? "CFG_INCHANNEL_ENABLED" : "CFG_INCHANNEL_DISABLED", {}, "success"));
				default:
					return message.channel.send(string(locale, "ON_OFF_TOGGLE_ERROR", {}, "error"));
				}
			}
		},
		{
			names: ["colorchange", "upvotechange"],
			name: "Color Change",
			description: "This setting controls the color of the suggestion embed changing based on the number of net upvotes. You can customize the color, and the number of net upvotes necessary to change the color!",
			examples: "`{{p}}config colorchange color gold`\nSets the color to change the embed to `gold`. This element supports hex colors, CSS colors, and more!\n\n`{{p}}config colorchange number 5`\nSets the number of net upvotes to change the embed color to `5`.",
			cfg: async function() {
				if (!args[1]) return message.channel.send(new Discord.MessageEmbed().setColor(qServerDB.config.reactionOptions.color).setDescription(string(locale, "CFG_COLOR_CHANGE_INFO", { number: qServerDB.config.reactionOptions.color_threshold, color: qServerDB.config.reactionOptions.color })));
				switch (args[1].toLowerCase()) {
				case "color":
				case "embedcolor":
				case "embedcolour":
				case "colour": {
					let color = colorstring.get.rgb(args[2]);
					if (!color) return message.channel.send(string(locale, "CFG_COLOR_CHANGE_INVALID_COLOR", {}, "error"));
					qServerDB.config.reactionOptions.color = colorstring.to.hex(color);
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(new Discord.MessageEmbed().setColor(qServerDB.config.reactionOptions.color).setDescription(string(locale, "CFG_COLOR_CHANGE_INFO", { number: qServerDB.config.reactionOptions.color_threshold, color: qServerDB.config.reactionOptions.color }, "success")));
				}
				case "upvotes":
				case "number":
				case "votes":
				case "count": {
					let number = parseInt(args[2]);
					if (!number || number < 1) return message.channel.send(string(locale, "CFG_COLOR_CHANGE_INVALID_NUMBER", {}, "error"));
					qServerDB.config.reactionOptions.color_threshold = number;
					await dbModify("Server", {id: server.id}, qServerDB);
					return message.channel.send(string(locale, "CFG_COLOR_CHANGE_INFO", { number: qServerDB.config.reactionOptions.color_threshold, color: qServerDB.config.reactionOptions.color }, "success"));
				}
				default:
					return message.channel.send(string(locale, "CFG_COLOR_CHANGE_NO_PARAMS", {}, "error"));
				}
			}
		},
		{
			names: ["locale", "language", "lang", "locales"],
			name: "Locale",
			description: "The language the bot will respond in. If a user has a locale configured via the `locale` command, the bot will respond to them in their preferred language. If they don't, the bot will respond in the language configured here.",
			examples: "`{{p}}config locale en`\nSets the server language to English.",
			cfg: async function() {
				if (!args[1]) {
					let totalStrings = Object.keys(list).length;
					let localesDone = client.locales.filter(l => (Object.keys(l.list).filter(s => list[s]).length/totalStrings) > 0.65 || l.settings.force);
					let localesProgress = client.locales.filter(l => !localesDone.find(d => d.settings.code === l.settings.code));
					return message.channel.send(new Discord.MessageEmbed()
						.setTitle(string(locale, "LOCALE_LIST_TITLE"))
						.setDescription(localesDone.filter(l => !l.settings.hidden || qServerDB.config.locale === l.settings.code).map(l => ` - [${l.settings.code}] **${l.settings.native}** (${l.settings.english}) ${qServerDB.config.locale && qServerDB.config.locale === l.settings.code ? `:arrow_left: _${string(locale, "SELECTED")}_` : ""}`).join("\n"))
						.addField(string(locale, "LOCALE_LIST_INCOMPLETE_TITLE"), `${string(locale, "LOCALE_LIST_INCOMPLETE_DESC", { support_invite: `https://discord.gg/${support_invite}` })}\n${localesProgress.filter(l => !l.settings.hidden || qServerDB.config.locale === l.settings.code).map(l => ` - [${l.settings.code}] **${l.settings.native}** (${l.settings.english}) ${qServerDB.config.locale && qServerDB.config.locale === l.settings.code ? `:arrow_left: _${string(locale, "SELECTED")}_` : ""}`).join("\n")}`)
						.setFooter(string(locale, "LOCALE_FOOTER"))
						.setColor(client.colors.default));
				}
				let selection = args[1].toLowerCase();
				let found = client.locales.find(l => l.settings.code === selection || l.settings.native.toLowerCase() === selection || l.settings.english.toLowerCase() === selection);
				if (!found) return message.channel.send(string(locale, "NO_LOCALE_ERROR", {}, "error"));
				qServerDB.config.locale = found.settings.code;
				await dbModify("Server", { id: server.id }, qServerDB);
				return message.channel.send(string(found.settings.code, "GUILD_LOCALE_SET_SUCCESS", { name: found.settings.native, invite: `https://discord.gg/${support_invite}` }, "success"));
			}
		}];

		switch (args[0] ? args[0].toLowerCase() : "help") {
		case "help": {
			if (args[1]) {
				let e = elements.find(e => e.names.includes(args[1].toLowerCase()));
				if (!e) return message.channel.send(string(locale, "UNKNOWN_ELEMENT_ERROR", {}, "error"));
				let nameString = e.names[0].toUpperCase();
				let elementEmbed = new Discord.MessageEmbed()
					.setAuthor(string(locale, "CFG_HELP_TITLE"), client.user.displayAvatarURL({ format: "png", dynamic: true }))
					.setColor(client.colors.default)
					.setTitle(string(locale, `CONFIG_NAME:${nameString}`) || e.name)
					.setDescription(string(locale, `CONFIG_DESC:${nameString}`) || e.description)
					.addField(string(locale, "CFG_HELP_COMMAND"), string(locale, "CFG_HELP_COMMAND_INFO", { prefix: qServerDB.config.prefix, subcommand: e.names[0] }))
					.addField(string(locale, "HELP_EXAMPLES"), (e.examples ? (string(locale, `CONFIG_EXAMPLES:${nameString}`) || e.examples) : "").replace(new RegExp("{{p}}", "g"), Discord.escapeMarkdown(qServerDB.config.prefix)));
				let namesAliases = e.names.splice(1);
				namesAliases && namesAliases.length > 1 ? elementEmbed.addField(string(locale, namesAliases.length > 1 ? "HELP_ALIAS_PLURAL" : "HELP_ALIAS"), namesAliases.map(c => `\`${c}\``).join(", "), true) : "";
				return message.channel.send(elementEmbed);
			}
			let embeds = [new Discord.MessageEmbed()
				.setAuthor(`${string(locale, "CFG_HELP_TITLE")} • ${string(locale, "PAGINATION_PAGE_COUNT")}`, client.user.displayAvatarURL({ format: "png", dynamic: true }))
				.setColor(client.colors.default)
				.setDescription(string(locale, "CFG_HELP_INFO", { p: qServerDB.config.prefix }))
				.addField(string(locale, "CFG_LIST_TITLE"), elements.map(e => `\`${e.names[0]}\``).join("\n"))];
			for await (let e of elements) {
				let nameString = e.names[0].toUpperCase();
				let elementEmbed = new Discord.MessageEmbed()
					.setAuthor(`${string(locale, "CFG_HELP_TITLE")} • ${string(locale, "PAGINATION_PAGE_COUNT")}`, client.user.displayAvatarURL({ format: "png", dynamic: true }))
					.setColor(client.colors.default)
					.setTitle(string(locale, `CONFIG_NAME:${nameString}`) || e.name)
					.setDescription(string(locale, `CONFIG_DESC:${nameString}`) || e.description)
					.addField(string(locale, "CFG_HELP_COMMAND"), string(locale, "CFG_HELP_COMMAND_INFO", { prefix: qServerDB.config.prefix, subcommand: e.names[0] }))
					.addField(string(locale, "HELP_EXAMPLES"), (e.examples ? (string(locale, `CONFIG_EXAMPLES:${nameString}`) || e.examples) : "").replace(new RegExp("{{p}}", "g"), Discord.escapeMarkdown(qServerDB.config.prefix)))
					.setFooter(string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS"));
				let namesAliases = e.names.splice(1);
				namesAliases && namesAliases.length > 1 ? elementEmbed.addField(string(locale, namesAliases.length > 1 ? "HELP_ALIAS_PLURAL" : "HELP_ALIAS"), namesAliases.map(c => `\`${c}\``).join(", "), true) : "";
				embeds.push(elementEmbed);
			}
			return pages(locale, message, embeds);
		}
		case "list": {
			let cfgRolesArr = [];
			let cfgChannelsArr = [];
			let cfgOtherArr = [];
			let issuesCountFatal = 0;

			// Admin roles
			let adminRoles = await listRoles(qServerDB.config.admin_roles, server, "CONFIG_NAME:ADMIN", true);
			if (adminRoles[1]) issuesCountFatal++;
			cfgRolesArr.push(adminRoles[0]);
			// Staff roles
			let staffRoles = await listRoles(qServerDB.config.staff_roles, server, "CONFIG_NAME:STAFF", true);
			if (staffRoles[1]) issuesCountFatal++;
			cfgRolesArr.push(staffRoles[0]);
			// Allowed roles
			cfgRolesArr.push((await listRoles(qServerDB.config.allowed_roles, server, "CONFIG_NAME:ALLOWED", false, string(locale, "CFG_ALLOWED_ROLES_APPEND")))[0]);
			// Voting roles
			cfgRolesArr.push((await listRoles(qServerDB.config.voting_roles, server, "CONFIG_NAME:VOTING", false, string(locale, "CFG_VOTING_ROLES_APPEND")))[0]);
			// Blocked roles
			cfgRolesArr.push((await listRoles(qServerDB.config.blocked_roles, server, "CONFIG_NAME:BLOCKED", false))[0]);
			// Approved suggestion role
			cfgRolesArr.push((await listRoles(qServerDB.config.approved_role, server, "CONFIG_NAME:APPROVEROLE", false)));
			// Submitted suggestion mention role
			cfgRolesArr.push((await listRoles(qServerDB.config.ping_role, server, "CONFIG_NAME:PINGROLE", false)));
			// Suggestions channel
			let suggestionChannel = await showChannel(qServerDB.config.channels.suggestions, server, "CONFIG_NAME:SUGGESTIONS", true);
			if (suggestionChannel[1]) {
				issuesCountFatal++;
				qServerDB.config.channels.suggestions = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(suggestionChannel[0]);
			// Staff review channel
			let reviewChannel = await showChannel(qServerDB.config.channels.staff, server, "CONFIG_NAME:REVIEW", qServerDB.config.mode === "review", qServerDB.config.mode === "autoapprove" ? string(locale, "CFG_REVIEW_NOT_NECESSARY_APPEND") : "");
			if (reviewChannel[1]) {
				if (qServerDB.config.mode === "review") issuesCountFatal++;
				qServerDB.config.channels.staff = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(reviewChannel[0]);
			// Denied channel
			let deniedChannel = await showChannel(qServerDB.config.channels.denied, server, "CONFIG_NAME:DENIED", false);
			if (deniedChannel[1]) {
				qServerDB.config.channels.denied = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(deniedChannel[0]);
			// Log channel
			let logChannel = await showChannel(qServerDB.config.channels.log, server, "CONFIG_NAME:LOG", false);
			if (logChannel[1]) {
				qServerDB.config.channels.log = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(logChannel[0]);
			// Archive channel
			let archiveChannel = await showChannel(qServerDB.config.channels.archive, server, "CONFIG_NAME:IMPLEMENTED", false);
			if (archiveChannel[1]) {
				qServerDB.config.channels.archive = "";
				await dbModify("Server", {id: server.id}, qServerDB);
			}
			cfgChannelsArr.push(archiveChannel[0]);
			// Commands channel
			let commandsChannel = await showCommandsChannels(qServerDB.config.channels.commands_new, qServerDB.config.channels.commands, server, "CONFIG_NAME:COMMANDSCHANNELS", false, string(locale, "CFG_COMMANDS_CHANNEL_APPEND"));
			cfgChannelsArr.push(commandsChannel[0]);
			// Emojis
			if (server.emojis) {
				let upEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.up), server.emojis.cache))[1] || (qServerDB.config.emojis.up === "none" ? string(locale, "CFG_UPVOTE_REACTION_DISABLED") : "👍");
				let midEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.mid), server.emojis.cache))[1] || (qServerDB.config.emojis.mid === "none" ? string(locale, "CFG_MID_REACTION_DISABLED") : "🤷");
				let downEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.down), server.emojis.cache))[1] || (qServerDB.config.emojis.down === "none" ? string(locale, "CFG_DOWNVOTE_REACTION_DISABLED") : "👎");

				cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:EMOJIS", {}, "success")}:** ${qServerDB.config.react ? string(locale, "ENABLED") : string(locale, "DISABLED")} (${upEmoji}, ${midEmoji}, ${downEmoji})`);
			} else cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:EMOJIS", {}, "error")}:** ${string(locale, "UNAVAILABLE")}`);
			// Color Change
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:COLORCHANGE", {}, "success")}:** ${string(locale, "CFG_COLOR_CHANGE_INFO", { number: qServerDB.config.reactionOptions.color_threshold, color: qServerDB.config.reactionOptions.color })}`);
			// Own Voting
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:SELFVOTE", {}, "success")}:** ${qServerDB.config.reactionOptions.suggester ? string(locale, "ENABLED") : string(locale, "DISABLED")}`);
			// One Vote
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:ONEVOTE", {}, "success")}:** ${qServerDB.config.reactionOptions.one ? string(locale, "CFG_ONE_VOTE_ENABLED") : string(locale, "CFG_ONE_VOTE_DISABLED")}`);
			// Mode
			let mode = string(locale, "ERROR", {}, "error");
			switch (qServerDB.config.mode) {
			case "review":
				mode = string(locale, "CFG_MODE_REVIEW");
				break;
			case "autoapprove":
				mode = string(locale, "CFG_MODE_AUTOAPPROVE");
				break;
			}
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:MODE", {}, "success")}:** ${mode}`);
			// Prefix
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:PREFIX", {}, "success")}:** ${Discord.escapeMarkdown(qServerDB.config.prefix)}`);
			// Notify
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:NOTIFY", {}, "success")}:** ${string(locale, qServerDB.config.notify ? "ENABLED" : "DISABLED")}`);
			//Clean Suggestion Command
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:CLEARCOMMANDS", {}, "success")}:** ${string(locale, qServerDB.config.clean_suggestion_command ? "ENABLED" : "DISABLED")}`);
			//In-Channel Suggestions
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:INCHANNELSUGGESTIONS", {}, "success")}:** ${string(locale, qServerDB.config.in_channel_suggestions ? "ENABLED" : "DISABLED")}`);
			//Locale
			cfgOtherArr.push(`**${string(locale, "CONFIG_NAME:LOCALE", {}, "success")}:** ${client.locales.find(l => l.settings.code === qServerDB.config.locale).settings.native} (${client.locales.find(l => l.settings.code === qServerDB.config.locale).settings.english})`);

			let embeds = [new Discord.MessageEmbed().setTitle(string(locale, "ROLE_CONFIGURATION_TITLE")).setDescription(cfgRolesArr.join("\n")),
				new Discord.MessageEmbed().setTitle(string(locale, "CHANNEL_CONFIGURATION_TITLE")).setDescription(cfgChannelsArr.join("\n")),
				new Discord.MessageEmbed().setTitle(string(locale, "OTHER_CONFIGURATION_TITLE")).setDescription(cfgOtherArr.join("\n"))];

			if (args[args.length-1].toLowerCase() === "--flags" && permission <= 1) {
				const permissions = require("../../utils/permissions");
				let hasPermissionList = [];
				Object.keys(permissions).forEach(perm => {
					server.me.permissions.has(perm) ? hasPermissionList.push(string(locale, `PERMISSION:${perm}`)) : "";
				});

				embeds.push(new Discord.MessageEmbed().setTitle(string(locale, "CFG_INTERNAL_TITLE")).addField(string(locale, "CFG_PERMISSIONS_TITLE"), hasPermissionList.length > 0 ? hasPermissionList.join(", ") : "None").addField(string(locale, "CFG_FLAGS_TITLE"), qServerDB.flags.length > 0 ? qServerDB.flags.join(", ") : string(locale, "NO_FLAGS_SET")));
			}

			embeds.forEach(e => {
				e.setAuthor(`${string(locale, "SERVER_CONFIGURATION_TITLE", { server: server.name })} • ${string(locale, "PAGINATION_PAGE_COUNT")}`, server.iconURL({ dynamic: true, format: "png" }))
					.setColor(issuesCountFatal > 0 ? client.colors.red : client.colors.green)
					.addField(string(locale, "CFG_STATUS_TITLE"), issuesCountFatal > 0 ? string(locale, "CFG_STATUS_BAD", {}, "error") : string(locale, "CFG_STATUS_GOOD", {}, "success"))
					.setFooter(string(locale, "PAGINATION_NAVIGATION_INSTRUCTIONS"));
			});

			return pages(locale, message, embeds);
		}
		default:
			// eslint-disable-next-line no-case-declarations
			let e = elements.find(e => e.names.includes(args[0].toLowerCase()));
			if (!e) return message.channel.send(string(locale, "CFG_NO_PARAMS_ERROR", {}, "error"));
			if (server.id !== message.guild.id) return message.channel.send(string(locale, "CFG_OTHER_SERVER_ERROR", {}, "error"));
			await e.cfg();
		}

	}
};
