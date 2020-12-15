const Trello = require("trello");
module.exports = {
	initTrello: function() {
		return new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN);
	}
};
