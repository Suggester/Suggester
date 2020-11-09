const { dbQueryNoNew, dbQuery } = require("../utils/db");
const { editFeedMessage } = require("../utils/actions");
const { checkPermissions, channelPermissions } = require("../utils/checks");
const { string } = require("../utils/strings");
const { prefix } = require("../config.json");
const { errorLog } = require("../utils/logs");
module.exports = async (Discord, client, messageReaction, user) => {
	if (user.id === client.user.id) return;
	const nodeEmoji = require("node-emoji");
	if (messageReaction.message.partial) messageReaction.message = await messageReaction.message.fetch();
	let db = await messageReaction.message.guild.db;

	await messageReaction.message.guild.members.fetch(user.id).catch(() => {});
	let suggestion = await dbQueryNoNew("Suggestion", { id: messageReaction.message.guild.id, messageId: messageReaction.message.id });
	if (suggestion) {
		let emotes = [suggestion.emojis.up.match(/a?:?.+:(\d+)/) ? suggestion.emojis.up.match(/a?:?.+:(\d+)/)[1] : suggestion.emojis.up, suggestion.emojis.mid.match(/a?:?.+:(\d+)/) ? suggestion.emojis.mid.match(/a?:?.+:(\d+)/)[1] : suggestion.emojis.mid, suggestion.emojis.down.match(/a?:?.+:(\d+)/) ? suggestion.emojis.down.match(/a?:?.+:(\d+)/)[1] : suggestion.emojis.down];
		if (!emotes.includes(nodeEmoji.hasEmoji(messageReaction.emoji.name) ? messageReaction.emoji.name : messageReaction.emoji.id)) return;
		if (db.config.voting_roles.length > 0 && !db.config.voting_roles.some(r => messageReaction.message.guild.members.cache.get(user.id).roles.cache.has(r))) return messageReaction.users.remove(user.id);
		if (!db.config.reactionOptions.suggester && user.id === suggestion.suggester) return messageReaction.users.remove(user.id);
		for await (let users of messageReaction.message.reactions.cache.map(r => r.users)) await users.fetch();
		if (db.config.reactionOptions.one && emotes.filter(r => messageReaction.message.reactions.cache.get(r) && messageReaction.message.reactions.cache.get(r).users.cache.has(user.id)).length >= 2) return messageReaction.users.remove(user.id);
		if (emotes.findIndex(i => i === (nodeEmoji.hasEmoji(messageReaction.emoji.name) ? messageReaction.emoji.name : messageReaction.emoji.id)) === 0) {
			let qUserDB = await dbQuery("User", { id: user.id });
			let locale = qUserDB.locale || db.config.locale || "en";
			if (qUserDB.auto_subscribe && db.config.notify) {
				if (!qUserDB.notify) {
					qUserDB.auto_subscribe = false;
					qUserDB.save();
				} else if (!qUserDB.subscribed.includes(suggestion.suggestionId)) {
					if (!qUserDB.notified_about_auto) user.send(string(locale, "AUTOFOLLOW_FIRST_NOTIF", { suggestion: suggestion.suggestionId.toString(), server: messageReaction.message.guild.name, prefix: db.config.prefix || prefix })).then(() => {
						qUserDB.subscribed.push({
							id: suggestion.suggestionId,
							guild: db.id,
							auto: true
						});
						qUserDB.notified_about_auto = true;
						qUserDB.save();
					}).catch(() => {
						qUserDB.auto_subscribe = false;
						qUserDB.notify = false;
						qUserDB.save();
					});
					else {
						qUserDB.subscribed.push({
							id: suggestion.suggestionId,
							guild: db.id,
							auto: true
						});
						qUserDB.save();
					}
				}
			}
		}
		await editFeedMessage({guild: db.config.locale}, suggestion, db, client);
	} else {
		let awaiting = await dbQueryNoNew("Suggestion", { id: messageReaction.message.guild.id, reviewMessage: messageReaction.message.id, status: "awaiting_review" });
		if (!awaiting) return;
		let emotes = [{
			emoji: awaiting.reviewEmojis.approve.match(/a?:?.+:(\d+)/) ? awaiting.reviewEmojis.approve.match(/a?:?.+:(\d+)/)[1] : awaiting.reviewEmojis.approve,
			cmd: "approve"
		}, {
			emoji: awaiting.reviewEmojis.deny.match(/a?:?.+:(\d+)/) ? awaiting.reviewEmojis.deny.match(/a?:?.+:(\d+)/)[1] : awaiting.reviewEmojis.deny,
			cmd: "deny"
		}];
		if (!emotes.map(e => e.emoji).includes(nodeEmoji.hasEmoji(messageReaction.emoji.name) ? messageReaction.emoji.name : messageReaction.emoji.id)) return;
		let commandName = emotes.find(e => e.emoji === (nodeEmoji.hasEmoji(messageReaction.emoji.name) ? messageReaction.emoji.name : messageReaction.emoji.id)).cmd;
		let command = require(`../commands/review/${commandName}`);
		let permission = await checkPermissions(messageReaction.message.guild.members.cache.get(user.id), client);
		if (!command.controls.enabled || command.controls.permission < permission) return messageReaction.users.remove(user.id);
		let qUserDB = await dbQuery("User", { id: user.id });
		let locale = qUserDB.locale || db.config.locale || "en";
		if (command.controls.permissions) {
			let checkPerms = channelPermissions(locale, command.controls.permissions, messageReaction.message.channel, client);
			if (checkPerms) {
				return messageReaction.message.channel.send(checkPerms).catch(() => {});
			}
		}
		messageReaction.message.author = user;
		try {
			command.do(locale, messageReaction.message, client, [awaiting.suggestionId], Discord, true)
				.catch((err) => {
					let errorText;
					if (err.stack) errorText = err.stack;
					else if (err.error) errorText = err.error;
					messageReaction.message.channel.send(`${string(locale, "ERROR", {}, "error")} ${client.admins.has(user.id) && errorText ? `\n\`\`\`${(errorText).length >= 1000 ? (errorText).substring(locale, 0, 1000) + " content too long..." : err.stack}\`\`\`` : ""}`);
					errorLog(err, "Command Handler", "On queue reaction");

					console.log(err);
				});

		} catch (err) {
			let errorText;
			if (err.stack) errorText = err.stack;
			else if (err.error) errorText = err.error;
			messageReaction.message.channel.send(`${string(locale, "ERROR", {}, "error")} ${client.admins.has(user.id) && errorText ? `\n\`\`\`${(errorText).length >= 1000 ? (errorText).substring(locale, 0, 1000) + " content too long..." : err.stack}\`\`\`` : ""}`);
			errorLog(err, "Command Handler", "On queue reaction");

			console.log(err);
		}
	}
};
