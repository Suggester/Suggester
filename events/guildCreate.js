const core = require("../coreFunctions.js");
const { release } = require("../config.json");
const models = require("../utils/schemas");
module.exports = async (Discord, client, guild) => {
	let qServerDB = await dbQuery("Server", guild.id);
	let qSuggestionDB = await findAll("Suggestion", guild.id);
	if (qServerDB.blocked) {
		await guild.leave();
		return core.guildLog(`:no_entry: I was added to blacklisted guild **${guild.name}** (${guild.id}) and left`, client);
	}

	let enforceWhitelist = [
		"canary",
		"special",
		"premium"
	];
	if ((enforceWhitelist.includes(release)) && !qServerDB.whitelist) {
		await guild.leave();
		return core.guildLog(`:no_entry: I was added to non-whitelisted guild **${guild.name}** (${guild.id}) and left`, client);
	}

	if (qSuggestionDB.length > 0) {
		if (qServerDB.config.suggestion &&
			qServerDB.config.channels.suggestions &&
			client.channels.find((c) => c.id === qServerDB.config.suggestion)) {
			qSuggestionDB.forEach((suggestion) => {
				client.channels.find((c) => c.id === qSuggestionDB.config.channels.suggestions)
					.fetchMessage(suggestion.messageId)
					.catch((err) => {
						throw new Error(err);
					});
			});
		}
	}

	await core.guildLog(`:inbox_tray: New Guild: **${guild.name}** (${guild.id})\n>>> **Owner:** ${guild.owner.user.tag}\n**Member Count:** ${guild.memberCount}`, client);
};

/**
 * Search the database for a server
 * @param {string} collection - Which collection to query
 * @param {Snowflake} id - The server to find
 * @returns {Object} - The server's DB entry
 */
async function dbQuery (collection, id) {
	return await models[collection].findOne({
		id: id
	})
		.then(async (res) => {
			if (!res) {
				return new models[collection]({
					id: id
				}).save();
			}
			return await res;
		});
}

/**
 * Search the database for all entries from a server
 * @param {string} collection - Which collection to query
 * @param {Snowflake} id - The server's id to search for
 * @returns {Map}
 */
async function findAll (collection, id) {
	return await models[collection].find({
		id: id
	});
}
