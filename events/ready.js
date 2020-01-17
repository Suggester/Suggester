module.exports = async (Discord, client) => {
	const { presence } = require("../persistent");
	const { coreLog, dbQueryAll, dbQuery } = require("../coreFunctions.js");
	/*
	const botlist_space = require("botlist.space");
	var blsClient = new botlist_space({id: "564426594144354315", botToken: process.env.BOTLIST_SPACE_TOKEN})
	blsClient.postServerCount(client.guilds.size, {id: "564426594144354315", botToken: process.env.BOTLIST_SPACE_TOKEN}).then(response => {
	  log(client, 'dbl', `:pencil2: **Server Count Posted to botlist.space**!`);
	}).catch(e => {
	  log(client, 'dbl', `:rotating_light: An error occured posting to botlist.space`);
	})

	const GBL = require('gblapi.js');
	const Glenn = new GBL(client.user.id, 'XA-ce1ea68f578d4da0b6d0c515766d2efe');
	Glenn.updateStats(client.guilds.size, 1);  */

	coreLog(`:ok: Logged in with ${client.guilds.size} servers!`, client);
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity(presence.activity || "", {type: presence.type || "PLAYING"});
};
