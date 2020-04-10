const { emoji, colors } = require("../../config.json");
const { dbQueryNoNew, dbModify, findEmoji } = require("../../coreFunctions.js");
const nodeEmoji = require("node-emoji");
const permissions = require("../../utils/permissions");
module.exports = {
	controls: {
		name: "showconfig",
		permission: 1,
		usage: "showconfig <guild id>",
		description: "Checks the configuration for a server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let server;
		if (!args[0]) server = message.guild;
		else if (client.guilds.cache.get(args[0])) server = client.guilds.cache.get(args[0]);
		if (!server) return message.channel.send(`<:${emoji.x}> I couldn't find a guild based on your query!`);

		let qServerDB = await dbQueryNoNew("Server", {id: server.id});
		if (!qServerDB || !qServerDB.config) return message.channel.send(`<:${emoji.x}> This guild does not have a database entry.`);

		let cfgArr = [];
		let issuesCountFatal = 0;
		let issuesCountMinor = 0;

		// Admin roles
		if (!qServerDB.config.admin_roles || qServerDB.config.admin_roles.length < 1) {
			cfgArr.push(`<:${emoji.x}> **Admin Roles:** None Configured`);
			issuesCountFatal++;
		} else {
			let adminRoleList = [];
			qServerDB.config.admin_roles.forEach(roleId => {
				if (server.roles.cache.get(roleId)) {
					adminRoleList.push(`${server.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
				} else {
					let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
					qServerDB.config.admin_roles.splice(index, 1);
				}
			});
			await dbModify("Server", {id: server.id}, qServerDB);
			cfgArr.push(`<:${emoji.check}> **Admin Roles:**\n> ${adminRoleList.join("\n> ")}`);
		}
		// Staff roles
		if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
			cfgArr.push(`<:${emoji.x}> **Staff Roles:** None Configured`);
			issuesCountFatal++;
		} else {
			let staffRoleList = [];
			qServerDB.config.staff_roles.forEach(roleId => {
				if (server.roles.cache.get(roleId)) {
					staffRoleList.push(`${server.roles.cache.get(roleId).name} (ID: \`${roleId}\`)`);
				} else {
					let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
					qServerDB.config.staff_roles.splice(index, 1);
				}
			});
			await dbModify("Server", {id: server.id}, qServerDB);
			cfgArr.push(`<:${emoji.check}> **Staff Roles:**\n> ${staffRoleList.join("\n > ")}`);
		}
		// Staff review channel
		if (!qServerDB.config.channels.staff) {
			cfgArr.push(`<:${emoji.x}> **Suggestion Review Channel:** None Configured`);
			qServerDB.config.mode === "review" ? issuesCountFatal++ : issuesCountMinor++;
		} else {
			let channel = server.channels.cache.get(qServerDB.config.channels.staff);
			if (!channel) {
				qServerDB.config.channels.staff = "";
				qServerDB.config.mode === "review" ? issuesCountFatal++ : issuesCountMinor++;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				cfgArr.push(`<:${emoji.x}> **Suggestion Review Channel:** None Configured`);
			} else {
				cfgArr.push(`<:${emoji.check}> **Suggestion Review Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Suggestions channel
		if (!qServerDB.config.channels.suggestions) {
			cfgArr.push(`<:${emoji.x}> **Approved Suggestions Channel:** None Configured`);
			issuesCountFatal++;
		} else {
			let channel = server.channels.cache.get(qServerDB.config.channels.suggestions);
			if (!channel) {
				qServerDB.config.channels.suggestions = "";
				issuesCountFatal++;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				cfgArr.push(`<:${emoji.x}> **Approved Suggestions Channel:** None Configured`);
			} else {
				cfgArr.push(`<:${emoji.check}> **Approved Suggestions Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Denied channel
		if (!qServerDB.config.channels.denied) {
			cfgArr.push(`<:${emoji.x}> **Denied Suggestions Channel:** None Configured`);
			issuesCountMinor++;
		} else {
			let channel = server.channels.cache.get(qServerDB.config.channels.denied);
			if (!channel) {
				qServerDB.config.channels.denied = "";
				issuesCountMinor++;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				cfgArr.push(`<:${emoji.x}> **Denied Suggestions Channel:** None Configured`);
			} else {
				cfgArr.push(`<:${emoji.check}> **Denied Suggestions Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Log channel
		if (!qServerDB.config.channels.log) {
			cfgArr.push(`<:${emoji.x}> **Log Channel:** None Configured`);
			issuesCountMinor++;
		} else {
			let channel = server.channels.cache.get(qServerDB.config.channels.log);
			if (!channel) {
				qServerDB.config.channels.log = "";
				issuesCountMinor++;
				await dbModify("Server", {id: message.guild.id}, qServerDB);
				cfgArr.push(`<:${emoji.x}> **Log Channel:** None Configured`);
			} else {
				cfgArr.push(`<:${emoji.check}> **Log Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Emojis
		const checkEmoji = function(emoji) {
			if (emoji === "none") return "Disabled";
			else if (nodeEmoji.find(emoji)) return emoji;
			else if (emoji.startsWith("a")) return `<${emoji}>`;
			else return `<:${emoji}>`;
		};
		let upEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.up), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.up === "none" ? "(Upvote Reaction Disabled)" : "👍");
		let midEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.mid), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.mid === "none" ? "(Shrug/No Opinion Reaction Disabled)" : "🤷");
		let downEmoji = (await findEmoji(checkEmoji(qServerDB.config.emojis.down), message.guild.emojis.cache))[1] || (qServerDB.config.emojis.down === "none" ? "(Downvote Reaction Disabled)" : "👎");

		cfgArr.push(`<:${emoji.check}> **Reaction Emojis:** ${upEmoji}, ${midEmoji}, ${downEmoji}`);
		cfgArr.push(`<:${emoji.check}> **Suggestion Feed Reactions:** ${qServerDB.config.react ? "Enabled" : "Disabled"}`);
		// Mode
		switch (qServerDB.config.mode) {
		case "review":
			cfgArr.push(`<:${emoji.check}> **Mode:** All suggestions are held for review`);
			break;
		case "autoapprove":
			cfgArr.push(`<:${emoji.check}> **Mode:** All suggestions are automatically approved`);
			break;
		default:
			cfgArr.push(`<:${emoji.x}> **Mode:** Broken mode configuration, please reconfigure the mode.`);
			issuesCountFatal++;
		}
		// Prefix
		cfgArr.push(`<:${emoji.check}> **Prefix:** ${Discord.escapeMarkdown(qServerDB.config.prefix)}`);
		// Notify
		cfgArr.push(`<:${emoji.check}> **Notifications:** ${qServerDB.config.notify ? "All suggestion actions DM the suggesting user" : "Suggestion actions do not DM the suggesting user"}`);
		//Clean Suggestion Command
		cfgArr.push(`<:${emoji.check}> **Clean Suggestion Command:** ${qServerDB.config.clean_suggestion_command ? "Suggestion commands are removed from the channel after a few seconds" : "Suggestion commands are not removed automatically"}`);

		let cfgEmbed = new Discord.MessageEmbed()
			.setTitle(`Server Configuration for **${server.name}**`)
			.setDescription(cfgArr.join("\n"));
		if (issuesCountFatal > 0) {
			cfgEmbed.setColor(colors.red)
				.addField("Config Status", `<:${emoji.x}> Not Fully Configured, Bot Will Not Work`);
		} else if (issuesCountMinor > 0) {
			cfgEmbed.setColor(colors.orange)
				.addField("Config Status", `<:${emoji.mid}> Not Fully Configured, Bot Will Still Work`);
		} else {
			cfgEmbed.setColor(colors.green)
				.addField("Config Status", `<:${emoji.check}> Fully Configured`);
		}

		let hasPermissionList = [];
		Object.keys(permissions).forEach(perm => {
			server.me.permissions.has(perm) ? hasPermissionList.push(permissions[perm]) : "";
		});

		cfgEmbed.addField("Bot Permissions", hasPermissionList.join(", "));
		return message.channel.send(cfgEmbed);
	}
};
