const { emoji } = require("../config.json");
const Discord = require("discord.js");
const { string } = require("./strings");

module.exports = {
	/**
	 * Returns permission level of inputted ID
	 *
	 * 11 - Blocked
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
		let { dbQueryNoNew } = require("./db.js");
		let qUserDB = await dbQueryNoNew("User", { id: member.id });
		if (qUserDB && qUserDB.flags.find(f => f.startsWith("PERMISSION_OVERRIDE:")) && (parseInt(qUserDB.flags.find(f => f.startsWith("PERMISSION_OVERRIDE:")).split(":")[1]) || parseInt(qUserDB.flags.find(f => f.startsWith("PERMISSION_OVERRIDE:")).split(":")[1]) === 0)) return parseInt(qUserDB.flags.find(f => f.startsWith("PERMISSION_OVERRIDE:")).split(":")[1]);
		if (client.admins.has(member.id)) return 0;
		if (qUserDB && qUserDB.flags.includes("STAFF")) return 1;
		if (qUserDB && qUserDB.blocked) return 12;
		if (!member.guild) return 10;
		let qServerDB = await dbQueryNoNew("Server", { id: member.guild.id });
		if (member.hasPermission("MANAGE_GUILD") || qServerDB.config.admin_roles.some(r => member.roles.cache.has(r))) return 2;
		if (qServerDB.config.staff_roles.some(r => member.roles[0] ? member.roles.find(m => m === r) : member.roles.cache.has(r))) return 3;
		if (qServerDB.config.blocklist.includes(member.id) || qServerDB.config.blocklist.find(b => b.id === member.id && b.expires > Date.now()) || qServerDB.config.blocked_roles.some(r => member.roles[0] ? member.roles.find(m => m === r) : member.roles.cache.has(r))) return 11;
		return 10;
	},
	channelPermissions: (locale, permissionCheckFor, channel, client, noEmbedOverride) => {
		let permissionCheckArr = [];
		switch (permissionCheckFor) {
		case "suggestions":
			permissionCheckArr = ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			break;
		case "staff":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"];
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
		let missing = permissionCheckArr.filter(p => !channelPermissions.has(p)).map(p => string(locale, `PERMISSION:${p}`));
		if (missing.length < 1) return null;

		let returned;
		if (channelPermissions.has("EMBED_LINKS") && !noEmbedOverride) {
			returned = new Discord.MessageEmbed()
				.setDescription(string(locale, "PERMISSIONS_MISSING_HEADER", { name: client.user.username, channel: `<#${channel.id}>` }))
				.addField(string(locale, "MISSING_ELEMENTS_HEADER"), `${channelPermissions.has("USE_EXTERNAL_EMOJIS") ? `<:${emoji.x}>` : "❌"} ${missing.join(`\n${channelPermissions.has("USE_EXTERNAL_EMOJIS") ? `<:${emoji.x}>` : "❌"} `)}`)
				.addField(string(locale, "HOW_TO_FIX_HEADER"), string(locale, "FIX_MISSING_PERMISSIONS_INFO", { name: client.user.username, channel: `<#${channel.id}>` }))
				.setColor(client.colors.red);
		} else returned = `${string(locale, "PERMISSIONS_MISSING_HEADER", { name: client.user.username, channel: `<#${channel.id}>` })}\n- ${missing.join("\n- ")}\n\n${string(locale, "FIX_MISSING_PERMISSIONS_INFO", { name: client.user.username, channel: `<#${channel.id}>` })}`;

		return returned;
	},
	async checkConfig(locale, db, client) {
		if (!db) return null;

		let config = db.config;
		let missing = [];

		if (!config.admin_roles || config.admin_roles.length < 1) missing.push(string(locale, "CONFIG_NAME:ADMIN"));
		if (!config.staff_roles || config.staff_roles.length < 1) missing.push(string(locale, "CONFIG_NAME:STAFF"));
		if (!config.channels.suggestions) missing.push(string(locale, "CONFIG_NAME:SUGGESTIONS"));
		if (config.mode === "review" && !config.channels.staff) missing.push(string(locale, "CONFIG_NAME:REVIEW"));

		if (missing.length > 0) {
			return (new Discord.MessageEmbed()
				.setDescription(string(locale, "MISSING_CONFIG_HEADER", { prefix: db.config.prefix }))
				.addField(string(locale, "MISSING_ELEMENTS_HEADER"), `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(client.colors.red));
		}
		return null;
	},
	suggestionEditCommandCheck: async function (locale, message, args) {
		const { baseConfig, checkSuggestions, checkApprovedSuggestion } = require("./checks");
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return [returned, qServerDB];

		let suggestion = await checkApprovedSuggestion(locale, message.guild, args[0]);
		if (suggestion[0]) return [suggestion[0], qServerDB];

		let suggestionsCheck = checkSuggestions(locale, message.guild, qServerDB, suggestion[1]);
		if (suggestionsCheck) return [suggestionsCheck, qServerDB];

		return [null, qServerDB, suggestion[1], suggestion[1].suggestionId];
	},
	suggestionDeleteCommandCheck: async function (locale, message, args) {
		const { checkDenied, baseConfig, checkSuggestions, checkApprovedSuggestion } = require("./checks");
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return [returned, qServerDB];

		let suggestion = await checkApprovedSuggestion(locale, message.guild, args[0]);
		if (suggestion[0]) return [suggestion[0], qServerDB];

		let suggestionsCheck = checkSuggestions(locale, message.guild, qServerDB, suggestion[1]);
		if (suggestionsCheck) return [suggestionsCheck, qServerDB];

		let deniedCheck = checkDenied(locale, message.guild, qServerDB);
		if (deniedCheck) return [deniedCheck, qServerDB];

		return [null, qServerDB, suggestion[1], suggestion[1].suggestionId];
	},
	checkSuggestion: async function (locale, guild, id) {
		const { dbQueryNoNew } = require("./db");
		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: id, id: guild.id });
		if (!qSuggestionDB) return [string(locale, "INVALID_SUGGESTION_ID_ERROR", {}, "error")];
		return [null, qSuggestionDB];
	},
	checkApprovedSuggestion: async function (locale, guild, id) {
		const { checkSuggestion } = require("./checks");
		let [fetchSuggestion, qSuggestionDB] = await checkSuggestion(locale, guild, id);
		if (fetchSuggestion) return [fetchSuggestion];

		if (qSuggestionDB.status !== "approved") return [string(locale, "SUGGESTION_NOT_APPROVED_ERROR", {}, "error")];
		if (qSuggestionDB.implemented) return [string(locale, "SUGGESTION_IMPLEMENTED_ERROR", {}, "error")];
		return [null, qSuggestionDB];
	},
	baseConfig: async function(locale, guild) {
		const { dbQuery } = require("./db");
		const { checkConfig } = require("./checks");
		let qServerDB = await dbQuery("Server", { id: guild.id });
		if (!qServerDB) return [string(locale, "UNCONFIGURED_ERROR", {}, "error")];

		let missingConfig = await checkConfig(locale, qServerDB, guild.client);
		if (missingConfig) return [missingConfig, qServerDB];
		return [null, qServerDB];
	},
	checkSuggestions: function (locale, guild, db, suggestion) {
		const { channelPermissions } = require("./checks");
		if (guild.channels.cache.get((suggestion ? suggestion.channels.suggestions : null) || db.config.channels.suggestions)) {
			let perms = channelPermissions(locale,  "suggestions", guild.channels.cache.get(db.config.channels.suggestions), guild.client);
			if (perms) return perms;
		} else return string(locale, "NO_SUGGESTION_CHANNEL_ERROR", {}, "error");
	},
	checkReview: function (locale, guild, db, suggestion, edit, noEmbedOverride) {
		const { channelPermissions } = require("./checks");
		if (guild.channels.cache.get(edit ? (suggestion.pending_edit.channelid || db.config.channels.staff) : ((suggestion ? suggestion.channels.staff : null) || db.config.channels.staff))) {
			let perms = channelPermissions(locale,  "staff", guild.channels.cache.get(db.config.channels.staff), guild.client, noEmbedOverride);
			if (perms) return perms;
		} else return string(locale, "NO_REVIEW_CHANNEL_ERROR", {}, "error");
	},
	checkDenied: function (locale, guild, db) {
		const { channelPermissions } = require("./checks");
		if (!db.config.channels.denied) return null;
		if (guild.channels.cache.get(db.config.channels.denied)) {
			let perms = channelPermissions(locale,  "denied", guild.channels.cache.get(db.config.channels.denied), guild.client);
			if (perms) return perms;
		} else return string(locale, "NO_DENIED_CHANNEL_ERROR", {}, "error");
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
