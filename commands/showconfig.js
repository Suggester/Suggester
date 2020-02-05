const { emoji, colors } = require("../config.json");
const { dbQueryNoNew, dbModify } = require("../coreFunctions.js");
const nodeEmoji = require("node-emoji");
module.exports = {
	controls: {
		permission: 1,
		usage: "showconfig <guild id>",
		description: "Checks the configuration for a server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let server;
		if (!args[0]) server = message.guild;
		else if (client.guilds.get(args[0])) server = client.guilds.get(args[0]);
		if (!server) return message.channel.send(`<:${emoji.x}> I couldn't find a guild with ID \`${args[0]}\``);

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
				if (server.roles.get(roleId)) {
					adminRoleList.push(`${server.roles.get(roleId).name} (ID: \`${roleId}\`)`);
				} else {
					let index = qServerDB.config.admin_roles.findIndex(r => r === roleId);
					qServerDB.config.admin_roles.splice(index, 1);
				}
			});
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			cfgArr.push(`<:${emoji.check}> **Admin Roles:** ${adminRoleList.join(", ")}`);
		}
		// Staff roles
		if (!qServerDB.config.staff_roles || qServerDB.config.staff_roles.length < 1) {
			cfgArr.push(`<:${emoji.x}> **Staff Roles:** None Configured`);
			issuesCountFatal++;
		} else {
			let staffRoleList = [];
			qServerDB.config.staff_roles.forEach(roleId => {
				if (server.roles.get(roleId)) {
					staffRoleList.push(`${server.roles.get(roleId).name} (ID: \`${roleId}\`)`);
				} else {
					let index = qServerDB.config.staff_roles.findIndex(r => r === roleId);
					qServerDB.config.staff_roles.splice(index, 1);
				}
			});
			await dbModify("Server", {id: message.guild.id}, qServerDB);
			cfgArr.push(`<:${emoji.check}> **Staff Roles:** ${staffRoleList.join(", ")}`);
		}
		// Staff review channel
		if (!qServerDB.config.channels.staff) {
			cfgArr.push(`<:${emoji.x}> **Suggestion Review Channel:** None Configured`);
			qServerDB.config.mode === "review" ? issuesCountFatal++ : issuesCountMinor++;
		} else {
			let channel = server.channels.get(qServerDB.config.channels.staff);
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
			let channel = server.channels.get(qServerDB.config.channels.suggestions);
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
			let channel = server.channels.get(qServerDB.config.channels.denied);
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
			let channel = server.channels.get(qServerDB.config.channels.log);
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
		let upEmoji;
		let midEmoji;
		let downEmoji;
		if (qServerDB.config.emojis.up) {
			if (nodeEmoji.find(qServerDB.config.emojis.up)) {
				upEmoji = qServerDB.config.emojis.up;
			} else if (qServerDB.config.emojis.up.startsWith("a")) {
				upEmoji = `<${qServerDB.config.emojis.up}>`;
			} else {
				upEmoji = `<:${qServerDB.config.emojis.up}>`;
			}
		} else {
			upEmoji = "No Upvote Emoji";
		}
		if (qServerDB.config.emojis.mid) {
			if (nodeEmoji.find(qServerDB.config.emojis.mid)) {
				midEmoji = qServerDB.config.emojis.mid;
			} else if (qServerDB.config.emojis.mid.startsWith("a")) {
				midEmoji = `<${qServerDB.config.emojis.mid}>`;
			} else {
				midEmoji = `<:${qServerDB.config.emojis.mid}>`;
			}
		} else {
			midEmoji = "No Middle Emoji";
		}
		if (qServerDB.config.emojis.down) {
			if (nodeEmoji.find(qServerDB.config.emojis.down)) {
				downEmoji = qServerDB.config.emojis.down;
			} else if (qServerDB.config.emojis.down.startsWith("a")) {
				downEmoji = `<${qServerDB.config.emojis.down}>`;
			} else {
				downEmoji = `<:${qServerDB.config.emojis.down}>`;
			}
		} else {
			downEmoji = "No Downvote Emoji";
		}

		cfgArr.push(`<:${emoji.check}> **Reaction Emojis:** ${upEmoji}, ${midEmoji}, ${downEmoji}`);
		qServerDB.config.react ? cfgArr.push(`<:${emoji.check}> **Suggestion Feed Reactions:** Enabled`) : cfgArr.push(`<:${emoji.check}> **Suggestion Feed Reactions:** Disabled`);
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
		qServerDB.config.notify ? cfgArr.push(`<:${emoji.check}> **Notifications:** All suggestion actions DM the suggesting user`) : cfgArr.push(`<:${emoji.check}> **Notifications:** Suggestion actions do not DM the suggesting user`);

		let cfgEmbed = new Discord.RichEmbed()
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
		return message.channel.send(cfgEmbed);
	}
};
