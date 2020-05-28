const { colors } = require("../../config.json");
const { string } = require("../../utils/strings");
const { fetchUser, suggestionEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbQuery, dbModify, dbQueryNoNew } = require("../../utils/db");
const { checkConfig, channelPermissions } = require("../../utils/checks");
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
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(string("UNCONFIGURED_ERROR", {}, "error"));

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string("MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error"));

		let missingConfig = await checkConfig(qServerDB);
		if (missingConfig) return message.channel.send(missingConfig);

		if (client.channels.cache.get(qServerDB.config.channels.suggestions)) {
			let perms = channelPermissions( "suggestions", client.channels.cache.get(qServerDB.config.channels.suggestions), client);
			if (perms) return message.channel.send(perms);
		} else return message.channel.send(string("NO_SUGGESTION_CHANNEL_ERROR", {}, "error"));

		if (client.channels.cache.get(qServerDB.config.channels.staff)) {
			let perms = channelPermissions( "staff", client.channels.cache.get(qServerDB.config.channels.staff), client);
			if (perms) return message.channel.send(perms);
		} else return message.channel.send(string("NO_REVIEW_CHANNEL_ERROR", {}, "error"));

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
			if (qServerDB.config.notify && qUserDB.notify) {
				let dmEmbed = new Discord.MessageEmbed()
					.setTitle(string("APPROVED_DM_TITLE", { server: message.guild.name }))
					.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }))
					.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${posted.id})`)
					.setTimestamp()
					.setColor(colors.green);
				isComment ? replyEmbed.addField(string("COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), comment) : "";
				qSuggestionDB.attachment ? dmEmbed.setImage(qSuggestionDB.attachment) : "";
				suggester.send(dmEmbed).catch(() => {});
			}

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
			let logEmbed = new Discord.MessageEmbed()
				.setAuthor(string("APPROVED_LOG", { user: message.author.tag, id: id.toString() }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.addField(string("SUGGESTION_HEADER"), qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
				.setFooter(string("LOG_SUGGESTION_SUBMITTED_FOOTER", { id: id.toString(), user: message.author.id }))
				.setTimestamp()
				.setColor(colors.green);
			isComment ? replyEmbed.addField(string("COMMENT_TITLE", { user: message.author.tag, id: `${id.toString()}_1` }), comment) : "";

			if (qSuggestionDB.attachment) {
				logEmbed.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
					.setImage(qSuggestionDB.attachment);
			}

			serverLog(logEmbed, qServerDB, client);
		}

		let updateEmbed = new Discord.MessageEmbed()
			.setTitle(string("SUGGESTION_REVIEW_EMBED_TITLE", { id: id.toString() }))
			.setAuthor(string("USER_INFO_HEADER", { user: message.author.tag, id: message.author.id }), message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion)
			.setColor(colors.green)
			.addField(string("SUGGESTION_CHANGE_REVIEW_EMBED"), string("APPROVED_BY", { user: message.author.tag }));

		if (qSuggestionDB.attachment) {
			updateEmbed.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}

		client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit(updateEmbed)).catch(() => {});
	}
};
