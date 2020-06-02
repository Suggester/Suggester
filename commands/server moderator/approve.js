const { colors } = require("../../config.json");
const { string } = require("../../utils/strings");
const { fetchUser, suggestionEmbed, logEmbed, dmEmbed, reviewEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbQuery, dbModify, dbQueryNoNew } = require("../../utils/db");
const { baseConfig, checkSuggestions, checkReview } = require("../../utils/checks");
module.exports = {
	controls: {
		name: "approve",
		permission: 3,
		usage: "approve <suggestion id> (comment)",
		description: "Approves a suggestion",
		image: "images/Approve.gif",
		enabled: true,
		docs: "staff/approve",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5,
		cooldownMessage: "Need to approve multiple suggestions? Try the `mapprove` command!"
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return message.channel.send(returned);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string("MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error"));

		let checkSuggest = checkSuggestions(message.guild, qServerDB);
		if (checkSuggest) return message.channel.send(checkSuggest);

		let checkStaff = checkReview(message.guild, qServerDB);
		if (checkStaff) return message.channel.send(checkStaff);

		let qSuggestionDB = await dbQueryNoNew("Suggestion", { suggestionId: args[0], id: message.guild.id });
		if (!qSuggestionDB) return message.channel.send(string("INVALID_SUGGESTION_ID_ERROR", {}, "error"));

		let id = qSuggestionDB.suggestionId;
		if (qSuggestionDB.status !== "awaiting_review") {
			switch (qSuggestionDB.status) {
			case "approved":
				return message.channel.send(string("SUGGESTION_ALREADY_APPROVED_APPROVE_ERROR", { prefix: qServerDB.config.prefix, id: id.toString() }, "error"));
			case "denied":
				return message.channel.send(string("SUGGESTION_ALREADY_DENIED_APPROVE_ERROR", {}, "error"));
			}
		}

		let isComment = args[1];

		let comment;
		if (isComment) {
			comment = args.splice(1).join(" ");
			if (comment.length > 1024) return message.channel.send(string("COMMENT_TOO_LONG_ERROR", {}, "error"));
			qSuggestionDB.comments = [{
				comment: comment,
				author: message.author.id,
				id: 1,
				created: new Date()
			}];
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string("ERROR", {}, "error"));

		qSuggestionDB.status = "approved";
		qSuggestionDB.staff_member = message.author.id;
		await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string("SUGGESTION_APPROVED_TITLE"))
			.setAuthor(string("SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(string("APPROVED_BY", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
			.setColor(colors.green);
		isComment ? replyEmbed.addField(string("COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), comment) : "";

		if (qSuggestionDB.attachment) {
			replyEmbed.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}

		await message.channel.send(replyEmbed);

		let embedSuggest = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		client.channels.cache.get(qServerDB.config.channels.suggestions).send(embedSuggest).then(async posted => {
			await dbModify("Suggestion", { suggestionId: id }, { messageId: posted.id });
			let qUserDB = await dbQuery("User", { id: suggester.id });
			if (qServerDB.config.notify && qUserDB.notify) suggester.send((dmEmbed(qSuggestionDB, "green", { string: "APPROVED_DM_TITLE", guild: message.guild.name }, qSuggestionDB.attachment, qServerDB.config.channels.suggestions, isComment ? { header: string("COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), reason: comment } : null))).catch(() => {});

			if (qServerDB.config.react) {
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
				await dbModify("Suggestion", { suggestionId: id }, {
					emojis: {
						up: reactEmojiUp,
						mid: reactEmojiDown,
						down: reactEmojiDown
					}
				});
			}
		});

		if (qServerDB.config.approved_role && message.guild.roles.cache.get(qServerDB.config.approved_role) && message.guild.members.cache.get(suggester.id) && message.guild.me.permissions.has("MANAGE_ROLES")) await message.guild.members.cache.get(suggester.id).roles.add(qServerDB.config.approved_role, string("SUGGESTION_APPROVED_TITLE"));

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(qSuggestionDB, message.author, "APPROVED_LOG", "green")
				.addField(string("SUGGESTION_HEADER"), qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"));
			isComment ? embedLog.addField(string("COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), comment) : "";
			if (qSuggestionDB.attachment) {
				embedLog.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
					.setImage(qSuggestionDB.attachment);
			}

			serverLog(embedLog, qServerDB, client);
		}

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit((reviewEmbed(qSuggestionDB, suggester, "green", string("APPROVED_BY", { user: message.author.tag }))))).catch(() => {});
	}
};
