const { colors } = require("../../config.json");
const { string } = require("../../utils/strings");
const { fetchUser, suggestionEmbed, logEmbed, dmEmbed, reviewEmbed } = require("../../utils/misc");
const { serverLog } = require("../../utils/logs");
const { dbQuery, dbModify } = require("../../utils/db");
const { baseConfig, checkSuggestions, checkReview } = require("../../utils/checks");
const { Suggestion } = require("../../utils/schemas");
module.exports = {
	controls: {
		name: "massapprove",
		permission: 3,
		usage: "massapprove <suggestion ids> -r (comment)",
		aliases: ["mapprove", "multiapprove"],
		description: "Approves all specified suggestions",
		image: "images/Mapprove.gif",
		enabled: true,
		docs: "staff/massapprove",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return message.channel.send(returned);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string("MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error"));

		let checkSuggest = checkSuggestions(message.guild, qServerDB);
		if (checkSuggest) return message.channel.send(checkSuggest);

		let checkStaff = checkReview(message.guild, qServerDB);
		if (checkStaff) return message.channel.send(checkStaff);

		if (!args[0]) return message.channel.send(string("NONE_SPECIFIED_MASS_ERROR", {}, "error"));

		let reason;
		let reasonSplit = args.join(" ").split("-r");
		if (!reasonSplit[0]) return message.channel.send(string("NONE_SPECIFIED_MASS_ERROR", {}, "error"));
		let suggestions = reasonSplit[0].split(" ");
		if (reasonSplit[1]) {
			reason = reasonSplit[1].split(" ").splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string("COMMENT_TOO_LONG_ERROR", {}, "error"));
		}

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(string("NAN_MASS_APPROVE_ERROR", {}, "error"));
		let su = suggestions.map(Number);
		let msg = await message.channel.send(string("PROCESSING"));

		let preApprove = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let alreadyApproved = preApprove.filter((s) => s.status !== "awaiting_review");

		let notApprovedId = alreadyApproved.map((s) => s.suggestionId);
		su.filter(num => !notApprovedId.includes(num));

		let newSet = {
			status: "approved",
			staff_member: message.author.id
		};
		if (reason) newSet["comments"] = [{
			comment: reason,
			author: message.author.id,
			id: 1,
			created: new Date()
		}];

		let { nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "awaiting_review"
		}, {
			$set: newSet
		}, {
			multi: true
		});

		let postApprove = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let approved = postApprove.filter((s) => s.status === "approved" && !notApprovedId.includes(s.suggestionId));
		let approvedId = approved.map((s) => s.suggestionId);
		
		await msg.edit(
			new Discord.MessageEmbed()
				.setDescription(string("MASS_APPROVE_SUCCESS_TITLE", { some: nModified.toString(), total: postApprove.length }, nModified !== 0 ? "success" : "error"))
				.addField(string("RESULT_FIELD_TITLE"), `${approvedId.length > 0 ? string("MASS_APPROVE_APPROVE_RESULTS_DETAILED", { list: approvedId.join(", ") }, "success") : ""}\n${notApprovedId.length > 0 ? string("MASS_APPROVE_FAIL_RESULTS_DETAILED", { list: notApprovedId.join(", ") }, "error") : ""}`)
				.setColor(approvedId.length !== 0 ? colors.green : colors.red)
				.setFooter(nModified !== su.length ? string("MASS_APPROVE_ERROR_DETAILS") : "")
		);

		for (let s in approved) {
			// eslint-disable-next-line no-prototype-builtins
			if (approved.hasOwnProperty(s)) {
				let qSuggestionDB = approved[s];
				let suggester = await fetchUser(qSuggestionDB.suggester, client);
				let embedSuggest = await suggestionEmbed(qSuggestionDB, qServerDB, client);
				client.channels.cache.get(qServerDB.config.channels.suggestions).send(embedSuggest).then(async posted => {
					qSuggestionDB.messageId = posted.id;
					let qUserDB = await dbQuery("User", {id: suggester.id});
					if (qServerDB.config.notify && qUserDB.notify) suggester.send((dmEmbed(qSuggestionDB, "green", {
						string: "APPROVED_DM_TITLE",
						guild: message.guild.name
					}, qSuggestionDB.attachment, qServerDB.config.channels.suggestions, reason ? {
						header: string("COMMENT_TITLE", {
							user: message.author.tag,
							id: `${qSuggestionDB.suggestionId.toString()}_1`
						}), reason: reason
					} : null))).catch(() => {
					});

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
						await dbModify("Suggestion", {suggestionId: qSuggestionDB.suggestionId}, {
							emojis: {
								up: reactEmojiUp,
								mid: reactEmojiDown,
								down: reactEmojiDown
							}
						});
					}

					if (qServerDB.config.approved_role && message.guild.roles.cache.get(qServerDB.config.approved_role) && message.guild.members.cache.get(suggester.id) && message.guild.me.permissions.has("MANAGE_ROLES")) await message.guild.members.cache.get(suggester.id).roles.add(qServerDB.config.approved_role, string("SUGGESTION_APPROVED_TITLE"));

					if (qServerDB.config.channels.log) {
						let embedLog = logEmbed(qSuggestionDB, message.author, "APPROVED_LOG", "green")
							.addField(string("SUGGESTION_HEADER"), qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"));
						reason ? embedLog.addField(string("COMMENT_TITLE", {
							user: message.author.tag,
							id: `${qSuggestionDB.suggestionId.toString()}_1`
						}), reason) : "";
						if (qSuggestionDB.attachment) {
							embedLog.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
								.setImage(qSuggestionDB.attachment);
						}

						serverLog(embedLog, qServerDB, client);
					}

					if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit((reviewEmbed(qSuggestionDB, suggester, "green", string("APPROVED_BY", {user: message.author.tag}))))).catch(() => {});
					await approved[s].save();
				});
			}
		}
	}
};
