const { suggestionEmbed } = require("./misc");
const { string } = require("./strings");
const { emoji } = require("../config.json");
const Discord = require("discord.js");
module.exports = {
	editFeedMessage: async function(qSuggestionDB, qServerDB, client) {
		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return string("SUGGESTION_FEED_MESSAGE_NOT_EDITED_ERROR", {}, "error");
	},
	/**
	 * Ask for confirmation before proceeding
	 * @param {Message} message Discord.js message object
	 * @param {string} confirmationMessage Ask for confirmation
	 * @param {ConfirmationOptions} [options] Options
	 * @param {string} [options.confirmMessage] Edit the message upon confirmation
	 * @param {string | MessageEmbed} [options.denyMessage] Edit the message upon denial
	 * @param {number} options.time Timeout
	 * @param {boolean} [options.keepReactions] Keep reactions after reacting
	 * @param {boolean} [options.deleteAfterReaction] Delete the message after reaction (takes priority over all other messages)
	 * @example
	 * const confirmationMessage: string = "Are you sure you would like to stop the bot?"
	 * const options = {
	 *   confirmMessage: "Shutting down...",
	 *   denyMessage: "Shutdown cancelled."
	 * }
	 *
	 * const proceed = await confirmation(message, confirmationMessage, options)
	 *
	 * if (proceed) process.exit(0)
	 */
	confirmation: async function (message, confirmationMessage = {}, options = {}) {
		const yesReaction = emoji.check;
		const noReaction = emoji.x;
		const yesId = yesReaction.match(/[a-zA-Z0-9-_]+:([0-9]+)/)[1];
		const noId = noReaction.match(/[a-zA-Z0-9-_]+:([0-9]+)/)[1];

		const filter = ({emoji: {id}}, {id: uid}) => (id === yesId || id === noId) && uid === message.author.id;

		const msg = await message.channel.send(confirmationMessage);

		await msg.react(yesReaction);
		await msg.react(noReaction);

		const e = (await msg.awaitReactions(filter, {max: 1, time: options && options.time || 300000})).first();

		if (options && options.deleteAfterReaction) msg.delete();
		else if (!options && options.keepReactions) msg.reactions.removeAll();

		if (e && e.emoji && e.emoji.id === yesId) {
			if (options && options.confirmMessage && !options.deleteAfterReaction) await msg.edit(options && options.confirmMessage instanceof Discord.MessageEmbed ? {
				embed: options && options.confirmMessage,
				content: null
			} : {embed: null, content: options && options.confirmMessage});
			return true;
		} else {
			if (options && options.denyMessage && !options.deleteAfterReaction) await msg.edit(options && options.denyMessage instanceof Discord.MessageEmbed ? {
				embed: options && options.denyMessage,
				content: null
			} : {embed: null, content: options && options.denyMessage});
			return false;
		}
	}
};