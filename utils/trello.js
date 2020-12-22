const Trello = require("trello");
const { findBestMatch } = require("string-similarity");

module.exports = {
	initTrello: function() {
		return new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
	},
	findList: function(lists, name) {
		if (!name) return null;
		let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(name.toLowerCase(), lists.map(l => l.name.toLowerCase()));

		if (rating < .3) return null;
		return lists[bestMatchIndex];
	},
	findLabel: function(labels, name) {
		if (!name) return null;
		labels = labels.filter(l => l.name);
		let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(name.toLowerCase(), labels.filter(l => l.name).map(l => l.name.toLowerCase()));
		if (rating < .3) return null;
		return labels[bestMatchIndex];
	}
};
