const { coreLog } = require("../utils/logs.js");
const { release } = require("../config.json");
const chalk = require("chalk");

module.exports = async (Discord, client) => {
	const team = await client.fetchTeam()
		.catch(() => console.log(chalk`{red [{bold ERROR}] Error fetching team members.}`));

	for (const admin of team) {
		client.admins.add(admin.id);
		console.log(chalk`{blue [{bold INFO}] Found {bold ${admin.tag}}}`);
	}

	coreLog(`🆗 Logged in with ${client.guilds.cache.size} servers! (Shard: ${client.shard.ids[0]})`, client);
	console.log(chalk`{green [{bold INFO}] Logged in as {bold ${client.user.tag}}! (Release: {bold ${release}, Shard: ${client.shard.ids[0]})}}`);
/*
	//Bot List Posting
	function postToBotLists() {
		let serverCount = client.guilds.cache.size;

		//Botlist.Space
		let blsoptions = {
			url: "https://api.botlist.space/v1/bots/564426594144354315",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": process.env.BOTLIST_SPACE_TOKEN
			},
			json: true,
			body: {
				server_count: serverCount
			}
		};


		request(blsoptions, (error, response) => {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to botlist.space!");
			}
		});

		//Glenn Bot List
		let gbloptions = {
			url: "https://glennbotlist.xyz/api/v2/bot/564426594144354315/stats",
			method: "POST",
			headers: {
				"authorization": process.env.GLENN_TOKEN
			},
			json: true,
			body: {
				serverCount: serverCount
			}
		};


		request(gbloptions, (error, response) => {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to glennbotlist.xyz!");
			}
		});

		//Top.gg
		let topggoptions = {
			url: "https://top.gg/api/bots/564426594144354315/stats",
			method: "POST",
			headers: {
				"Authorization": process.env.TOPGG_TOKEN
			},
			json: true,
			body: {
				server_count: serverCount
			}
		};

		request(topggoptions, (error, response) => {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to top.gg!");
			}
		});

		//Bots For Discord
		let bfdoptions = {
			url: "https://botsfordiscord.com/api/bot/564426594144354315",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": process.env.BFD_TOKEN
			},
			json: true,
			body: {
				server_count: serverCount
			}
		};

		request(bfdoptions, (error, response) => {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to botsfordiscord.com!");
			}
		});

		//Discord Bot List
		let dbloptions = {
			url: "https://discordbotlist.com/api/bots/564426594144354315/stats",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bot ${process.env.DBL_TOKEN}`
			},
			json: true,
			body: {
				guilds: serverCount
			}
		};

		request(dbloptions, (error, response) => {
			if (!error && response.statusCode === 204) {
				console.log("Server statistics posted to discordbotlist.com!");
			}
		});

		//Discord Boats
		let dboatsoptions = {
			url: "https://discord.boats/api/bot/564426594144354315",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": process.env.DBOATS_TOKEN
			},
			json: true,
			body: {
				server_count: serverCount
			}
		};

		request(dboatsoptions, (error, response) => {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to discord.boats!");
			}
		});

		//Discord Bots
		let dbotsoptions = {
			url: "https://discord.bots.gg/api/v1/bots/564426594144354315/stats",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": process.env.DBOTSGG_TOKEN
			},
			json: true,
			body: {
				guildCount: serverCount
			}
		};

		request(dbotsoptions, (error, response) => {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to discord.bots.gg!");
			}
		});

		//Bots on Discord
		let bodoptions = {
			url: "https://bots.ondiscord.xyz/bot-api/bots/564426594144354315/guilds",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": process.env.BOD_TOKEN
			},
			json: true,
			body: {
				guildCount: serverCount
			}
		};

		request(bodoptions, (error, response) => {
			if (!error && response.statusCode === 204) {
				console.log("Server statistics posted to bot.ondiscord.xyz!");
			}
		});
	}

	if (client.user.id === "564426594144354315") {
		//Post on startup and every hour
		postToBotLists();
		setInterval(function() {
			postToBotLists();
		}, 3600000);
	}
	*/

};
