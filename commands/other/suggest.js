const { colors } = require("../../config.json");
const { suggestionEmbed, reviewEmbed, logEmbed } = require("../../utils/misc");
const { dbQuery, dbModify } = require("../../utils/db");
const { checkPermissions, channelPermissions, checkConfig } = require("../../utils/checks");
const { serverLog } = require("../../utils/logs");
const { Suggestion } = require("../../utils/schemas");
const { checkURL } = require("../../utils/checks");
const { string } = require("../../utils/strings");

module.exports = {
	controls: {
		name: "suggest",
		permission: 10,
		aliases: ["submit"],
		usage: "suggest <suggestion>",
		description: "Submits a suggestion",
		image: "images/Suggest.gif",
		enabled: true,
		docs: "all/suggest",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (locale, message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(string(locale, "UNCONFIGURED_ERROR", {}, "error"));
		const guildLocale = qServerDB.config.locale;

		let missingConfig = await checkConfig(locale, qServerDB);
		if (missingConfig) return message.channel.send(missingConfig);

		let permission = await checkPermissions(message.member, client);

		if (qServerDB.config.allowed_roles && qServerDB.config.allowed_roles.length > 0 && permission > 3) {
			if (!qServerDB.config.allowed_roles.some(r => message.member.roles.cache.has(r))) {
				let roleIds = [...new Set(qServerDB.config.allowed_roles.concat(qServerDB.config.staff_roles), qServerDB.config.admin_roles)];
				let roles = roleIds.map(roleId => {
					if (message.guild.roles.cache.get(roleId)) {
						return {
							name: message.guild.roles.cache.get(roleId).name,
							id: message.guild.roles.cache.get(roleId).id
						};
					}
				});
				return message.channel.send(string(locale, "NO_ALLOWED_ROLE_ERROR", { roleList: roles.map(r => r.name).join(", ") }, "error"), {disableMentions: "everyone"}).then(sent => {
					if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
						message.delete();
						sent.delete();
					}, 7500);
				});
			}
		}

		if (qServerDB.config.channels.commands && message.channel.id !== qServerDB.config.channels.commands) return message.channel.send(string(locale, "NOT_COMMAND_CHANNEL_ERROR", { channel: `<#${qServerDB.config.channels.commands}>` }, "error"));

		let attachment = message.attachments.first() ? message.attachments.first().url : "";
		if (!args[0] && !attachment) return message.channel.send(string(locale, "NO_SUGGESTION_ERROR", {}, "error")).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});
		if (attachment && !(checkURL(attachment))) return message.channel.send(string(locale, "INVALID_AVATAR_ERROR", {}, "error")).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let suggestion = args.join(" ");

		if (suggestion.length > 1024) return message.channel.send(string(locale, "TOO_LONG_SUGGESTION_ERROR", {}, "error")).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let id = await Suggestion.countDocuments() + 1;

		//Review
		if (qServerDB.config.mode === "review") {
			if (client.channels.cache.get(qServerDB.config.channels.staff)) {
				let perms = channelPermissions(locale,  "staff", client.channels.cache.get(qServerDB.config.channels.staff), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string(locale, "NO_REVIEW_CHANNEL_ERROR", {}, "error"));

			await new Suggestion({
				id: message.guild.id,
				suggester: message.author.id,
				suggestion: suggestion,
				status: "awaiting_review",
				suggestionId: id,
				attachment: attachment,
				submitted: new Date()
			}).save();

			let qSuggestionDB = await dbQuery("Suggestion", { suggestionId: id, id: message.guild.id });
			if (!qSuggestionDB) return message.channel.send(string(locale, "ERROR", {}, "error"));

			let replyEmbed = new Discord.MessageEmbed()
				.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", { user: message.author.tag }), message.author.displayAvatarURL({dynamic: true, format: "png"}))
				.setDescription(suggestion)
				.setFooter(string(locale, "SUGGESTION_FOOTER", { id: id.toString() }))
				.setTimestamp()
				.setColor(colors.default)
				.setImage(attachment);
			message.channel.send(string(locale, "SUGGESTION_SUBMITTED_STAFF_REVIEW_SUCCESS"), replyEmbed).then(sent => {
				if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			let embedReview = reviewEmbed(guildLocale, qSuggestionDB, message.author, "yellow");
			embedReview.addField(string(guildLocale, "APPROVE_DENY_HEADER"), string(guildLocale, "REVIEW_COMMAND_INFO", { prefix: qServerDB.config.prefix, id: id.toString(), channel: `<#${qServerDB.config.channels.suggestions}>` }));

			let reviewMessage = await client.channels.cache.get(qServerDB.config.channels.staff).send(qServerDB.config.ping_role ? `<@&${qServerDB.config.ping_role}>` : "", embedReview);
			await dbModify("Suggestion", { suggestionId: id }, { reviewMessage: reviewMessage.id });

			if (qServerDB.config.channels.log) {
				let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "LOG_SUGGESTION_SUBMITTED_REVIEW_TITLE", "yellow")
					.setDescription(suggestion || string(locale, "NO_SUGGESTION_CONTENT"));
				if (attachment) {
					embedLog.setImage(attachment)
						.addField(string(locale, "WITH_ATTACHMENT_HEADER"), attachment);
				}

				serverLog(embedLog, qServerDB, client);
			}
		} else if (qServerDB.config.mode === "autoapprove") {
			if (client.channels.cache.get(qServerDB.config.channels.suggestions)) {
				let perms = channelPermissions(locale,  "suggestions", client.channels.cache.get(qServerDB.config.channels.suggestions), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string(locale, "NO_SUGGESTION_CHANNEL_ERROR", {}, "error"));

			await new Suggestion({
				id: message.guild.id,
				suggester: message.author.id,
				suggestion: suggestion,
				status: "approved",
				suggestionId: id,
				staff_member: client.user.id,
				attachment: attachment,
				submitted: new Date()
			}).save();

			let qSuggestionDB = await dbQuery("Suggestion", { suggestionId: id });
			console.log('guild locale is', guildLocale)
			let embedSuggest = await suggestionEmbed(guildLocale, qSuggestionDB, qServerDB, client);
			client.channels.cache.get(qServerDB.config.channels.suggestions)
				.send(embedSuggest)
				.then(async (posted) => {
					await dbModify("Suggestion", { suggestionId: id }, { messageId: posted.id });

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

			let replyEmbed = new Discord.MessageEmbed()
				.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(suggestion || string(locale, "NO_SUGGESTION_CONTENT"))
				.setFooter(string(locale, "SUGGESTION_FOOTER", { id: id.toString() }))
				.setTimestamp()
				.setColor(colors.default)
				.setImage(attachment);
			message.channel.send(string(locale, "SUGGESTION_SUBMITTED_AUTOAPPROVE_SUCCESS", { channel: `<#${qServerDB.config.channels.suggestions}>` }), replyEmbed).then(sent => {
				if (qServerDB.config.clean_suggestion_command) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			if (qServerDB.config.channels.log) {
				let embedLog = logEmbed(locale, qSuggestionDB, message.author, "LOG_SUGGESTION_SUBMITTED_AUTOAPPROVE_TITLE", "green")
					.setDescription(suggestion || string(locale, "NO_SUGGESTION_CONTENT"));
				if (attachment) {
					embedLog.setImage(attachment)
						.addField(string(locale, "WITH_ATTACHMENT_HEADER"), attachment);
				}

				serverLog(embedLog, qServerDB, client);
			}
		}
	}
};
