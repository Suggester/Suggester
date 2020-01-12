module.exports = (Discord, client) => {
	const config = require("../config.json");
	const core = require("../coreFunctions.js");
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

	core.coreLog(`:ok: Logged in with ${client.guilds.size} servers!`, client);
	console.log(`Logged in as ${client.user.tag}!`);
/*
	const { connect, connection } = require("mongoose");
	const autoIncrement = require("mongoose-sequence");

	connect(process.env.MONGO, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
		.catch((err) => {
			throw new Error(err);
		});

	connection.on("open", () => {
		console.log("Connected to MongoDB!");
	});
	connection.on("error", (err) => {
		console.error("Connection error: ", err);
	});

	autoIncrement(connection);
*/
	/*
	if (client.core.get("playing")) {
		client.user.setActivity(client.core.get("playing")[0], { type: client.core.get("playing")[1] });
	} else {
		client.core.set("playing", ["", "PLAYING"]);
	}
	if (client.core.get("status")) {
		client.user.setStatus(client.core.get("status"));
	} else {
		client.core.set("status", "online");
	}

	if (!client.core.get("blacklist")) client.core.set("blacklist", {});
	if (!client.core.get("acks")) client.core.set("acks", {});
	if (!client.core.get("blacklist", "users")) client.core.set("blacklist", [], "users");
	if (!client.core.get("blacklist", "guilds")) client.core.set("blacklist", [], "guilds");

	client.guilds.map(x => x.id).forEach(guild => {
		client.guilds.get(guild).fetchMembers();
	});

	/*client.suggestions.array().forEach(suggestion => {
	  var id = suggestion.id

	  if (suggestion.status === 'approved' && client.guilds.get(suggestion.guild) && client.guilds.get(suggestion.guild).channels.get(client.servers.get(suggestion.guild, 'channels.suggestions')) && suggestion.messageid) {
		  client.channels.get(client.servers.get(suggestion.guild, 'channels.suggestions')).fetchMessage(suggestion.messageid).catch(err => {
			client.channels.get(client.servers.get(suggestion.guild, 'channels.suggestions')).fetchMessage(suggestion.messageid).catch(err => {
			if (suggestion.status === 'denied') return; //Denied already

	client.suggestions.set(id, 'denied', 'status')
	client.suggestions.set(id, client.user.id, 'staff_member')

	var reason = "[Automatic] Deleted from suggestions feed"

	var suggester;
	if (client.users.get(client.suggestions.get(id, 'suggester'))) {
	  suggester = client.users.get(client.suggestions.get(id, 'suggester'))
	} else {
	  var found = false;
	  client.fetchUser(client.users.get(client.suggestions.get(id, 'suggester')), true).then(user => {
		suggester = user;
		found = true;
	  }).catch(notFound => {
		found = false;
	  })

	}
	if (suggester) {
	let dmEmbed = new Discord.RichEmbed();
	dmEmbed.setTitle("Your Suggestion Was Deleted")
	dmEmbed.setFooter(`Suggestion ID: ${id}`)
	dmEmbed.setDescription(suggestion.suggestion);
	if (reason) {
	  dmEmbed.addField("Reason Given", reason)
	}
	dmEmbed.setColor("#e74c3c");
	suggester.send(dmEmbed).catch(err => console.log(err));

	}

	if (suggestion.reviewMessage && client.channels.get(client.servers.get(suggestion.guild, 'channels.staff'))) {
	let updateEmbed = new Discord.RichEmbed();
	updateEmbed.setTitle("Suggestion Awaiting Review (#" + id.toString() + ")")
	updateEmbed.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
	updateEmbed.setDescription(suggestion.suggestion);
	updateEmbed.setColor("#e74c3c");
	updateEmbed.addField("A change was processed on this suggestion", "This suggestion has been deleted")
	client.channels.get(client.servers.get(suggestion.guild, 'channels.staff')).fetchMessage(client.suggestions.get(id, 'reviewMessage')).then(fetched => fetched.edit(updateEmbed))
	}

	if (client.servers.get(suggestion.guild, 'channels.denied')) {
	let deniedEmbed = new Discord.RichEmbed();
	deniedEmbed.setTitle("Suggestion Deleted")
	if (suggester) {
	  deniedEmbed.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
	  deniedEmbed.setThumbnail(suggester.displayAvatarURL)
	} else deniedEmbed.setAuthor(`Suggestion from ${suggestion.suggester}`)
	deniedEmbed.setDescription(suggestion.suggestion)
	deniedEmbed.setFooter(`Suggestion ID: ${id.toString()}`);
	deniedEmbed.setColor("#e74c3c");
	if (reason) {
	  deniedEmbed.addField("Reason Given:", reason)
	}
	client.channels.get(client.servers.get(suggestion.guild, 'channels.denied')).send(deniedEmbed)
	}

		if (client.servers.get(suggestion.guild, 'channels.log')) {
		  let logEmbed = new Discord.RichEmbed()
		  logEmbed.setAuthor(`Suggestion #${id.toString()} was deleted automatically`, client.user.displayAvatarURL)
		  logEmbed.addField("Suggestion", suggestion.suggestion)
		  if (reason) logEmbed.addField("Deletion Reason", reason)
		  logEmbed.setFooter(`Suggestion ID: ${id.toString()}`)
		  logEmbed.setTimestamp()
		  logEmbed.setColor("#e74c3c");
		  core.serverLog(logEmbed, suggestion.guild, client)
		}
		  })
		  })
	  }

	  })*/
};
