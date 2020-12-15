const Trello = require("trello");
const { findBestMatch } = require("string-similarity");

module.exports = {
	initTrello: function() {
		return new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
	},
	findList: function(lists, name) {
		let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(name.toLowerCase(), lists.map(l => l.name.toLowerCase()));

		if (rating < .3) return null;
		return lists[bestMatchIndex];
	}
};
