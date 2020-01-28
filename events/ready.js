module.exports = async (Discord, client) => {
	const {presence} = require("../persistent");
	const {coreLog, dbQueryAll, dbQuery} = require("../coreFunctions.js");
	const {release} = require("../config.json");

	coreLog(`:ok: Logged in with ${client.guilds.size} servers!`, client);
	console.log(`Logged in as ${client.user.tag}! (Release: ${release})`);
	client.user.setActivity(presence.activity || "", {type: presence.type || "PLAYING"});
	client.user.setStatus(presence.status);

	//Bot List Posting
	if (release === "stable") {
		const request = require("request");
		let serverCount = client.guilds.size;
		let userCount = client.users.size;
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

		function blscallback(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to botlist.space!");
			}
		}

		request(blsoptions, blscallback);
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

		function gblcallback(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to glennbotlist.xyz!");
			}
		}

		request(gbloptions, gblcallback);
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

		function topggcallback(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to top.gg!");
			}
		}

		request(topggoptions, topggcallback);
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

		function bfdcallback(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to botsfordiscord.com!");
			}
		}

		request(bfdoptions, bfdcallback);
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

		function dblcallback(error, response, body) {
			if (!error && response.statusCode === 204) {
				console.log("Server statistics posted to discordbotlist.com!");
			}
		}

		request(dbloptions, dblcallback);
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

		function dboatscallback(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to discord.boats!");
			}
		}

		request(dboatsoptions, dboatscallback);

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

		function dbotscallback(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to discord.bots.gg!");
			}
		}

		request(dbotsoptions, dbotscallback);
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

		function divinecallback(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log("Server statistics posted to divinediscordbots.com!");
			}
		}

		request(divineoptions, divinecallback);
	}
};
