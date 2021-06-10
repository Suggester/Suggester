const nodeEmoji = require("node-emoji");
const { findBestMatch } = require("string-similarity");
const { string } = require("./strings");
const { dbModify } = require("./db");
/**
 * Find something in a collection with near matching strings
 * @param collection - Call .cache on it first
 * @param words - The string containing a potential string match
 */
function nearMatchCollection (collection, words) {
	let array = collection.array();
	let nameArray = array.map((r) => r.name.toLowerCase());

	let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(words.toLowerCase(), nameArray);

	if (rating < .3) return null;
	return array[bestMatchIndex];
}

module.exports = {
	/**
	 * Finds a role based on an input
	 * @param input {String} - Role mention, name, or ID
	 * @param roles - Represents a guild's roles cache
	 * @returns {Promise<null|*>}
	 */
	findRole: async function (input, roles) {
		if (!input) return null;
		let foundId;
		let matches = input.match(/^<@&(\d+)>$/);
		if (!matches) {
			let roleFromNonMention = roles.find(role => role.name.toLowerCase() === input.toLowerCase()) || roles.get(input) || null;
			if (roleFromNonMention) foundId = roleFromNonMention.id;
			else {
				let nearMatch = nearMatchCollection(roles, input);
				if (nearMatch) return nearMatch;
			}
		} else foundId = matches[1];

		return roles.get(foundId) || null;
	},
	/**
	 * Finds a channel based on an input
	 * @param input {String} - Channel mention, name, or ID
	 * @param channels - Represents a guild's channels cache
	 * @returns {Promise<null|*>}
	 */
	findChannel: async function (input, channels) {
		if (!input) return null;
		let foundId;
		let matches = input.match(/^<#(\d+)>$/);
		if (!matches) {
			let channelFromNonMention = channels.find(channel => channel.name.toLowerCase() === input.toLowerCase()) || channels.get(input) || null;
			if (channelFromNonMention) foundId = channelFromNonMention.id;
			else {
				let nearMatch = nearMatchCollection(channels, input);
				if (nearMatch) return nearMatch;
			}
		} else foundId = matches[1];

		return channels.get(foundId) || null;
	},
	/**
	 * Finds an emoji based on an input
	 * @param input {String} - Emoji
	 * @param emotes - Represents a guild's emoji cache
	 * @returns {Promise<null|*>}
	 */
	findEmoji: async function (input, emotes) {
		if (!input) return [null, null];
		if (nodeEmoji.find(input)) return [input, input];
		let matches = input.match(/<a?:[a-z0-9_~-]+:([0-9]+)>/i) || null;
		if (!matches) return [null, null];
		let emote = emotes.get(matches[1]) || null;
		if (emote) return [`${emote.animated ? "a:" : ""}${emote.name}:${emote.id}`, `<${emote.animated ? "a:" : ":"}${emote.name}:${emote.id}>`];
		else return [null, null];
	},
	handleRoleInput: async function (locale, action, input, roles, name, present_string, success_string, no_more_string, force) {
		const { findRole } = require("./config");
		if (!input) return string(locale, "CFG_NO_ROLE_SPECIFIED_ERROR", {}, "error");
		let role = await findRole(input, roles);
		if (!role) return string(locale, "CFG_INVALID_ROLE_ERROR", {}, "error");
		let db = await role.guild.db;
		let current = db.config[name];
		switch (action) {
		case "add":
			if (!force && ["admin_roles", "staff_roles"].includes(name) && role.id === role.guild.id) return "CONFIRM";
			if (current.includes(role.id)) return string(locale, present_string, {}, "error");
			current.push(role.id);
			await dbModify("Server", {id: role.guild.id}, db);
			return string(locale, success_string, { role: role.name }, "success");
		case "remove":
			if (!current.includes(role.id)) return string(locale, present_string, {}, "error");
			current.splice(current.findIndex(r => r === role.id), 1);
			await dbModify("Server", {id: role.guild.id}, db);
			return `${string(locale, success_string, { role: role.name }, "success")} ${no_more_string && current.length === 0 ? string(locale, no_more_string) : ""}`;
		}
	},
	handleChannelInput: async function (locale, input, server, current_name, check_perms, done_str, reset_str) {
		const { findChannel } = require("./config");
		const { channelPermissions } = require("./checks");
		if (!input) return string(locale, "CFG_NO_CHANNEL_SPECIFIED_ERROR", {}, "error");
		let qServerDB = await server.db;
		if (reset_str && (input === "none" || input === "reset")) {
			qServerDB.config.channels[current_name] = "";
			if (current_name === "log" && qServerDB.config.loghook && qServerDB.config.loghook.id && qServerDB.config.loghook.token) {
				server.client.fetchWebhook(qServerDB.config.loghook.id, qServerDB.config.loghook.token).then(hook => hook.delete(string(locale, "REMOVE_LOG_CHANNEL"))).catch(() => {});
				qServerDB.config.loghook = {};
			}
			await dbModify("Server", {id: server.id}, qServerDB);

			return string(locale, reset_str, {}, "success");
		}
		let channel = await findChannel(input, server.channels.cache);
		if (!channel || !["text", "news", 0, 5].includes(channel.type)) return string(locale, "CFG_INVALID_CHANNEL_ERROR", {}, "error");
		let permissions = await channelPermissions(locale, check_perms, channel, server.client);
		if (permissions) return permissions;
		qServerDB.config.channels[current_name] = channel.id;
		if (current_name === "log") {
			if (qServerDB.config.loghook && qServerDB.config.loghook.id && qServerDB.config.loghook.token) {
				server.client.fetchWebhook(qServerDB.config.loghook.id, qServerDB.config.loghook.token).then(hook => hook.delete(string(locale, "REMOVE_LOG_CHANNEL"))).catch(() => {});
				qServerDB.config.loghook = {};
			}
			try {
				let webhook = await channel.createWebhook("Suggester Logs", {
					avatar: server.client.user.displayAvatarURL({format: "png"}),
					reason: string(locale, "CREATE_LOG_CHANNEL")
				});

				qServerDB.config.loghook = {
					id: webhook.id,
					token: webhook.token
				};
			} catch (err) {
				return string(locale, "CFG_WEBHOOK_CREATION_ERROR", {}, "error");
			}
		}
		await dbModify("Server", {id: server.id}, qServerDB);
		return string(locale, done_str, { channel: `<#${channel.id}>` }, "success");
	}
};
