const { emoji } = require("../../config.json");
const { suggestionEmbed, reviewEmbed, logEmbed } = require("../../utils/misc");
const { dbQuery, dbModify, dbQueryAll } = require("../../utils/db");
const { checkPermissions, channelPermissions, checkConfig, checkReview } = require("../../utils/checks");
const { serverLog } = require("../../utils/logs");
const { Suggestion } = require("../../utils/schemas");
const { checkURL } = require("../../utils/checks");
const { confirmation } = require("../../utils/actions");
const { string } = require("../../utils/strings");
const lngDetector = new (require("languagedetect"));

module.exports = {
	controls: {
		name: "suggest",
		permission: 10,
		aliases: ["submit"],
		usage: "suggest [suggestion]",
		description: "Submits a suggestion",
		image: "images/Suggest.gif",
		enabled: true,
		examples: "`{{p}}suggest This is a suggestion`\nSubmits a suggestion\n\nYou can also attach images to your suggestion by uploading an image when you send the command",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (locale, message, client, args, Discord, noCommand=false) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(string(locale, "UNCONFIGURED_ERROR", {}, "error"));
		const guildLocale = qServerDB.config.locale;

		let missingConfig = await checkConfig(locale, qServerDB, client);
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
					if ((qServerDB.config.clean_suggestion_command || noCommand) && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
						message.delete();
						sent.delete();
					}, 7500);
				});
			}
		}

		if (qServerDB.config.channels.commands && message.channel.id !== qServerDB.config.channels.commands && !noCommand) return message.channel.send(string(locale, "NOT_COMMAND_CHANNEL_ERROR", { channel: `<#${qServerDB.config.channels.commands}>` }, "error"));

		let attachment = message.attachments.first() ? message.attachments.first().url : "";
		if (args.length === 0 && !attachment) return message.channel.send(string(locale, "NO_SUGGESTION_ERROR", {}, "error")).then(sent => {
			if ((qServerDB.config.clean_suggestion_command || noCommand) && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});
		if (attachment && !(checkURL(attachment))) return message.channel.send(string(locale, "INVALID_AVATAR_ERROR", {}, "error")).then(sent => {
			if ((qServerDB.config.clean_suggestion_command || noCommand) && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let suggestion = args.join(" ");

		if (suggestion.length > 1024) return message.channel.send(string(locale, "TOO_LONG_SUGGESTION_ERROR", {}, "error")).then(sent => {
			if ((qServerDB.config.clean_suggestion_command || noCommand) && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let id = await Suggestion.countDocuments() + 1;

		//Review
		if (qServerDB.config.mode === "review") {
			let checkStaff = checkReview(locale, message.guild, qServerDB);
			if (checkStaff) return message.channel.send(checkStaff);


			if ((await dbQueryAll("Suggestion", { suggester: message.author.id, id: message.guild.id, status: "awaiting_review" })).length > 0) {
				if (!(
					await confirmation(
						message,
						string(locale, "ALREADY_AWAITING_REVIEW_CONFIRM", { check: `<:${emoji.check}>`, x: `<:${emoji.x}>` }),
						{
							deleteAfterReaction: true
						}
					))) {
					if ((qServerDB.config.clean_suggestion_command || noCommand) && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) message.delete();
					return;
				}
			}

			let newSuggestion = await new Suggestion({
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
				.setColor(client.colors.default)
				.setImage(attachment);
			message.channel.send(string(locale, "SUGGESTION_SUBMITTED_STAFF_REVIEW_SUCCESS"), replyEmbed).then(sent => {
				if ((qServerDB.config.clean_suggestion_command || noCommand) && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			let embedReview = reviewEmbed(guildLocale, qSuggestionDB, message.author, "yellow");
			embedReview.addField(string(guildLocale, "APPROVE_DENY_HEADER"), string(guildLocale, "REVIEW_COMMAND_INFO_NEW", { approve: `<:${emoji.check}>`, deny: `<:${emoji.x}>`, channel: `<#${qServerDB.config.channels.suggestions}>` }));

			let reviewMessage = await client.channels.cache.get(qServerDB.config.channels.staff).send(qServerDB.config.ping_role ? `<@&${qServerDB.config.ping_role}>` : "", embedReview);
			await reviewMessage.react(emoji.check).then(() => newSuggestion.reviewEmojis.approve = emoji.check);
			await reviewMessage.react(emoji.x).then(() => newSuggestion.reviewEmojis.deny = emoji.x);
			newSuggestion.reviewMessage = reviewMessage.id;
			await dbModify("Suggestion", { suggestionId: id }, newSuggestion);

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
			let embedSuggest = await suggestionEmbed(guildLocale, qSuggestionDB, qServerDB, client);
			client.channels.cache.get(qServerDB.config.channels.suggestions)
				.send(embedSuggest)
				.then(async (posted) => {
					qSuggestionDB.messageId = posted.id;

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
						qSuggestionDB.emojis = {
							up: reactEmojiUp,
							mid: reactEmojiMid,
							down: reactEmojiDown
						};
					}
					await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);
				});

			let replyEmbed = new Discord.MessageEmbed()
				.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(suggestion || string(locale, "NO_SUGGESTION_CONTENT"))
				.setFooter(string(locale, "SUGGESTION_FOOTER", { id: id.toString() }))
				.setTimestamp()
				.setColor(client.colors.default)
				.setImage(attachment);
			message.channel.send(string(locale, "SUGGESTION_SUBMITTED_AUTOAPPROVE_SUCCESS", { channel: `<#${qServerDB.config.channels.suggestions}>` }), replyEmbed).then(sent => {
				if ((qServerDB.config.clean_suggestion_command || noCommand) && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			if (qServerDB.config.channels.log) {
				let embedLog = logEmbed(guildLocale, qSuggestionDB, message.author, "LOG_SUGGESTION_SUBMITTED_AUTOAPPROVE_TITLE", "green")
					.setDescription(suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));
				if (attachment) {
					embedLog.setImage(attachment)
						.addField(string(guildLocale, "WITH_ATTACHMENT_HEADER"), attachment);
				}

				serverLog(embedLog, qServerDB, client);
			}
		}
		if (suggestion) {
			lngDetector.setLanguageType("iso2");
			let detected = lngDetector.detect(suggestion)[0];
			console.log(detected)
			if (detected[1] > .3 && client.locales.find(l => l.settings.code === detected[0])) {
				return { protip: { locale: detected[0], force: "locale" } };
			}
		}
	}
};
