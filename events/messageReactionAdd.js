const { dbQueryNoNew, dbQuery } = require("../utils/db");
const { editFeedMessage } = require("../utils/actions");
const { checkPermissions, channelPermissions } = require("../utils/checks");
const { reviewEmbed, fetchUser } = require("../utils/misc");
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
			if (qUserDB.auto_subscribe && db.config.notify && db.config.auto_subscribe) {
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
		if (awaiting) {
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
			let qUserDB = await dbQuery("User", {id: user.id});
			let locale = qUserDB.locale || db.config.locale || "en";
			if (command.controls.permissions) {
				let checkPerms = channelPermissions(locale, command.controls.permissions, messageReaction.message.channel, client);
				if (checkPerms) {
					return messageReaction.message.channel.send(checkPerms).catch(() => {
					});
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
		} else {
			let edit = await dbQueryNoNew("Suggestion", { id: messageReaction.message.guild.id, "pending_edit.messageid": messageReaction.message.id });
			if (edit) {
				let emotes = [{
					emoji: edit.pending_edit.reviewEmojis.approve.match(/a?:?.+:(\d+)/) ? edit.pending_edit.reviewEmojis.approve.match(/a?:?.+:(\d+)/)[1] : edit.pending_edit.reviewEmojis.approve,
					cmd: "approveedit"
				}, {
					emoji: edit.pending_edit.reviewEmojis.deny.match(/a?:?.+:(\d+)/) ? edit.pending_edit.reviewEmojis.deny.match(/a?:?.+:(\d+)/)[1] : edit.pending_edit.reviewEmojis.deny,
					cmd: "denyedit"
				}];
				if (!emotes.map(e => e.emoji).includes(nodeEmoji.hasEmoji(messageReaction.emoji.name) ? messageReaction.emoji.name : messageReaction.emoji.id)) return;
				let permission = await checkPermissions(messageReaction.message.guild.members.cache.get(user.id), client);
				let commandName = emotes.find(e => e.emoji === (nodeEmoji.hasEmoji(messageReaction.emoji.name) ? messageReaction.emoji.name : messageReaction.emoji.id)).cmd;
				let command = require(`../commands/review/${commandName}`);
				if (!command.controls.enabled || command.controls.permission < permission) return messageReaction.users.remove(user.id);
				let qUserDB = await dbQuery("User", {id: user.id});
				let locale = qUserDB.locale || db.config.locale || "en";
				if (command.controls.permissions) {
					let checkPerms = channelPermissions(locale, command.controls.permissions, messageReaction.message.channel, client);
					if (checkPerms) {
						return messageReaction.message.channel.send(checkPerms).catch(() => {
						});
					}
				}
				messageReaction.message.author = user;
				try {
					command.do(locale, messageReaction.message, client, [edit.suggestionId], Discord, true)
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
				/*let suggester = await fetchUser(edit.suggester, client);
				switch (action) {
				case "approve":
					// eslint-disable-next-line no-case-declarations
					let embedReview = reviewEmbed(db.config.locale, {
						suggestionId: edit.suggestionId,
						suggestion: edit.pending_edit.content,
						submitted: edit.submitted,
						attachment: edit.attachment,
						edit: true
					}, suggester, "green", string(db.config.locale, "APPROVED_BY", { user: user.tag }));
					client.channels.cache.get(edit.pending_edit.channelid || db.config.channels.staff).messages.fetch(edit.pending_edit.messageid).then(fetched => {
						fetched.edit(embedReview);
						fetched.reactions.removeAll();
					}).catch(() => {});

					edit.edited_by = null;
					edit.suggestion = edit.pending_edit.content;
					edit.pending_edit = {};
					edit.save();

					// eslint-disable-next-line no-case-declarations
					let editFeed = await editFeedMessage({ guild: db.config.locale, user: locale }, edit, db, client);
					if (editFeed) return messageReaction.message.channel.send(editFeed);
					break;
				case "deny":
					// eslint-disable-next-line no-case-declarations
					let embedReviewDeny = reviewEmbed(db.config.locale, {
						suggestionId: edit.suggestionId,
						suggestion: edit.pending_edit.content,
						submitted: edit.submitted,
						attachment: edit.attachment,
						edit: true
					}, suggester, "red", string(db.config.locale, "DENIED_BY", { user: user.tag }));
					client.channels.cache.get(edit.pending_edit.channelid || db.config.channels.staff).messages.fetch(edit.pending_edit.messageid).then(fetched => {
						fetched.edit(embedReviewDeny);
						fetched.reactions.removeAll();
					}).catch(() => {});
					edit.edited_by = null;
					edit.suggestion = edit.pending_edit.content;
					edit.pending_edit = {};
					edit.save();
					break;
				}*/
			}
		}
	}
};
