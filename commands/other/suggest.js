const { colors } = require("../../config.json");
const { dbQuery, dbModify, serverLog, suggestionEmbed, checkPermissions, channelPermissions, checkConfig } = require("../../coreFunctions");
const { Suggestion } = require("../../utils/schemas");
const validUrl = require("valid-url");
const { string } = require("../../utils/strings");

/**
 * Check a URL to see if it makes a valid attachment
 * @param {string} url - The string to be checked
 * @returns {boolean}
 */
function checkURL (url) {
	if (validUrl.isUri(url)){
		let noparams = url.split("?")[0];
		return (noparams.match(/\.(jpeg|jpg|gif|png)$/) != null);
	} else return false;
}

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
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(string("UNCONFIGURED_ERROR", {}, "error"));

		let missingConfig = await checkConfig(qServerDB);
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
				return message.channel.send(string("NO_ALLOWED_ROLE_ERROR", { roleList: roles.map(r => r.name).join(", ") }, "error"), {disableMentions: "everyone"}).then(sent => {
					if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
						message.delete();
						sent.delete();
					}, 7500);
				});
			}
		}

		if (qServerDB.config.channels.commands && message.channel.id !== qServerDB.config.channels.commands) return message.channel.send(string("NOT_COMMAND_CHANNEL_ERROR", { channel: `<#${qServerDB.config.channels.commands}>` }, "error"));

		let attachment = message.attachments.first() ? message.attachments.first().url : "";
		if (!args[0] && !attachment) return message.channel.send(string("NO_SUGGESTION_ERROR", {}, "error")).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});
		if (attachment && !(checkURL(attachment))) return message.channel.send(string("INVALID_AVATAR_ERROR", {}, "error")).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let suggestion = args.join(" ");

		if (suggestion.length > 1024) return message.channel.send(string("TOO_LONG_SUGGESTION_ERROR", {}, "error")).then(sent => {
			if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
				message.delete();
				sent.delete();
			}, 7500);
		});

		let id = await Suggestion.countDocuments() + 1;

		//Review
		if (qServerDB.config.mode === "review") {
			if (client.channels.cache.get(qServerDB.config.channels.staff)) {
				let perms = channelPermissions( "staff", client.channels.cache.get(qServerDB.config.channels.staff), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string("NO_REVIEW_CHANNEL_ERROR", {}, "error"));

			await new Suggestion({
				id: message.guild.id,
				suggester: message.author.id,
				suggestion: suggestion,
				status: "awaiting_review",
				suggestionId: id,
				attachment: attachment,
				submitted: new Date()
			}).save();

			let replyEmbed = new Discord.MessageEmbed()
				.setAuthor(string("SUGGESTION_FROM_TITLE", { user: message.author.tag }), message.author.displayAvatarURL({dynamic: true, format: "png"}))
				.setDescription(suggestion)
				.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }))
				.setTimestamp()
				.setColor(colors.default)
				.setImage(attachment);
			message.channel.send(string("SUGGESTION_SUBMITTED_REVIEW_SUCCESS"), replyEmbed).then(sent => {
				if (qServerDB.config.clean_suggestion_command && message.channel.permissionsFor(client.user.id).has("MANAGE_MESSAGES")) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			let reviewEmbed = new Discord.MessageEmbed()
				.setTitle(string("SUGGESTION_REVIEW_EMBED_TITLE", { id: id.toString() }))
				.setAuthor(string("USER_INFO_HEADER", { user: message.author.tag, id: message.author.id }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(suggestion)
				.setColor(colors.yellow)
				.addField(string("APPROVE_DENY_HEADER"), string("REVIEW_COMMAND_INFO", { prefix: qServerDB.config.prefix, id: id.toString(), channel: `<#${qServerDB.config.channels.suggestions}>` }));

			if (attachment) {
				reviewEmbed.addField(string("WITH_ATTACHMENT_HEADER"), attachment)
					.setImage(attachment);
			}

			let reviewMessage = await client.channels.cache.get(qServerDB.config.channels.staff).send(reviewEmbed);
			await dbModify("Suggestion", { suggestionId: id }, { reviewMessage: reviewMessage.id });

			if (qServerDB.config.channels.log) {
				let logEmbed = new Discord.MessageEmbed()
					.setAuthor(string("LOG_SUGGESTION_SUBMITTED_REVIEW_TITLE", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
					.setDescription(suggestion)
					.setFooter(string("LOG_SUGGESTION_SUBMITTED_FOOTER", { id: id.toString(), user: message.author.id }))
					.setTimestamp()
					.setColor(colors.yellow);

				if (attachment) {
					logEmbed.setImage(attachment)
						.addField(string("WITH_ATTACHMENT_HEADER"), attachment);
				}

				serverLog(logEmbed, qServerDB, client);
			}
		} else if (qServerDB.config.mode === "autoapprove") {
			if (client.channels.cache.get(qServerDB.config.channels.suggestions)) {
				let perms = channelPermissions( "suggestions", client.channels.cache.get(qServerDB.config.channels.suggestions), client);
				if (perms) return message.channel.send(perms);
			} else return message.channel.send(string("NO_SUGGESTION_CHANNEL_ERROR", {}, "error"));

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
			let embedSuggest = await suggestionEmbed(qSuggestionDB, qServerDB, client);
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
				.setAuthor(string("SUGGESTION_FROM_TITLE", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
				.setDescription(suggestion)
				.setFooter(string("SUGGESTION_FOOTER", { id: id.toString() }))
				.setTimestamp()
				.setColor(colors.default)
				.setImage(attachment);
			message.channel.send(string("SUGGESTION_SUBMITTED_AUTOAPPROVE_SUCCESS", { channel: `<#${qServerDB.config.channels.suggestions}>` }), replyEmbed).then(sent => {
				if (qServerDB.config.clean_suggestion_command) setTimeout(function() {
					message.delete();
					sent.delete();
				}, 7500);
			});

			if (qServerDB.config.channels.log) {
				let logEmbed = new Discord.MessageEmbed()
					.setAuthor(string("LOG_SUGGESTION_SUBMITTED_AUTOAPPROVE_TITLE", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
					.setDescription(suggestion)
					.setFooter(string("LOG_SUGGESTION_SUBMITTED_FOOTER", { id: id.toString(), user: message.author.id }))
					.setTimestamp()
					.setColor(colors.green);
				if (attachment) {
					logEmbed.setImage(attachment)
						.addField(string("WITH_ATTACHMENT_HEADER"), attachment);
				}
				serverLog(logEmbed, qServerDB, client);
			}
		}
	}
};
