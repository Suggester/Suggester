const Trello = require("trello");
const { findBestMatch } = require("string-similarity");
const { string } = require("./strings");

module.exports = {
	initTrello: function() {
		return new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
	},
	findList: function(lists, name) {
		if (!name) return null;
		if (!lists.length) return null;
		let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(name.toLowerCase(), lists.map(l => l.name.toLowerCase()));

		if (rating < .3) return null;
		return lists[bestMatchIndex];
	},
	findLabel: function(labels, name) {
		if (!name) return null;
		labels = labels.filter(l => l.name);
		if (!labels.length) return null;
		let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(name.toLowerCase(), labels.filter(l => l.name).map(l => l.name.toLowerCase()));
		if (rating < .3) return null;
		return labels[bestMatchIndex];
	},
	actCard: async function(action, db, suggestion, suggester, comment) {
		if (!db.config.trello.board || !db.config.trello.actions.filter(a => a.action === action).length) return;
		const t = module.exports.initTrello();
		let actions = db.config.trello.actions.filter(a => a.action === action).sort((a) => (a.part === "list") ? -1 : 1);
		for await (let a of actions) {
			switch (a.part) {
			case "list":
				if (!suggestion.trello_card) {
					let c = await t.addCard(suggestion.suggestion, string(db.config.locale, "SUGGESTION_TRELLO_INFO", {
						user: suggester.tag,
						id: suggester.id,
						sid: suggestion.suggestionId
					}), a.id).catch(() => null);
					if (c) {
						suggestion.trello_card = c.id;
						suggestion.save();
						if (suggestion.attachment) await t.addAttachmentToCard(c.id, suggestion.attachment).then(a => {
							suggestion.trello_attach_id = a.id;
							suggestion.save();
						}).catch(() => null);
					}
				} else t.updateCardList(suggestion.trello_card, a.id).catch(() => {});
				break;
			case "label":
				if (!suggestion.trello_card) continue; //There needs to be a card
				await t.addLabelToCard(suggestion.trello_card, a.id).catch(() => {});
				break;
			case "delete":
				if (!suggestion.trello_card) continue;
				await t.deleteCard(suggestion.trello_card).catch(() => {});
				break;
			case "archive":
				if (!suggestion.trello_card) continue;
				await t.updateCard(suggestion.trello_card, "closed", true).catch(() => {});
				break;
			}
		}
		if (suggestion.trello_card && comment) t.addCommentToCard(suggestion.trello_card, comment).catch(() => {});
	},
	trelloComment: async function (db, user, suggestion, comment) {
		if (!db.config.trello.board || !suggestion.trello_card) return;
		const t = module.exports.initTrello();
		return t.addCommentToCard(suggestion.trello_card, `**${string(db.config.locale, user.id ? "COMMENT_TITLE" : "COMMENT_TITLE_ANONYMOUS", { user: user.tag, id: user.id })}**\n${comment}`).then(c => {
			return c.id;
		}).catch(() => {});
	}
};
