const { string } = require("../../utils/strings");
const { fetchUser, suggestionEmbed, logEmbed, reviewEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbModify, dbQueryNoNew } = require("../../utils/db");
const { notifyFollowers } = require("../../utils/actions");
const { baseConfig, checkSuggestions, checkReview } = require("../../utils/checks");
const { cleanCommand } = require("../../utils/actions");
const { actCard, trelloComment } = require("../../utils/trello");
module.exports = {
	controls: {
		name: "approve",
		permission: 3,
		aliases: ["accept", "yes"],
		usage: "approve [suggestion id] (comment)",
		description: "Approves a suggestion",
		image: "images/Approve.gif",
		examples: "`{{p}}approve 1`\nApproves suggestion #1\n\n`{{p}}approve 1 This is a comment`\nApproves suggestion #1 and adds a comment from the approver saying \"This is a comment\"",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		cooldownMessage: "Need to approve multiple suggestions? Try the `mapprove` command!",
		docs: "staff/approve"
	},
	do: async (locale, message, client, args, Discord, noCommand=false) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);
		let guildLocale = qServerDB.config.locale;

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string(locale, "MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(string(locale, "INVALID_SUGGESTION_ID_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		let checkSuggest = checkSuggestions(locale, message.guild, qServerDB, qSuggestionDB);
		if (checkSuggest) return message.channel.send(checkSuggest).then(sent => cleanCommand(message, sent, qServerDB));

		let id = qSuggestionDB.suggestionId;
		if (qSuggestionDB.status !== "awaiting_review") {
			switch (qSuggestionDB.status) {
			case "approved":
				return message.channel.send(string(locale, "SUGGESTION_ALREADY_APPROVED_APPROVE_ERROR", { prefix: qServerDB.config.prefix, id: id.toString() }, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			case "denied":
				return message.channel.send(string(locale, "SUGGESTION_ALREADY_DENIED_APPROVE_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			}
		}

		let isComment = args.slice(1).join(" ").trim();
		let comment;
		if (isComment) {
			comment = args.splice(1).join(" ");
			if (comment.length > 1024) return message.channel.send(string(locale, "COMMENT_TOO_LONG_ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));
			let trello_comment = await trelloComment(qServerDB, message.author, qSuggestionDB, comment);
			qSuggestionDB.comments = [{
				comment: comment,
				author: message.author.id,
				id: 1,
				created: new Date(),
				trello_comment
			}];
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error")).then(sent => cleanCommand(message, sent, qServerDB));

		qSuggestionDB.status = "approved";
		qSuggestionDB.staff_member = message.author.id;

		if (qSuggestionDB.reviewMessage && (qSuggestionDB.channels.staff || qServerDB.config.channels.staff)) {
			let checkStaff = checkReview(locale, message.guild, qServerDB, qSuggestionDB);
			if (checkStaff) return message.channel.send(checkStaff);
			let returned = await client.channels.cache.get(qSuggestionDB.channels.staff || qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => {
				fetched.edit((reviewEmbed(guildLocale, qSuggestionDB, suggester, "green", string(guildLocale, "APPROVED_BY", { user: message.author.tag }))));
				fetched.reactions.removeAll();
			}).catch(() => {});
			if (returned) return;
		}

		await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, qSuggestionDB);

		if (!noCommand) {
			let replyEmbed = new Discord.MessageEmbed()
				.setTitle(string(locale, "SUGGESTION_APPROVED_TITLE"))
				.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setFooter(string(locale, "APPROVED_BY", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(qSuggestionDB.suggestion || string(locale, "NO_SUGGESTION_CONTENT"))
				.setColor(client.colors.green);
			isComment ? replyEmbed.addField(string(locale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), comment) : "";

			if (qSuggestionDB.attachment) {
				replyEmbed.addField(string(locale, "WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
					.setImage(qSuggestionDB.attachment);
			}

			await message.channel.send(replyEmbed).then(sent => cleanCommand(message, sent, qServerDB));
		}

		let embedSuggest = await suggestionEmbed(guildLocale, qSuggestionDB, qServerDB, client);
		client.channels.cache.get(qServerDB.config.channels.suggestions).send(qServerDB.config.feed_ping_role ? (qServerDB.config.feed_ping_role === message.guild.id ? "@everyone" : `<@&${qServerDB.config.feed_ping_role}>`) : "", { embed: embedSuggest, disableMentions: "none" }).then(async posted => {
			qSuggestionDB.messageId = posted.id;
			qSuggestionDB.channels.suggestions = posted.channel.id;
			if (qServerDB.config.react) {
				client.reactInProgress = true;
				let reactEmojiUp = qServerDB.config.emojis.up;
				let reactEmojiMid = qServerDB.config.emojis.mid;
				let reactEmojiDown = qServerDB.config.emojis.down;
				if (reactEmojiUp !== "none") await posted.react(reactEmojiUp).catch(async () => {
					await posted.react("👍");
					reactEmojiUp = "👍";
				});
				if (reactEmojiMid !== "none") await posted.react(reactEmojiMid).catch(async () => {
					await posted.react("🤷");
					reactEmojiMid = "🤷";
				});
				if (reactEmojiDown !== "none") await posted.react(reactEmojiDown).catch(async () => {
					await posted.react("👎");
					reactEmojiDown = "👎";
				});
				qSuggestionDB.emojis = {
					up: reactEmojiUp,
					mid: reactEmojiMid,
					down: reactEmojiDown
				};
			}
			await dbModify("Suggestion", { suggestionId: id, id: message.guild.id }, qSuggestionDB);
			client.reactInProgress = false;
			await notifyFollowers(client, qServerDB, qSuggestionDB, "green", { string: "APPROVED_DM_TITLE", guild: message.guild.name }, qSuggestionDB.attachment, qServerDB.config.channels.suggestions, null, function(e, l) {
				if (comment) e.addField(string(l, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), comment);
				return e;
			});
		});

		if (qServerDB.config.approved_role && message.guild.roles.cache.get(qServerDB.config.approved_role) && message.guild.members.cache.get(suggester.id) && message.guild.me.permissions.has("MANAGE_ROLES")) await message.guild.members.cache.get(suggester.id).roles.add(qServerDB.config.approved_role, string(locale, "SUGGESTION_APPROVED_TITLE"));

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "APPROVED_LOG", "green")
				.setDescription(qSuggestionDB.suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));
			isComment ? embedLog.addField(string(guildLocale, "COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), comment) : "";
			if (qSuggestionDB.attachment) {
				embedLog.addField(string(guildLocale, "WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
					.setImage(qSuggestionDB.attachment);
			}

			serverLog(embedLog, qServerDB, client);
		}

		await actCard("approve", qServerDB, qSuggestionDB, suggester, string(guildLocale, "APPROVED_BY", { user: message.author.tag }));

		return { protip: { command: "approve", not: [comment ? "approve_reason" : null] } };
	}
};
