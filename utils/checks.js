const { colors, emoji } = require("../config.json");
const Discord = require("discord.js");
const { string } = require("./strings");

module.exports = {
	/**
	 * Returns permission level of inputted ID
	 *
	 * 11 - Blacklisted
	 * 10 - Everyone
	 * 3 - Server Staff
	 * 2 - Server Admin
	 * 1 - Global Staff Flag
	 * 0 - Developer/Global Admin
	 *
	 * @param member - Member object fetched from a server
	 * @param client - The Discord client
	 * @returns {Promise<number>}
	 */
	checkPermissions: async (member, client) => {
		if (!member || !member.id || !client) return 10;
		if (client.admins.has(member.id)) return 0;
		let { dbQueryNoNew } = require("./db.js");
		let qUserDB = await dbQueryNoNew("User", { id: member.id });
		let qServerDB = await dbQueryNoNew("Server", { id: member.guild.id });
		if (qUserDB && qUserDB.flags.includes("STAFF")) return 1;
		if (qUserDB && qUserDB.blocked) return 12;
		if (member.hasPermission("MANAGE_GUILD") || qServerDB.config.admin_roles.some(r => member.roles.cache.has(r))) return 2;
		if (qServerDB.config.staff_roles.some(r => member.roles.cache.has(r))) return 3;
		if (qServerDB.config.blacklist.includes(member.id)) return 11;
		return 10;
	},
	channelPermissions: (permissionCheckFor, channel, client) => {
		const permissionNames = require("./permissions.json");
		let permissionCheckArr = [];
		switch (permissionCheckFor) {
		case "suggestions":
			permissionCheckArr = ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			break;
		case "staff":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			break;
		case "denied":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			break;
		case "log":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_WEBHOOKS"];
			break;
		case "commands":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"];
			break;
		default:
			permissionCheckArr = permissionCheckFor;
		}
		let channelPermissions = channel.permissionsFor(client.user.id);
		let missing = permissionCheckArr.filter(p => !channelPermissions.has(p)).map(p => permissionNames[p]);
		if (missing.length < 1) return null;

		let returned;
		if (channelPermissions.has("EMBED_LINKS")) {
			returned = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
				.setColor(colors.red);
		} else returned = `This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:\n- ${missing.join("\n- ")}\n\nIn the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has the above permissions.`;

		return returned;
	},
	async checkConfig(db) {
		if (!db) return null;

		let config = db.config;
		let missing = [];

		if (!config.admin_roles || config.admin_roles.length < 1) missing.push("Server Admin Roles");
		if (!config.staff_roles || config.staff_roles.length < 1) missing.push("Server Staff Roles");
		if (!config.channels.suggestions) missing.push("Approved Suggestions Channel");
		if (config.mode === "review" && !config.channels.staff) missing.push("Suggestion Review Channel");

		if (missing.length > 0) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${db.config.prefix}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return embed;
		}
		return null;
	},
	suggestionEditCommandCheck: async function (message, args) {
		const { baseConfig, checkSuggestions, checkApprovedSuggestion } = require("./checks");
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return returned;

		let suggestionsCheck = checkSuggestions(message.guild, qServerDB);
		if (suggestionsCheck) return [suggestionsCheck];

		let suggestion = await checkApprovedSuggestion(message.guild, args[0]);
		if (suggestion[0]) return [suggestion[0]];

		return [null, qServerDB, suggestion[1], suggestion[1].suggestionId];
	},
	suggestionDeleteCommandCheck: async function (message, args) {
		const { checkDenied, baseConfig, checkSuggestions, checkApprovedSuggestion } = require("./checks");
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return [returned];

		let suggestionsCheck = checkSuggestions(message.guild, qServerDB);
		if (suggestionsCheck) return [suggestionsCheck];

		let deniedCheck = checkDenied(message.guild, qServerDB);
		if (deniedCheck) return [deniedCheck];

		let suggestion = await checkApprovedSuggestion(message.guild, args[0]);
		if (suggestion[0]) return [suggestion[0]];

		return [null, qServerDB, suggestion[1], suggestion[1].suggestionId];
	},
	checkSuggestion: async function (guild, id) {
		const { dbQueryNoNew } = require("./db");
		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: id, id: guild.id });
		if (!qSuggestionDB) return [string("INVALID_SUGGESTION_ID_ERROR", {}, "error")];
		return [null, qSuggestionDB];
	},
	checkApprovedSuggestion: async function (guild, id) {
		const { checkSuggestion } = require("./checks");
		let [fetchSuggestion, qSuggestionDB] = await checkSuggestion(guild, id);
		if (fetchSuggestion) return [fetchSuggestion];

		if (qSuggestionDB.status !== "approved") return [string("SUGGESTION_NOT_APPROVED_ERROR", {}, "error")];
		if (qSuggestionDB.implemented) return [string("SUGGESTION_IMPLEMENTED_ERROR", {}, "error")];
		return [null, qSuggestionDB];
	},
	baseConfig: async function(guild) {
		const { dbQuery } = require("./db");
		const { checkConfig } = require("./checks");
		let qServerDB = await dbQuery("Server", { id: guild });
		if (!qServerDB) return [string("UNCONFIGURED_ERROR", {}, "error")];

		let missingConfig = await checkConfig(qServerDB);
		if (missingConfig) return [missingConfig];
		return [null, qServerDB];
	},
	checkSuggestions: function (guild, db) {
		const { channelPermissions } = require("./checks");
		if (guild.channels.cache.get(db.config.channels.suggestions)) {
			let perms = channelPermissions( "suggestions", guild.channels.cache.get(db.config.channels.suggestions), guild.client);
			if (perms) return perms;
		} else return string("NO_SUGGESTION_CHANNEL_ERROR", {}, "error");
	},
	checkReview: function (guild, db) {
		const { channelPermissions } = require("./checks");
		if (guild.channels.cache.get(db.config.channels.staff)) {
			let perms = channelPermissions( "staff", guild.channels.cache.get(db.config.channels.staff), guild.client);
			if (perms) return perms;
		} else return string("NO_REVIEW_CHANNEL_ERROR", {}, "error");
	},
	checkDenied: function (guild, db) {
		const { channelPermissions } = require("./checks");
		if (!db.config.channels.denied) return null;
		if (guild.channels.cache.get(db.config.channels.denied)) {
			let perms = channelPermissions( "denied", guild.channels.cache.get(db.config.channels.denied), guild.client);
			if (perms) return perms;
		} else return string("NO_DENIED_CHANNEL_ERROR", {}, "error");
	},
	/**
	 * Check a URL to see if it makes a valid attachment
	 * @param {string} url - The string to be checked
	 * @returns {boolean}
	 */
	checkURL: function (url) {
		const validUrl = require("valid-url");
		if (validUrl.isUri(url)){
			let noparams = url.split("?")[0];
			return (noparams.match(/\.(jpeg|jpg|gif|png)$/) != null);
		} else return false;
	}
};