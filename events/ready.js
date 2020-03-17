const { coreLog } = require("../coreFunctions.js");
const { release } = require("../config.json");

module.exports = async (Discord, client) => {
	coreLog(`:ok: Logged in with ${client.guilds.cache.size} servers!`, client);
	console.log(`Logged in as ${client.user.tag}! (Release: ${release})`);

	//Bot List Posting
	if (release === "stable") {
		const request = require("request");
		let serverCount = client.guilds.cache.size;
		let userCount = client.users.cache.size;
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
				guilds: serverCount,
				users: userCount
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
		//Divine Discord Bot List
		let divineoptions = {
			url: "https://divinediscordbots.com/bot/564426594144354315/stats",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": process.env.DIVINE_TOKEN
			},
			json: true,
			body: {
				server_count: serverCount
			}
		};

		request(divineoptions, (error, response) => {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to divinediscordbots.com!");
			}
		});
	}
};
