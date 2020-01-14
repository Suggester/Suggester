const core = require("../coreFunctions.js");
//const { dbQuery, dbDeleteOne } = require("../coreFunctions");
const { Suggestion, Server } = require("../utils/schemas");
module.exports = async (Discord, client, message) => {

	/**
	 * @returns {Object} - The suggestion
	 */
	let suggestion = await Suggestion.findOne({
		messageId: message.id
	})
		.then((res) => {
			return res;
		});
	if (!suggestion) return; // not a suggestion

	/**
	 * @returns {Object} - The server's settings
	 */
	let server = await Server.findOne({
		id: message.guild.id
	})
		.then((res) => {
			if (!res) {
				return new Server().save();
			}
			return res;
		});

	console.log(suggestion);

	if (suggestion.status === "denied") return;
	suggestion.status = "denied";
	suggestion.staff_member = client.user.id;
	await suggestion.save();

	let reason = "[Automatic] Deleted from the suggestion feed";

	let suggester;
	if (client.users.find((user) => user.id === suggestion.suggester)) {
		suggester = client.users.find((user) => user.id === suggestion.suggester);
	} else {
		client.fetchUser(client.users.find((user) => user.id === suggestion.suggester), true)
			.then((user) => suggester = user);
	}
	let id = suggestion.suggestionId;

	if (suggester) {
		let dmEmbed = new Discord.RichEmbed()
			.setTitle("Your Suggestion Was Deleted")
			.setFooter(`Suggestion ID: ${id}`)
			.setDescription(suggestion.suggestion)
			.setColor("#e74c3c");
		reason ? dmEmbed.addField("Reason Given", reason) : "";
		suggester.send(dmEmbed).catch(err => console.log(err));

	}

	if (suggestion.reviewMessage && client.channels.get(server.config.channels.staff)) {
		let updateEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Awaiting Review (#" + id.toString() + ")")
			.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
			.setDescription(suggestion.suggestion)
			.setColor("#e74c3c")
			.addField("A change was processed on this suggestion", "This suggestion has been deleted");
		client.channels.find((channel) => channel.id === server.id)
			.fetchMessage(suggestion.reviewMessage)
			.then((fetched) => fetched.edit(updateEmbed));

	}

	if (server.config.channels.denied) {
		let deniedEmbed = new Discord.RichEmbed()
			.setTitle("Suggestion Deleted")
			.setDescription(suggestion.suggestion)
			.setFooter(`Suggestion ID: ${id.toString()}`)
			.setColor("#e74c3c");
		if (suggester) {
			deniedEmbed.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
				.setThumbnail(suggester.displayAvatarURL);
		} else {
			deniedEmbed.setAuthor(`Suggestion from ${suggestion.suggester}`);
		}
		if (reason) deniedEmbed.addField("Reason Given:", reason);
		client.channels.get(server.config.channels.denied)
			.send(deniedEmbed);
	}

	if (server.config.channels.log) {
		let logEmbed = new Discord.RichEmbed()
			.setAuthor(`Suggestion #${id.toString()} was deleted automatically`, client.user.displayAvatarURL)
			.addField("Suggestion", suggestion.suggestion)
			.setFooter(`Suggestion ID: ${id.toString()}`)
			.setTimestamp()
			.setColor("#e74c3c");
		if (reason) logEmbed.addField("Deletion Reason", reason);
		core.serverLog(logEmbed, server);
	}
};
