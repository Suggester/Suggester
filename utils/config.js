const nodeEmoji = require("node-emoji");
const { findBestMatch } = require("string-similarity");

module.exports = {
	/**
	 * Finds a role based on an input
	 * @param input {String} - Role mention, name, or ID
	 * @param roles - Represents a guild's roles cache
	 * @returns {Promise<null|*>}
	 */
	async findRole(input, roles) {
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
	async findChannel(input, channels) {
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
	async findEmoji(input, emotes) {
		if (!input) return [null, null];
		if (nodeEmoji.find(input)) return [input, input];
		let matches = input.match(/<a?:[a-z0-9_~-]+:([0-9]+)>/i) || null;
		if (!matches) return [null, null];
		let emote = emotes.get(matches[1]) || null;
		if (emote) return [`${emote.animated ? "a:" : ""}${emote.name}:${emote.id}`, `<${emote.animated ? "a:" : ":"}${emote.name}:${emote.id}>`];
		else return [null, null];
	},
	/**
	 * Find something in a collection with near matching strings
	 * @param collection - Call .cache on it first
	 * @param words - The string containing a potential string match
	 */
	nearMatchCollection: function (collection, words) {
		let array = collection.array();
		let nameArray = array.map((r) => r.name.toLowerCase());

		let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(words.toLowerCase(), nameArray);

		if (rating < .3) return null;
		return array[bestMatchIndex];
	}
};