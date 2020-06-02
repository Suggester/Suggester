const { colors } = require("../../config.json");
const { fetchUser } = require("../../utils/misc.js");
const { baseConfig, checkSuggestion } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { checkVotes } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "info",
		permission: 3,
		usage: "info <suggestion id>",
		description: "Shows information about a suggestion",
		image: "images/Info.gif",
		enabled: true,
		docs: "staff/info",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(message.guild.id);
		if (returned) return message.channel.send(returned);

		let [err, qSuggestionDB] = await checkSuggestion(message.guild, args[0]);
		if (err) return message.channel.send(err);

		let id = qSuggestionDB.suggestionId;

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string("ERROR", {}, "error"));

		let embed = new Discord.MessageEmbed()
			.setTitle(`${string("SUGGESTION_HEADER")}: #${id.toString()}`)
			.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT"))
			.addField(string("INFO_AUTHOR_HEADER"), string("USER_INFO_HEADER", { user: suggester.tag, id: suggester.id }))
			.setColor(colors.blue);

		if (qSuggestionDB.attachment) {
			embed.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment)
				.setImage(qSuggestionDB.attachment);
		}

		if (qSuggestionDB.comments && qSuggestionDB.comments.length > 0) embed.addField(string("INFO_COMMENT_COUNT_HEADER"), `${qSuggestionDB.comments.filter(c => !c.deleted).length} ${qSuggestionDB.comments.filter(c => c.deleted).length > 0 ? `(+${qSuggestionDB.comments.filter(c => c.deleted).length} deleted)` : ""}`);

		switch (qSuggestionDB.status) {
		case "awaiting_review":
			embed.setColor(colors.yellow)
				.addField(string("INFO_INTERNAL_STATUS_HEADER"), `${string("AWAITING_REVIEW_STATUS")} ([${string("QUEUE_POST_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.staff}/${qSuggestionDB.reviewMessage}))`);
			break;
		case "denied": {
			let denier = await fetchUser(qSuggestionDB.staff_member, client);
			embed.setColor(colors.red)
				.addField(string("INFO_INTERNAL_STATUS_HEADER"), string("DENIED_BY", { user: denier.tag }));
			if (qSuggestionDB.denial_reason) embed.addField(string("REASON_GIVEN"), qSuggestionDB.denial_reason);
			break;
		}
		case "approved": {
			if (qSuggestionDB.displayStatus) {
				let statusArr = [];
				switch (qSuggestionDB.displayStatus) {
				case "implemented":
					statusArr = [colors.green, string("STATUS_IMPLEMENTED")];
					break;
				case "working":
					statusArr = [colors.orange, string("STATUS_PROGRESS")];
					break;
				case "no":
					statusArr = [colors.gray, string("STATUS_NO")];
					break;
				}
				if (statusArr[0]) {
					embed.addField(string("INFO_PUBLIC_STATUS_HEADER"), statusArr[1])
						.setColor(statusArr[0]);
				}
			}

			let approver = await fetchUser(qSuggestionDB.staff_member, client);
			embed.addField(string("INFO_INTERNAL_STATUS_HEADER"), string("APPROVED_BY", { user: approver.tag }));

			if (!qSuggestionDB.implemented) {
				let messageFetched;
				await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
					let [up, down, opinion] = checkVotes(qSuggestionDB, f);
					messageFetched = true;
					if (up || down) embed.addField(string("VOTE_TOTAL_HEADER"), `${string("VOTE_COUNT_OPINION")} ${isNaN(opinion) ? string("UNKNOWN") : (opinion > 0 ? `+${opinion}` : opinion)}\n${string("VOTE_COUNT_UP")} ${up}\n${string("VOTE_COUNT_DOWN")} ${down}`);
				}).catch(() => messageFetched = false);

				if (!messageFetched) return message.channel.send(string("SUGGESTION_FEED_MESSAGE_NOT_FETCHED_ERROR", {}, "error"));

				embed.addField(string("SUGGESTION_FEED_LINK"), `[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`);
			} else embed.addField(string("HELP_ADDITIONAL_INFO"), string("INFO_IMPLEMENTED"));
			break;
		}
		}

		message.channel.send(embed);
	}
};
