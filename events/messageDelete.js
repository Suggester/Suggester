module.exports = (Discord, client, message) => {
	/*
	const core = require("../coreFunctions.js");
	if (!client.suggestions.find(s => s.messageid == message.id)) return;
	var suggestion = client.suggestions.find(s => s.messageid == message.id);
	var id = suggestion.id;

	if (suggestion.status === "denied") return; //Denied already

	client.suggestions.set(id, "denied", "status");
	client.suggestions.set(id, client.user.id, "staff_member");

	var reason = "[Automatic] Deleted from suggestions feed";

	var suggester;
	if (client.users.get(client.suggestions.get(id, "suggester"))) {
		suggester = client.users.get(client.suggestions.get(id, "suggester"));
	} else {
		var found = false;
		client.fetchUser(client.users.get(client.suggestions.get(id, "suggester")), true).then(user => {
			suggester = user;
			found = true;
		}).catch(notFound => {
			found = false;
		});

	}
	if (suggester) {
		let dmEmbed = new Discord.RichEmbed()
			.setTitle("Your Suggestion Was Deleted")
			.setFooter(`Suggestion ID: ${id}`)
			.setDescription(suggestion.suggestion)
			.setColor("#e74c3c");
		reason ? dmEmbed.addField("Reason Given", reason) : "";
		suggester.send(dmEmbed).catch(err => console.log(err));

	}

	if (suggestion.reviewMessage && client.channels.get(client.servers.get(suggestion.guild, "channels.staff"))) {
		let updateEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Awaiting Review (#" + id.toString() + ")")
			.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
			.setDescription(suggestion.suggestion)
			.setColor("#e74c3c")
			.addField("A change was processed on this suggestion", "This suggestion has been deleted");
		client.channels.get(client.servers.get(message.guild.id, "channels.staff")).fetchMessage(client.suggestions.get(id, "reviewMessage")).then(fetched => fetched.edit(updateEmbed));
	}

	if (client.servers.get(suggestion.guild, "channels.denied")) {
		let deniedEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Deleted")
			.setDescription(suggestion.suggestion)
			.setFooter(`Suggestion ID: ${id.toString()}`)
			.setColor("#e74c3c");
		if (suggester) {
			deniedEmbed.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`);
			deniedEmbed.setThumbnail(suggester.displayAvatarURL);
		} else {
			deniedEmbed.setAuthor(`Suggestion from ${suggestion.suggester}`);
		}
		reason ? deniedEmbed.addField("Reason Given:", reason) : "";
		client.channels.get(client.servers.get(suggestion.guild, "channels.denied")).send(deniedEmbed);
	}

	if (client.servers.get(suggestion.guild, "channels.log")) {
		let logEmbed = new Discord.RichEmbed()
			.setAuthor(`Suggestion #${id.toString()} was deleted automatically`, client.user.displayAvatarURL)
			.addField("Suggestion", suggestion.suggestion)
			.setFooter(`Suggestion ID: ${id.toString()}`)
			.setTimestamp()
			.setColor("#e74c3c");
		reason ? logEmbed.addField("Deletion Reason", reason) : "";
		core.serverLog(logEmbed, suggestion.guild, client);
	*/
};
