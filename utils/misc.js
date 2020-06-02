const { colors } = require("../config.json");
const Discord = require("discord.js");
const { promises } = require("fs");
const { resolve } = require("path");
const { string } = require("./strings");

module.exports = {
	permLevelToRole: (permLevel) => {
		switch (permLevel) {
		case -1:
			return "No Users";
		case 0:
			return "Bot Administrator";
		case 1:
			return "Global Permissions+";
		case 2:
			return "Server Administrator (Manage Server or Admin Role)+";
		case 3:
			return "Server Staff (Staff Role)+";
		case 10:
			return "All Users";
		default:
			return "Undefined";
		}
	},
	/**
	 * Send a suggestion to the suggestion channel
	 * @param {Object} suggestion - The database record for the suggestion
	 * @param {Object} server - The server's database record
	 * @param {module:"discord.js".Client} client - Discord.js client
	 * @return {Promise<module:"discord.js".RichEmbed>}
	 */
	suggestionEmbed: async (suggestion, server, client) => {
		let { fetchUser } = require("./misc.js");
		let suggester = await fetchUser(suggestion.suggester, client);
		let embed = new Discord.MessageEmbed();
		// User information
		if (suggester) {
			embed.setAuthor(`Suggestion from ${suggester.tag}`, suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}));
		} else {
			embed.setTitle("Suggestion from Unknown User");
		}
		// Suggestion
		embed.setDescription(suggestion.suggestion)
			// Footer
			.setTimestamp(suggestion.submitted)
			.setFooter(`Suggestion ID: ${suggestion.suggestionId} | Submitted at`);
		// Side Color
		switch (suggestion.displayStatus) {
		case "implemented": {
			embed.setColor(colors.green)
				.addField("Status", "Implemented");
			break;
		}
		case "working": {
			embed.addField("Status", "In Progress")
				.setColor(colors.orange);
			break;
		}
		case "no": {
			embed.addField("Status", "Not Happening")
				.setColor(colors.gray);
			break;
		}
		default: {
			embed.setColor(colors.default);
		}
		}
		// Comments
		if (suggestion.comments) {
			for (const comment of suggestion.comments) {
				if (!comment.deleted || comment.deleted !== true) {
					let user = await fetchUser(comment.author, client);
					let title;
					!user ? title = `Staff Comment (ID ${suggestion.suggestionId}_${comment.id})${comment.created ? " • " + comment.created.toUTCString() : ""}` : title = `Comment from ${user.tag} (ID ${suggestion.suggestionId}_${comment.id})${comment.created ? " • " + comment.created.toUTCString() : ""}`;
					embed.addField(title, comment.comment);
				}
			}
		}
		// Attachment
		if (suggestion.attachment) embed.setImage(suggestion.attachment);

		return embed;
	},
	dmEmbed: function(qSuggestionDB, color, title, attachment, suggestions, reason) {
		let embed = new Discord.MessageEmbed()
			.setTitle(string(title.string, {server: title.guild}))
			.setFooter(string("SUGGESTION_FOOTER", {id: qSuggestionDB.suggestionId.toString()}))
			.setDescription(`${qSuggestionDB.suggestion || string("NO_SUGGESTION_CONTENT")}${qSuggestionDB.status === "approved" && suggestions ? `\n[${string("SUGGESTION_FEED_LINK")}](https://discordapp.com/channels/${qSuggestionDB.id}/${suggestions}/${qSuggestionDB.messageId})` : ""}`)
			.setTimestamp(qSuggestionDB.submitted)
			.setColor(colors[color] || color);
		if (attachment) embed.setImage(qSuggestionDB.attachment);
		if (reason) embed.addField(reason.header, reason.reason);
		return embed;
	},
	reviewEmbed: function (qSuggestionDB, user, color, change) {
		let embed = new Discord.MessageEmbed()
			.setTitle(string("SUGGESTION_REVIEW_EMBED_TITLE", { id: qSuggestionDB.suggestionId.toString() }))
			.setAuthor(string("USER_INFO_HEADER", { user: user.tag, id: user.id }), user.displayAvatarURL({format: "png", dynamic: true}))
			.setDescription(qSuggestionDB.suggestion)
			.setFooter(string("SUGGESTION_FOOTER", {id: qSuggestionDB.suggestionId.toString()}))
			.setTimestamp(qSuggestionDB.submitted)
			.setColor(colors[color] || color);

		if (change) embed.addField(string("SUGGESTION_CHANGE_REVIEW_EMBED"), change);
		if (qSuggestionDB.attachment) {
			embed.addField(string("WITH_ATTACHMENT_HEADER"), qSuggestionDB.attachment);
			embed.setImage(qSuggestionDB.attachment);
		}
		return embed;
	},
	logEmbed: function (qSuggestionDB, user, title, color) {
		let embed = new Discord.MessageEmbed()
			.setAuthor(string(title, { user: user.tag, id: qSuggestionDB.suggestionId.toString() }), user.displayAvatarURL({format: "png", dynamic: true}))
			.setFooter(string("LOG_SUGGESTION_SUBMITTED_FOOTER", { id: qSuggestionDB.suggestionId.toString(), user: user.id }))
			.setTimestamp()
			.setColor(colors[color] || color);
		return embed;
	},
	/**
	 * Fetch a user
	 * @param {string} id - The Discord ID of the user
	 * @param {module:"discord.js".Client} client - The bot client
	 * @returns {Collection}
	 */
	async fetchUser(id, client) {
		if (!id) return client.user.unknown;
		let foundId;
		let matches = id.match(/^<@!?(\d+)>$/);
		if (!matches) foundId = id;
		else foundId = matches[1];

		function fetchUnknownUser(uid) {
			return client.users.fetch(uid, true)
				.then(() => {
					return client.users.cache.get(uid);
				})
				.catch(() => {
					return client.user.unknown;
				});
		}

		return client.users.cache.get(foundId)
			|| fetchUnknownUser(foundId)
			|| null;
	},
	/**
	 * Like readdir but recursive 👀
	 * @param {string} dir
	 * @returns {Promise<string[]>} - Array of paths
	 */
	fileLoader: async function* (dir) {
		const { fileLoader } = require("./misc");
		const files = await promises.readdir(dir, { withFileTypes: true });
		for (let file of files) {
			const res = resolve(dir, file.name);
			if (file.isDirectory()) {
				yield* fileLoader(res);
			} else {
				yield res;
			}
		}
	}
};
