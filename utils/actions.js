const { suggestionEmbed } = require("./misc");
const { string } = require("./strings");
module.exports = {
	editFeedMessage: async function(qSuggestionDB, qServerDB, client) {
		let suggestionEditEmbed = await suggestionEmbed(qSuggestionDB, qServerDB, client);
		let messageEdited;
		await client.channels.cache.get(qServerDB.config.channels.suggestions).messages.fetch(qSuggestionDB.messageId).then(f => {
			f.edit(suggestionEditEmbed);
			messageEdited = true;
		}).catch(() => messageEdited = false);

		if (!messageEdited) return string("SUGGESTION_FEED_MESSAGE_NOT_EDITED_ERROR", {}, "error");
	}
};