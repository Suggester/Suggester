const { colors } = require("../../config.json");
const { dbQueryNoNew, dbModify, findEmoji } = require("../../coreFunctions.js");
const nodeEmoji = require("node-emoji");
const permissions = require("../../utils/permissions");
const { string } = require("../../utils/strings");
module.exports = {
	controls: {
		name: "showconfig",
		permission: 1,
		usage: "showconfig <guild id>",
		description: "Checks the configuration for a server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
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
				if (roleList.length < 1) {
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

		let server;
		if (!args[0]) server = message.guild;
		else if (client.guilds.cache.get(args[0])) server = client.guilds.cache.get(args[0]);
		if (!server) return message.channel.send(string("INVALID_GUILD_ID_ERROR", {}, "error"));

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

		let hasPermissionList = [];
		Object.keys(permissions).forEach(perm => {
			server.me.permissions.has(perm) ? hasPermissionList.push(permissions[perm]) : "";
		});

		cfgEmbed.addField(string("CFG_PERMISSIONS_TITLE"), hasPermissionList.length > 0 ? hasPermissionList.join(", ") : "None");
		if (qServerDB.flags && qServerDB.flags.length > 0) cfgEmbed.addField(string("CFG_FLAGS_TITLE"), qServerDB.flags.join(", "));
		return message.channel.send(cfgEmbed);
	}
};