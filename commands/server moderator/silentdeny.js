const { colors } = require("../../config.json");
const { dbModify } = require("../../utils/db");
const { serverLog } = require("../../utils/logs");
const { reviewEmbed, logEmbed, fetchUser } = require("../../utils/misc");
const { string } = require("../../utils/strings");
const { checkSuggestion, checkDenied, baseConfig, checkReview } = require("../../utils/checks");
module.exports = {
	controls: {
		name: "silentdeny",
		permission: 3,
		usage: "silentdeny <suggestion id> (reason)",
		description: "Denies a suggestion without posting it to the denied suggestions feed",
		enabled: true,
		docs: "staff/silentdeny",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return message.channel.send(returned);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(string("MODE_AUTOAPPROVE_DISABLED_ERROR", {}, "error"));

		let deniedCheck = checkDenied(message.guild, qServerDB);
		if (deniedCheck) return [deniedCheck];

		let [fetchSuggestion, qSuggestionDB] = await checkSuggestion(message.guild, args[0]);
		if (fetchSuggestion) return message.channel.send(fetchSuggestion);

		let id = qSuggestionDB.suggestionId;

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) {
			let reviewCheck = checkReview(message.guild, qServerDB);
			if (reviewCheck) return message.channel.send(reviewCheck);
		}

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string("ERROR", {}, "error"));

		if (qSuggestionDB.status !== "awaiting_review") {
			switch (qSuggestionDB.status) {
			case "approved":
				return message.channel.send(string("SUGGESTION_ALREADY_APPROVED_APPROVE_ERROR", { prefix: qServerDB.config.prefix, id: id.toString() }, "error"));
			case "denied":
				return message.channel.send(string("SUGGESTION_ALREADY_DENIED_DENIED_ERROR", {}, "error"));
			}
		}

		qSuggestionDB.status = "denied";
		qSuggestionDB.staff_member = message.author.id;

		let reason;
		if (args[1]) {
			reason = args.splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(string("DENIAL_REASON_TOO_LONG_ERROR", {}, "error"));
			qSuggestionDB.denial_reason = reason;
		}

		await dbModify("Suggestion", { suggestionId: id }, qSuggestionDB);

		let replyEmbed = new Discord.MessageEmbed()
			.setTitle(string("SUGGESTION_DENIED_TITLE"))
			.setAuthor(string("SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(string("DENIED_BY", { user: message.author.tag }), message.author.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
			.setColor(colors.red);
		reason ? replyEmbed.addField(string("REASON_GIVEN"), reason) : "";
		if (qSuggestionDB.attachment) {
			replyEmbed.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}
		await message.channel.send(replyEmbed);

		if (qSuggestionDB.reviewMessage && qServerDB.config.channels.staff) client.channels.cache.get(qServerDB.config.channels.staff).messages.fetch(qSuggestionDB.reviewMessage).then(fetched => fetched.edit((reviewEmbed(qSuggestionDB, suggester, "red", string("DENIED_BY", { user: message.author.tag }))))).catch(() => {});

		if (qServerDB.config.channels.log) {
			let logs = logEmbed(qSuggestionDB, message.author, "DENIED_LOG", "red")
				.addField(string("SUGGESTION_HEADER"), qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"));

			reason ? logs.addField(string("REASON_GIVEN"), reason) : "";
			if (qSuggestionDB.attachment) {
				logs.setImage(qSuggestionDB.attachment);
				logs.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment);
			}
			serverLog(logs, qServerDB, client);
		}
	}
};
