const { fetchUser } = require("../../utils/misc.js");
const { baseConfig, checkSuggestion } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { checkVotes } = require("../../utils/actions");
module.exports = {
	controls: {
		name: "sinfo",
		permission: 10,
		usage: "shortinfo [suggestion id]",
		aliases: ["shortinfo", "sdetails", "si"],
		description: "Shows information about a suggestion in a concise manner",
		enabled: true,
		examples: "`{{p}}shortinfo 1`\nShows information about suggestion #1\n\n`{{p}}shortinfo 1 -trim-suggest`\nShows information about suggestion #1 limiting the suggestion content to 250 characters\n\n`{{p}}shortinfo 1 -no-attach`\nShows information about suggestion #1 without showing the added attachment",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 5
	},
	do: async (locale, message, client, args, Discord) => {
		let [returned, qServerDB] = await baseConfig(locale, message.guild);
		if (returned) return message.channel.send(returned);

		let [err, qSuggestionDB] = await checkSuggestion(locale, message.guild, args[0]);
		if (err) return message.channel.send(err);

		let suggester = await fetchUser(qSuggestionDB.suggester, client);
		if (!suggester) return message.channel.send(string(locale, "ERROR", {}, "error"));

		let embed = new Discord.MessageEmbed()
			.setAuthor(string(locale, "SUGGESTION_FROM_TITLE", { user: suggester.tag }), suggester.displayAvatarURL({dynamic: true, format: "png"}))
			.setColor(client.colors.blue)
			.setDescription(qSuggestionDB.suggestion ? (["--trimsuggest", "--ts", "--shortsuggest", "--ss", "--trimsuggestion", "--shortsuggestion", "--trim-suggest", "--trim-suggestion", "--short-suggest", "--short-suggestion", "-trimsuggest", "-ts", "-shortsuggest", "-ss", "-trimsuggestion", "-shortsuggestion", "-trim-suggest", "-trim-suggestion", "-short-suggest", "-short-suggestion"].some(e => message.content.toLowerCase().includes(e)) ? `${qSuggestionDB.substr(0, 250)}...` : qSuggestionDB.suggestion) : string(locale, "NO_SUGGESTION_CONTENT"))
			.setFooter(string(locale, "SUGGESTION_FOOTER", { id: qSuggestionDB.suggestionId.toString() })).setTimestamp(qSuggestionDB.submitted);

		if (qSuggestionDB.attachment && !["--noattach", "--na", "--no-attach", "--no-attachment", "-noattachment", "-noattach", "-na", "-no-attach", "-no-attachment", "--noattachment"].some(e => message.content.toLowerCase().includes(e))) embed.setImage(qSuggestionDB.attachment);

		switch (qSuggestionDB.status) {
		case "awaiting_review":
			embed.setColor(client.colors.yellow);
			break;
		case "denied": {
			embed.setColor(client.colors.red);
			if (qSuggestionDB.denial_reason) embed.addField(`${string(locale, "SUGGESTION_DENIED_TITLE")} - ${string(locale, "REASON_GIVEN")}`, qSuggestionDB.denial_reason);
			break;
		}
		case "approved": {
			if (qSuggestionDB.displayStatus) {
				switch (qSuggestionDB.displayStatus) {
				case "implemented":
					embed.setColor(client.colors.green);
					break;
				case "working":
					embed.setColor(client.colors.orange);
					break;
				case "consideration":
					embed.setColor(client.colors.teal);
					break;
				case "no":
					embed.setColor(client.colors.gray);
					break;
				}
			}

			if (!qSuggestionDB.implemented) {
				let messageFetched;
				await client.channels.cache.get(qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
					let votes = checkVotes(locale, qSuggestionDB, f);
					messageFetched = true;
					if (votes[2] && !isNaN(votes[2])) embed.addField(string(locale, "VOTE_COUNT_OPINION"), votes[2] > 0 ? `+${votes[2]}` : votes[2]);
				}).catch(() => messageFetched = false);

				if (!messageFetched) return message.channel.send(string(locale, "SUGGESTION_FEED_MESSAGE_NOT_FETCHED_ERROR", {}, "error"));

				embed.addField(string(locale, "SUGGESTION_FEED_LINK"), `[${string(locale, "SUGGESTION_FEED_LINK")}](https://discord.com/channels/${qSuggestionDB.id}/${qSuggestionDB.channels.suggestions || qServerDB.config.channels.suggestions}/${qSuggestionDB.messageId})`);
			} else embed.addField(string(locale, "HELP_ADDITIONAL_INFO"), string(locale, "INFO_IMPLEMENTED"));
			break;
		}
		}

		message.channel.send(embed);
	}
};
