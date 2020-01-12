module.exports = (Discord, client, messageReaction, user) => {/*
	const core = require("../coreFunctions.js");
	if (user.id === client.user.id) return;
	if (!client.suggestions.find(s => s.messageid == messageReaction.message.id)) return;
	var suggestion = client.suggestions.find(s => s.messageid == messageReaction.message.id);
	var id = suggestion.id;

	var upvotes;
	var downvotes;
	if (!suggestion.votes.upvotes) {
		upvotes = 0;
	} else {
		upvotes = suggestion.votes.upvotes;
	}

	if (!suggestion.votes.downvotes) {
		downvotes = 0;
	} else {
		downvotes = suggestion.votes.downvotes;
	}

	//Find if emoji is unicode
	const emoji = require("node-emoji");
	if (suggestion.emojis && suggestion.emojis.up) {
		if (emoji.find(suggestion.emojis.up)) {
			if (messageReaction.emoji.name === suggestion.emojis.up) {
				if (messageReaction.me) {
					upvotes = messageReaction.count - 1;
				} else {
					upvotes = messageReaction.count;
				}
			}
		} else {
			//Non unicode
			var splitted = suggestion.emojis.up.split(":");
			if (messageReaction.emoji.id === splitted[splitted.length - 1]) {
				if (messageReaction.me) {
					upvotes = messageReaction.count - 1;
				} else {
					upvotes = messageReaction.count;
				}
			}
		}
	}

	if (suggestion.emojis && suggestion.emojis.down) {
		if (emoji.find(suggestion.emojis.down)) {
			if (messageReaction.emoji.name === suggestion.emojis.down) {
				if (messageReaction.me) {
					downvotes = messageReaction.count - 1;
				} else {
					downvotes = messageReaction.count;
				}
			}
		} else {
			//Non unicode

			var splitted = suggestion.emojis.down.split(":");
			console.log(messageReaction.emoji.id);
			console.log(splitted[splitted.length - 1]);
			if (messageReaction.emoji.id === splitted[splitted.length - 1]) {
				if (messageReaction.me) {
					upvotes = messageReaction.count - 1;
				} else {
					upvotes = messageReaction.count;
				}
			}
		}
	}

	client.suggestions.set(id, {
		"upvotes": upvotes,
		"downvotes": downvotes
	}, "votes");

	client.channels.get(client.servers.get(suggestion.guild, "channels.suggestions")).fetchMessage(suggestion.messageid).then(f => f.edit(core.suggestionEmbed(client.suggestions.get(id), client)));
*/
};
