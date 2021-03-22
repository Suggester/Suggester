const { suggestionEmbed, fetchUser, dmEmbed } = require("./misc");
const { dbQuery, dbQueryAll } = require("./db");
const { string } = require("./strings");
const { emoji } = require("../config.json");
const Discord = require("discord.js");
module.exports = {
	editFeedMessage: async function({ guild, user }, qSuggestionDB, qServerDB, client, removereactions=false) {
		let suggestionEditEmbed = await suggestionEmbed(guild, qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.cache.get(qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			qServerDB.config.feed_ping_role ? f.edit(qServerDB.config.feed_ping_role === qServerDB.id ? "@everyone" : `<@&${qServerDB.config.feed_ping_role}>`, { embed: suggestionEditEmbed, disableMentions: "none" }) : f.edit(suggestionEditEmbed);
			if (removereactions) f.reactions.removeAll();
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return string(user, "SUGGESTION_FEED_MESSAGE_NOT_EDITED_ERROR", {}, "error");
	},
	deleteFeedMessage: async function(locale, qSuggestionDB, qServerDB, client) {
		let messageDeleted;
		await client.channels.cache.get(qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
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
		else if (!options && options.keepReactions && message.channel.type !== "dm") msg.reactions.removeAll();

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

		if (message.channel.type === "dm" || !message.channel.permissionsFor(message.client.user.id).has("MANAGE_MESSAGES")) removeReaction = false;

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
		if (content[page] instanceof Discord.MessageEmbed) content[page].author.name = content[page].author.name.replace("{{current}}", page+1).replace("{{total}}", content.length.toString());
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
				msg.edit(string(locale, "CLOSED", {}, "error"), {embed: null});
				collector.stop();
				return;
			}
			if (msg) {
				if (content[page] instanceof Discord.MessageEmbed) {
					content[page].author.name = content[page].author.name.replace("{{current}}", page+1).replace("{{total}}", content.length.toString());
					msg.edit({ embed: content[page] });
				}
				else msg.edit(content[page]);
			}
		});
		collector.on("end", () => {
			msg.reactions.removeAll();
		});
	},
	checkVotes: function(locale, qSuggestionDB, msg) {
		if (!msg || !msg.reactions || !msg.reactions.cache) return [null, null, null];
		const nodeEmoji = require("node-emoji");
		function getEmoji (input) {
			if (input === "none") return null;
			else if (nodeEmoji.find(input)) return input;
			else return input.match(/[a-zA-Z0-9-_]+:([0-9]+)/)[1] || null;
		}
		let upCount;
		let downCount;
		let upReaction = msg.reactions.cache.get(getEmoji(qSuggestionDB.emojis.up));
		let downReaction = msg.reactions.cache.get(getEmoji(qSuggestionDB.emojis.down));
		if (qSuggestionDB.emojis.up !== "none" && upReaction) upCount = upReaction.me || upReaction.users.resolve(msg.client.user.id) ? upReaction.count-1 : upReaction.count;
		if (qSuggestionDB.emojis.down !== "none" && downReaction) downCount = downReaction.me || downReaction.users.resolve(msg.client.user.id) ? downReaction.count-1 : downReaction.count;
		if (upCount && !downCount) downCount = 0;
		if (downCount && !upCount) upCount = 0;
		return [upCount, downCount, upCount-downCount];
	},
	notifyFollowers: async function(client, db, suggestion, color, title, attachment, suggestions, reason, efn, sendOps={follow: true, author: true}) {
		if (!db.config.notify) return;
		let suggester = await dbQuery("User", { id: suggestion.suggester });
		if (sendOps.author && suggester.notify) {
			let u = await fetchUser(suggestion.suggester, client);
			let uEmbed = dmEmbed(u.locale || db.config.locale, client, suggestion, color, title, attachment, suggestions, reason);
			if (efn) uEmbed = efn(uEmbed, u.locale || db.config.locale);
			if (u && u.id !== "0") u.send(uEmbed).catch(() => {});
		}
		if (!sendOps.follow || !db.config.auto_subscribe) return;
		let followers = await dbQueryAll("User", { subscribed: {$elemMatch: { id: suggestion.suggestionId, guild: suggestion.id } } });
		title.string += "_FOLLOW";
		for await (let fid of followers) {
			if (fid.id === suggestion.suggester || !fid.notify) continue;
			let f = await fetchUser(fid.id, client);
			if (fid.subscribed.find(s => s.id === suggestion.suggestionId && s.guild === suggestion.id).auto && !fid.auto_subscribe) continue;
			let fEmbed = dmEmbed(fid.locale || db.config.locale, client, suggestion, color, title, attachment, suggestions, reason);
			if (efn) fEmbed = efn(fEmbed, fid.locale || db.config.locale);
			if (f && f.id !== "0") f.send(fEmbed).catch(() => {});
		}
	},
	cleanCommand: async function(message, response, db, nc) {
		if (!message.guild) return;
		if ((db.config.clean_suggestion_command || nc) && message.channel.permissionsFor(message.client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
			message.delete();
			response.delete();
		}, 7500);
	}
};
