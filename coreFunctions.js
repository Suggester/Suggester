const config = require("./config.json");
const { colors, emoji } = require("./config.json");
const Discord = require("discord.js");
let models = require("./utils/schemas");
const { promises } = require("fs");
const { resolve } = require("path");
const nodeEmoji = require("node-emoji");
const { findBestMatch } = require("string-similarity");

/**
 * Send a message from a webhook
 * @param {Object} cfg - Where to send the webhook; contains webhook token and id
 * @param {module:"discord.js".RichEmbed} input - What to send
 * @param {module:"discord.js".RichEmbed} embed - embed to send
 */
function sendWebhook (cfg, input, embed) {
	if (!cfg || !cfg.id || !cfg.token) return;
	if (!input) return;
	if (typeof input === "string") input = Discord.Util.removeMentions(input);
	if (embed) (new Discord.WebhookClient(cfg.id, cfg.token)).send(input, embed).then(() => { /* noop */ });
	else (new Discord.WebhookClient(cfg.id, cfg.token)).send(input).then(() => { /* noop */ });
}

module.exports = {
	/**
	 * Returns permission level of inputted ID
	 *
	 * 11 - Blacklisted\
	 * 10 - Everyone\
	 * 3 - Server staff\
	 * 2 - Server Admin\
	 * 1 - Global Permissions\
	 * 0 - Developer/Global Admin
	 *
	 * @param member - Member object fetched from a server
	 * @param client - The Discord client
	 * @returns {Promise<number>}
	 */
	checkPermissions: async (member, client) => {
		if (!member || !member.id || !client) return 10;
		if (client.admins.has(member.id)) return 0;
		let { dbQueryNoNew } = require("./coreFunctions.js");
		let qUserDB = await dbQueryNoNew("User", { id: member.id });
		let qServerDB = await dbQueryNoNew("Server", { id: member.guild.id });
		if (qUserDB && qUserDB.flags.includes("STAFF")) return 1;
		if (qUserDB && qUserDB.blocked) return 12;
		if (member.hasPermission("MANAGE_GUILD") || qServerDB.config.admin_roles.some(r => member.roles.cache.has(r))) return 2;
		if (qServerDB.config.staff_roles.some(r => member.roles.cache.has(r))) return 3;
		if (qServerDB.config.blacklist.includes(member.id)) return 11;
		return 10;
	},
	guildLog: (input, embed) => {
		return sendWebhook(config.log_hooks.guild, input, embed ? embed : null);
	},
	coreLog: (input, embed) => {
		return sendWebhook(config.log_hooks.core, input, embed ? embed : null);
	},
	commandLog: (input, embed) => {
		return sendWebhook(config.log_hooks.commands, input, embed ? embed : null);
	},
	permLevelToRole: (permLevel) => {
		switch (permLevel) {
		case -1:
			return "No Users";
		case 0:
			return "Bot Administrator";
		case 1:
			return "Global Permissions+";
		case 2:
			return "Server Administrator (Manage Server or Admin Role)+";
		case 3:
			return "Server Staff (Staff Role)+";
		case 10:
			return "All Users";
		default:
			return "Undefined";
		}
	},
	/**
	 * Send a suggestion to the suggestion channel
	 * @param {Object} suggestion - The database record for the suggestion
	 * @param {Object} server - The server's database record
	 * @param {module:"discord.js".Client} client - Discord.js client
	 * @return {Promise<module:"discord.js".RichEmbed>}
	 */
	suggestionEmbed: async (suggestion, server, client) => {
		let { fetchUser } = require("./coreFunctions.js");
		let suggester = await fetchUser(suggestion.suggester, client);
		let embed = new Discord.MessageEmbed();
		// User information
		if (suggester) {
			embed.setAuthor(`Suggestion from ${suggester.tag}`, suggester.displayAvatarURL({format: "png", dynamic: true}))
				.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}));
		} else {
			embed.setTitle("Suggestion from Unknown User");
		}
		// Suggestion
		embed.setDescription(suggestion.suggestion)
			// Footer
			.setTimestamp(suggestion.submitted)
			.setFooter(`Suggestion ID: ${suggestion.suggestionId} | Submitted at`);
		// Side Color
		switch (suggestion.displayStatus) {
		case "implemented": {
			embed.setColor(colors.green)
				.addField("Status", "Implemented");
			break;
		}
		case "working": {
			embed.addField("Status", "In Progress")
				.setColor(colors.orange);
			break;
		}
		case "no": {
			embed.addField("Status", "Not Happening")
				.setColor(colors.gray);
			break;
		}
		default: {
			embed.setColor(colors.default);
		}
		}
		// Comments
		if (suggestion.comments) {
			for (const comment of suggestion.comments) {
				if (!comment.deleted || comment.deleted !== true) {
					let user = await fetchUser(comment.author, client);
					let title;
					!user ? title = `Staff Comment (ID ${suggestion.suggestionId}_${comment.id})${comment.created ? " • " + comment.created.toUTCString() : ""}` : title = `Comment from ${user.tag} (ID ${suggestion.suggestionId}_${comment.id})${comment.created ? " • " + comment.created.toUTCString() : ""}`;
					embed.addField(title, comment.comment);
				}
			}
		}
		// Attachment
		if (suggestion.attachment) embed.setImage(suggestion.attachment);

		return embed;
	},
	channelPermissions: (permissionCheckFor, channel, client) => {
		const permissionNames = require("./utils/permissions.json");
		let permissionCheckArr = [];
		switch (permissionCheckFor) {
		case "suggestions":
			permissionCheckArr = ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			break;
		case "staff":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			break;
		case "denied":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS"];
			break;
		case "log":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_WEBHOOKS"];
			break;
		case "commands":
			permissionCheckArr = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"];
			break;
		default:
			permissionCheckArr = permissionCheckFor;
		}
		let channelPermissions = channel.permissionsFor(client.user.id);
		let missing = permissionCheckArr.filter(p => !channelPermissions.has(p)).map(p => permissionNames[p]);
		if (missing.length < 1) return null;

		let embed = new Discord.MessageEmbed()
			.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
			.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
			.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
			.setColor(colors.red);
		return embed;
	},
	/**
	 * Logs an input to the specified server's log channel
	 * @param input - What to send
	 * @param {Object} server - Server configuration settings
	 * @returns null
	 */
	serverLog: (input, server, client) => {
		if (!input) return null;
		if (!server.config.loghook || !server.config.loghook.id || !server.config.loghook.token) return null;
		(new Discord.WebhookClient(server.config.loghook.id, server.config.loghook.token)).send({embeds: [input], avatarURL: client.user.displayAvatarURL({format: "png"})});
	},
	errorLog: (err, type, footer) => {
		if (!err) return;
		let errorText = "Error Not Set";
		if (err.stack) {
			console.error((require("chalk")).red(err.stack));
			errorText = err.stack;
		} else if (err.error) {
			console.error((require("chalk")).red(err.error));
			errorText = err.error;
		} else return;
		let embed = new Discord.MessageEmbed()
			.setAuthor(type)
			.setTitle(err.message ? err.message.substring(0, 256) : "No Message Value")
			.setDescription(`\`\`\`js\n${(errorText).length >= 1000 ? (errorText).substring(0, 1000) + " content too long..." : err.stack}\`\`\``)
			.setColor("DARK_RED")
			.setTimestamp()
			.setFooter(footer);

		sendWebhook(config.log_hooks.debug, embed);
	},
	/**
	 * Fetch a user
	 * @param {string} id - The Discord ID of the user
	 * @param {module:"discord.js".Client} client - The bot client
	 * @returns {Collection}
	 */
	async fetchUser(id, client) {
		if (!id) return null;
		let foundId;
		let matches = id.match(/^<@!?(\d+)>$/);
		if (!matches) foundId = id;
		else foundId = matches[1];

		function fetchUnknownUser(uid) {
			return client.users.fetch(uid, true)
				.then(() => {
					return client.users.cache.get(uid);
				})
				.catch(() => {
					return null;
				});
		}

		return client.users.cache.get(foundId)
			|| fetchUnknownUser(foundId)
			|| null;
	},
	/**
	 * Finds a role based on an input
	 * @param input {String} - Role mention, name, or ID
	 * @param roles - Represents a guild's roles cache
	 * @returns {Promise<null|*>}
	 */
	async findRole(input, roles) {
		if (!input) return null;
		let foundId;
		let matches = input.match(/^<@&(\d+)>$/);
		if (!matches) {
			let roleFromNonMention = roles.find(role => role.name.toLowerCase() === input.toLowerCase()) || roles.get(input) || null;
			if (roleFromNonMention) foundId = roleFromNonMention.id;
			else {
				let nearMatch = nearMatchCollection(roles, input);
				if (nearMatch) return nearMatch;
			}
		} else foundId = matches[1];

		return roles.get(foundId) || null;
	},
	/**
	 * Finds a channel based on an input
	 * @param input {String} - Channel mention, name, or ID
	 * @param channels - Represents a guild's channels cache
	 * @returns {Promise<null|*>}
	 */
	async findChannel(input, channels) {
		if (!input) return null;
		let foundId;
		let matches = input.match(/^<#(\d+)>$/);
		if (!matches) {
			let channelFromNonMention = channels.find(channel => channel.name.toLowerCase() === input.toLowerCase()) || channels.get(input) || null;
			if (channelFromNonMention) foundId = channelFromNonMention.id;
			else {
				let nearMatch = nearMatchCollection(channels, input);
				if (nearMatch) return nearMatch;
			}
		} else foundId = matches[1];

		return channels.get(foundId) || null;
	},
	/**
	 * Finds an emoji based on an input
	 * @param input {String} - Emoji
	 * @param emotes - Represents a guild's emoji cache
	 * @returns {Promise<null|*>}
	 */
	async findEmoji(input, emotes) {
		if (!input) return [null, null];
		if (nodeEmoji.find(input)) return [input, input];
		let matches = input.match(/<a?:[a-z0-9_~-]+:([0-9]+)>/i) || null;
		if (!matches) return [null, null];
		let emote = emotes.get(matches[1]) || null;
		if (emote) return [`${emote.animated ? "a:" : ""}${emote.name}:${emote.id}`, `<${emote.animated ? "a:" : ":"}${emote.name}:${emote.id}>`];
		else return [null, null];
	},
	async checkConfig(db) {
		if (!db) return null;

		let config = db.config;
		let missing = [];

		if (!config.admin_roles || config.admin_roles.length < 1) missing.push("Server Admin Roles");
		if (!config.staff_roles || config.staff_roles.length < 1) missing.push("Server Staff Roles");
		if (!config.channels.suggestions) missing.push("Approved Suggestions Channel");
		if (config.mode === "review" && !config.channels.staff) missing.push("Suggestion Review Channel");

		if (missing.length > 0) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${db.config.prefix}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return embed;
		}
		return null;
	},
	/**
	 * Checks permissions for a channel of a certain type
	 * @param channelId - ID of the channel (for fetching)
	 * @param guildChannels - Cache of guild channels
	 * @param type {String} - Type of channel to check permissions for
	 * @param client {module:"discord.js".Client} - Bot client
	 * @returns {null|boolean|module:"discord.js".MessageEmbed}
	 */
	checkChannel(channelId, guildChannels, type, client) {
		const { channelPermissions } = require("./coreFunctions.js");
		if (!channelId || !guildChannels || !type) return null;
		let channel = guildChannels.get(channelId) || null;
		if (!channel) return null;
		let permissions = channel.permissionsFor(client.user.id);
		let missingPerms = channelPermissions(permissions, type, client);
		if (missingPerms.length > 0) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${channelId}> channel:`)
				.addField("Missing Elements", `<:${emoji.x}> ${missingPerms.join(`\n<:${emoji.x}> `)}`)
				.addField("How to Fix", `In the channel settings for <#${channelId}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
				.setColor(colors.red);
			return embed;
		} else return true;
	},
	/**
	 * Search the database for an id, creates a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQuery: async (collection, query) => {
		return await models[collection].findOne(
			query
		)
			.then((res) => {
				if (!res) {
					return new models[collection](
						query
					).save();
				}
				return res;
			}).catch((error) => {
				console.log(error);
			});
	},
	/**
	 * Search the database for some parameters and return all entries that match, does not create a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQueryAll: async (collection, query) => {
		return await models[collection].find(
			query
		)
			.then((res) => {
				if (!res) {
					return null;
				} else {
					return res;
				}
			}).catch((error) => {
				console.log(error);
			});
	},
	/**
	 * Search the database for some parameters, returns one entry and does not create a new entry if not found
	 * @param {string} collection - The collection to query.
	 * @param  {Object} query - The term to search for
	 * @returns {Object}
	 */
	dbQueryNoNew: async (collection, query) => {
		if (!models[collection]) return 0;
		return await models[collection].findOne(
			query
		)
			.then((res) => {
				if (!res) {
					return null;
				} else {
					return res;
				}
			}).catch((error) => {
				console.log(error);
			});
	},
	/**
	 * Modify the database by providing either the userId or serverId
	 * @param {string} collection - Who should be modified, user or server.
	 * @param  {Snowflake | string} id - The id of the user/server
	 * @param {Object} modify - Should the user/server be blocked or unblocked
	 * @returns {Object}
	 */
	dbModifyId: async (collection, id, modify) => {
		modify.id = id;
		return await models[collection].findOne({
			id: id
		})
			.then(async (res) => {
				if (!res) {
					return new models[collection](
						modify
					).save();
				}
				await res.update(modify);
				return res;
			});
	},
	/**
	 * Modify the database by providing either the userId or serverId.
	 *
	 * *Note: Does not create new if not found.*
	 * @param {string} collection - Who should be modified, user or server.
	 * @param {Object} term - Which to modify
	 * @param {Object} query - Which to modify
	 * @param {Object} modify - What to change it to
	 * @returns {Promise}
	 */
	dbModify(collection, query, modify) {
		return models[collection].findOneAndUpdate(query, modify)
			.then((res) => {
				return res;
			});
	},
	/**
	 * Delete one document
	 * @param {string} collection - Which collection the document is in
	 * @param {Object} query - Which to delete
	 * @returns {Promise<void>}
	 */
	dbDeleteOne: async (collection, query) => {
		return await models[collection].findOne(
			query
		)
			.then(async (res) => {
				if (!res) return undefined;
				await res.deleteOne();
				return res;
			});
	}
};
/**
 * Find something in a collection with near matching strings
 * @param collection - Call .cache on it first
 * @param words - The string containing a potential string match
 */
function nearMatchCollection (collection, words) {
	let array = collection.array();
	let nameArray = array.map((r) => r.name.toLowerCase());

	let { bestMatchIndex, bestMatch: { rating } } = findBestMatch(words.toLowerCase(), nameArray);

	if (rating < .3) return null;
	return array[bestMatchIndex];
}
/**
 * Like readdir but recursive 👀
 * @param {string} dir
 * @returns {Promise<string[]>} - Array of paths
 */
const fileLoader = async function* (dir) {
	const files = await promises.readdir(dir, { withFileTypes: true });
	for (let file of files) {
		const res = resolve(dir, file.name);
		if (file.isDirectory()) {
			yield* fileLoader(res);
		} else {
			yield res;
		}
	}
};

module.exports.fileLoader = fileLoader;
