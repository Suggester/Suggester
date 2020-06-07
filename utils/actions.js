const { suggestionEmbed } = require("./misc");
const { string } = require("./strings");
const { emoji } = require("../config.json");
const Discord = require("discord.js");
module.exports = {
	editFeedMessage: async function(locale, qSuggestionDB, qServerDB, client) {
		let suggestionEditEmbed = await suggestionEmbed(locale, qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return string(locale, "SUGGESTION_FEED_MESSAGE_NOT_EDITED_ERROR", {}, "error");
	},
	deleteFeedMessage: async function(locale, qSuggestionDB, qServerDB, client) {
		let messageDeleted;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.delete();
			messageDeleted = f;
		}).catch(() => messageDeleted = false);

		if (!messageDeleted) return [string(locale, "SUGGESTION_FEED_MESSAGE_NOT_FETCHED_ERROR", {}, "error")];
		else return [null, messageDeleted];
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
	},
	/**
	 * Paginate a message
	 * @param {Message} message Discord.js Messsage object
	 * @param {string[] | MessageEmbed[]} content The text to paginate
	 * @param {PageOptions} [options] Options for pagination
	 * @param {object} [options.emojis] Emojis to use for controls
	 * @param {string} [options.emojis.left='⬅'] The emoji used for going to the previous page
	 * @param {string} [options.emojis.end='⏹'] The emoji used for deleting the message
	 * @param {string} [options.emojis.right='➡'] The emoji used for going to the next page
	 * @param {number} [options.time=300000] How long to 'watch' for reactions
	 * @param {number} [options.startPage=0] Which page to start on (counting starts at 0)
	 * @param {boolean} [options.removeReaction=true] Remove user's reaction (note: the bot must have `MANAGE_MESSAGES`)
	 * @param {boolean} [options.hideControlsSinglePage=true] Hide the controls if there is only one page
	 * @param {boolean} [options.timeoutRemoveReactions=true] Remove the reactions after the time expires
	 * @returns {Promise<void>}
	 * @example
	 * const content: string[] = ['First page', 'Second page', 'Third page']
	 *
	 * const options: PageOptions = {
	 *   time: 150000,
	 *   startPage: 2
	 * }
	 *
	 * pages(locale, message, content, options)
	 */
	pages: async function (locale, message, content, options = {
		time: 300000,
		startPage: 0,
		hideControlsSinglePage: true,
		timeoutRemoveReactions: true,
		removeReaction: true
	}) {
		if (!(content instanceof Array)) throw new TypeError("Content is not an array");
		if (!content.length) throw new Error("Content array is empty");
		let removeReaction = options.removeReaction;

		if (!message.channel.permissionsFor(message.client.user.id).has("MANAGE_MESSAGES")) removeReaction = false;

		const emojis = {
			left: "⬅️",
			end: "⏹️",
			right: "➡️"
		};

		const time = options.time;
		const hideControlsSinglePage = options.hideControlsSinglePage;

		if (hideControlsSinglePage && content.length === 1) {
			await message.channel.send(content instanceof Discord.MessageEmbed ? { embed: content[0] } : content[0]);
			return;
		}
		const filter = (reaction, user) => (Object.values(emojis).includes(reaction.emoji.name) || Object.values(emojis).includes(reaction.emoji.id)) && !user.bot && user.id === message.author.id;

		let page = options.startPage;
		content[page].setAuthor(`Page ${page+1}/${content.length}`);
		const msg = await message.channel.send(content[page] instanceof Discord.MessageEmbed ? { embed: content[page] } : content[page]);

		for (const emoji in emojis) await msg.react(emojis[emoji]);

		const collector = msg.createReactionCollector(filter, { time: time });
		collector.on("collect", ({ users, emoji: { id, name } }, user) => {
			if (emojis.left && (id === emojis.left || name === emojis.left)) {
				page = page > 0 ? page - 1 : content.length - 1;
				if (removeReaction) users.remove(user.id);
			}
			else if (emojis.right && (id === emojis.right || name === emojis.right)) {
				page = page + 1 < content.length ? page + 1 : 0;
				if (removeReaction) users.remove(user.id);
			}
			else if (emojis.end && (id === emojis.end || name === emojis.end)) {
				msg.edit(string(locale, "CANCELLED", {}, "error"), {embed: null});
				collector.stop();
				return;
			}
			if (msg) {
				content[page].setAuthor(`Page ${page+1}/${content.length}`);
				if (content[page] instanceof Discord.MessageEmbed) msg.edit({ embed: content[page] });
				else msg.edit(content[page]);
			}
		});
		collector.on("end", () => {
			msg.reactions.removeAll();
		});
	},
	checkVotes: function(locale, qSuggestionDB, msg) {
		const nodeEmoji = require("node-emoji");
		function getEmoji (input) {
			if (nodeEmoji.find(input)) return input;
			else return input.match(/[a-zA-Z0-9-_]+:([0-9]+)/)[1] || null;
		}
		let upCount = string(locale, "UNKNOWN");
		let downCount = string(locale, "UNKNOWN");
		if (!msg || !msg.reactions || !msg.reactions.cache) return [null, null, null];
		let upReaction = msg.reactions.cache.get(getEmoji(qSuggestionDB.emojis.up));
		let downReaction = msg.reactions.cache.get(getEmoji(qSuggestionDB.emojis.down));
		if (qSuggestionDB.emojis.up !== "none" && upReaction) upCount = upReaction.me ? upReaction.count-1 : upReaction.count;
		if (qSuggestionDB.emojis.down !== "none" && downReaction) downCount = downReaction.me ? downReaction.count-1 : downReaction.count;
		return [upCount, downCount, upCount-downCount];
	}
};