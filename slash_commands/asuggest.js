const { emoji } = require("../config.json");
const { suggestionEmbed, reviewEmbed, logEmbed, fetchUser } = require("../utils/misc");
const { dbQuery, dbModify, dbQueryAll } = require("../utils/db");
const { checkPermissions, channelPermissions, checkConfig, checkReview } = require("../utils/checks");
const { serverLog, mediaLog } = require("../utils/logs");
const { Suggestion } = require("../utils/schemas");
const { checkURL } = require("../utils/checks");
const { string } = require("../utils/strings");
const humanizeDuration = require("humanize-duration");
const { initTrello } = require("../utils/trello");
module.exports = async function (interaction, client) {
	function respond(data) {
		client.api.interactions(interaction.id, interaction.token).callback.post({data: {
			type: 4,
			data: {
				content: data,
				flags: 64
			}
		}
		});
	}
	let qUserDB = await dbQuery("User", { id: interaction.member.user.id });
	let locale = qUserDB.locale || "en";
	if (!interaction.guild_id) return respond(string(locale, "COMMAND_SERVER_ONLY", {}, "error"));
	let qServerDB = await dbQuery("Server", { id: interaction.guild_id });
	locale = qUserDB.locale || (qServerDB ? qServerDB.config.locale : "") || "en";

	if (!qServerDB) return respond(string(locale, "UNCONFIGURED_ERROR", {}, "error"));
	const guildLocale = qServerDB.config.locale;

	if (!qServerDB.config.anon) return respond(string(locale, "CFG_ANONYMOUS_DISABLED", {}, "error"));

	let missingConfig = await checkConfig(locale, qServerDB, client);
	if (missingConfig) return respond(`${missingConfig.description}\n\n**${missingConfig.fields[0].name}**\n${missingConfig.fields[0].value}`);

	let guild = client.guilds.cache.get(interaction.guild_id);
	await guild.members.fetch(interaction.member.user.id).catch(() => {});
	let user = await fetchUser(interaction.member.user.id, client);
	let member = guild.members.cache.get(interaction.member.user.id);
	if (!member) return respond(string(locale, "ERROR", {}, "error"));
	let permission = await checkPermissions(member, client);

	if (permission > 10) return respond(string(locale, "USER_BLOCKED_SLASH_RESPONSE", {}, "error"));

	if (qServerDB.config.allowed_roles && qServerDB.config.allowed_roles.length > 0 && permission > 3) {
		console.log(qServerDB.config.allowed_roles, interaction.member.roles);
		if (!qServerDB.config.allowed_roles.some(r => interaction.member.roles.includes(r))) {
			let roleIds = [...new Set(qServerDB.config.allowed_roles.concat(qServerDB.config.staff_roles), qServerDB.config.admin_roles)];
			let roles = roleIds.map(roleId => {
				if (guild.roles.cache.get(roleId)) {
					return {
						name: guild.roles.cache.get(roleId).name,
						id: guild.roles.cache.get(roleId).id
					};
				}
			});
			return respond(string(locale, "NO_ALLOWED_ROLE_ERROR", { roleList: roles.map(r => r.name).join(", ") }, "error"), {disableMentions: "everyone"});
		}
	}

	let channels = qServerDB.config.channels.commands_new;
	if (qServerDB.config.channels.commands) channels.push(qServerDB.config.channels.commands);
	if (channels.length > 0 && !channels.includes(interaction.channel_id)) {
		return respond(string(locale, "SUBMIT_NOT_COMMAND_CHANNEL_ERROR", { channels: channels.map(c => `<#${c}>`).join(", ") }, "error"));
	}

	if (qServerDB.config.suggestion_cooldown && !qServerDB.config.cooldown_exempt.includes(interaction.member.user.id) && permission > 3) {
		let foundCooldown = (await dbQueryAll("Suggestion", { id: guild.id, suggester: interaction.member.user.id, submitted: { "$gte": new Date(Date.now()-qServerDB.config.suggestion_cooldown) } })).sort((a, b) => b.submitted - a.submitted)[0];
		if (foundCooldown) return respond(string(locale, "CUSTOM_COOLDOWN_FLAG", { time: humanizeDuration(qServerDB.config.suggestion_cooldown+(new Date(foundCooldown.submitted).getTime())-Date.now(), { language: locale, fallbacks: ["en"] }) }, "error"));
	}

	if (qServerDB.config.suggestion_cap && permission > 3) {
		if ((await dbQueryAll("Suggestion", { id: guild.id, status: "approved", implemented: false } )).length >= qServerDB.config.suggestion_cap) return respond(string(locale, "CAP_REACHED_ERROR", { cap: qServerDB.config.suggestion_cap }, "error"));
	}

	let suggestion = interaction.data.options && interaction.data.options.find(o => o.name === "suggestion") ? interaction.data.options.find(o => o.name === "suggestion").value : "";
	let attachment = interaction.data.options && interaction.data.options.find(o => o.name === "attachment") ? interaction.data.options.find(o => o.name === "attachment").value : "";

	if (!suggestion.trim() && !attachment) return respond(string(locale, "NO_SUGGESTION_ERROR", {}, "error"));
	if (attachment && !(checkURL(attachment))) return respond(string(locale, "INVALID_AVATAR_ERROR", {}, "error"));

	if (suggestion.length > 1900) return respond(string(locale, "TOO_LONG_SUGGESTION_ERROR_NEW", {}, "error"));

	let id = await Suggestion.countDocuments() + 1;

	if (attachment) {
		const res = await mediaLog({}, id, attachment)
			.catch(console.error);

		if (res && res.code === 40005) return respond(string(locale, "ATTACHMENT_TOO_BIG", {}, "error"));

		if (!res || !res.attachments || !res.attachments[0]) return respond(string(locale, "ERROR", {}, "error"));

		attachment = res.attachments[0].url;
	}

	//Review
	if (qServerDB.config.mode === "review") {
		let checkStaff = checkReview(locale, guild, qServerDB, null, null, true);
		if (checkStaff) return respond(checkStaff);

		let newSuggestion = await new Suggestion({
			id: guild.id,
			suggester: interaction.member.user.id,
			suggestion,
			status: "awaiting_review",
			suggestionId: id,
			attachment,
			submitted: new Date(),
			anon: true
		}).save();

		let qSuggestionDB = await dbQuery("Suggestion", { suggestionId: id, id: guild.id });
		if (!qSuggestionDB) return respond(string(locale, "ERROR", {}, "error"));

		respond(`${string(locale, "SUGGESTION_SUBMITTED_STAFF_REVIEW_SUCCESS", {}, "success")}\n> ${string(locale, "ANON_SUGGESTION_DISCLAIMER_SUBMIT")}`);

		let embedReview = reviewEmbed(guildLocale, qSuggestionDB, user, "yellow");
		embedReview.addField(string(guildLocale, "APPROVE_DENY_HEADER"), string(guildLocale, "REVIEW_COMMAND_INFO_NEW", { approve: `<:${emoji.check}>`, deny: `<:${emoji.x}>`, channel: `<#${qServerDB.config.channels.suggestions}>` }));

		let reviewMessage = await client.channels.cache.get(qServerDB.config.channels.staff).send(qServerDB.config.ping_role ? (qServerDB.config.ping_role === guild.id ? "@everyone" : `<@&${qServerDB.config.ping_role}>`) : "", { embed: embedReview, disableMentions: "none" });
		client.reactInProgress = true;
		await reviewMessage.react(emoji.check).then(() => newSuggestion.reviewEmojis.approve = emoji.check);
		await reviewMessage.react(emoji.x).then(() => newSuggestion.reviewEmojis.deny = emoji.x);
		newSuggestion.reviewMessage = reviewMessage.id;
		newSuggestion.channels.staff = reviewMessage.channel.id;
		await dbModify("Suggestion", { suggestionId: id, id: guild.id }, newSuggestion);
		client.reactInProgress = false;

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, user, "LOG_SUGGESTION_SUBMITTED_REVIEW_TITLE_ANON", "yellow")
				.setDescription(suggestion || string(locale, "NO_SUGGESTION_CONTENT"));
			if (attachment) {
				embedLog.setImage(attachment)
					.addField(string(locale, "WITH_ATTACHMENT_HEADER"), attachment);
			}

			serverLog(embedLog, qServerDB, client);
		}

		if (qServerDB.config.trello.board && qServerDB.config.trello.actions.find(a => a.action === "suggest")) {
			const t = initTrello();
			let c = await t.addCard(qSuggestionDB.suggestion, string(guildLocale, "SUGGESTION_TRELLO_INFO", {
				user: user.tag,
				id: interaction.member.user.id,
				sid: qSuggestionDB.suggestionId
			}), qServerDB.config.trello.actions.find(a => a.action === "suggest").id).catch(() => null);
			if (c) {
				qSuggestionDB.trello_card = c.id;
				qSuggestionDB.save();
				if (qSuggestionDB.attachment) await t.addAttachmentToCard(c.id, qSuggestionDB.attachment).then(a => {
					qSuggestionDB.trello_attach_id = a.id;
					qSuggestionDB.save();
				}).catch(() => null);
			}
		}
	} else if (qServerDB.config.mode === "autoapprove") {
		if (client.channels.cache.get(qServerDB.config.channels.suggestions)) {
			let perms = channelPermissions(locale,  "suggestions", client.channels.cache.get(qServerDB.config.channels.suggestions), client, true);
			if (perms) return respond(perms);
		} else return respond(string(locale, "NO_SUGGESTION_CHANNEL_ERROR", {}, "error"));

		let qSuggestionDB = await new Suggestion({
			id: guild.id,
			suggester: interaction.member.user.id,
			suggestion,
			status: "approved",
			suggestionId: id,
			staff_member: client.user.id,
			attachment,
			submitted: new Date(),
			anon: true
		}).save();

		let embedSuggest = await suggestionEmbed(guildLocale, qSuggestionDB, qServerDB, client);
		client.channels.cache.get(qServerDB.config.channels.suggestions)
			.send(qServerDB.config.feed_ping_role ? (qServerDB.config.feed_ping_role === guild.id ? "@everyone" : `<@&${qServerDB.config.feed_ping_role}>`) : "", { embed: embedSuggest, disableMentions: "none" })
			.then(async (posted) => {
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

				if (qServerDB.config.trello.board && qServerDB.config.trello.actions.find(a => a.action === "suggest")) {
					const t = initTrello();
					let c = await t.addCard(qSuggestionDB.suggestion, string(guildLocale, "SUGGESTION_TRELLO_INFO", {
						user: user.tag,
						id: interaction.member.user.id,
						sid: qSuggestionDB.suggestionId
					}), qServerDB.config.trello.actions.find(a => a.action === "suggest").id).catch(() => null);
					if (c) {
						qSuggestionDB.trello_card = c.id;
						if (qSuggestionDB.attachment) await t.addAttachmentToCard(c.id, qSuggestionDB.attachment).then(a => {
							qSuggestionDB.trello_attach_id = a.id;
							qSuggestionDB.save();
						}).catch(() => null);
						t.addAttachmentToCard(c.id, `https://discord.com/channels/${qSuggestionDB.id}/${qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId}`).catch(() => null);
					}
				}

				await dbModify("Suggestion", { suggestionId: id, id: guild.id }, qSuggestionDB);
				client.reactInProgress = false;
			});

		respond(`${string(locale, "SUGGESTION_SUBMITTED_AUTOAPPROVE_SUCCESS", { channel: `<#${qServerDB.config.channels.suggestions}>` }, "success")}\n> ${string(locale, "ANON_SUGGESTION_DISCLAIMER_SUBMIT")}`);

		if (qServerDB.config.channels.log) {
			let embedLog = logEmbed(guildLocale, qSuggestionDB, user, "LOG_SUGGESTION_SUBMITTED_AUTOAPPROVE_TITLE_ANON", "green")
				.setDescription(suggestion || string(guildLocale, "NO_SUGGESTION_CONTENT"));
			if (attachment) {
				embedLog.setImage(attachment)
					.addField(string(guildLocale, "WITH_ATTACHMENT_HEADER"), attachment);
			}

			serverLog(embedLog, qServerDB, client);
		}
	}
	if (suggestion) {
		if (qServerDB.config.cooldown_exempt.includes(interaction.member.user.id)) {
			qServerDB.config.cooldown_exempt.splice(qServerDB.config.cooldown_exempt.findIndex(u => u === interaction.member.user.id), 1);
			await qServerDB.save();
		}
	}
};
