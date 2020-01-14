const { emoji } = require("../config.json");
const { dbQuery, dbQueryNoNew } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 1,
		usage: "showconfig <guild id>",
		description: "Checks the configuration for a server",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let server = message.guild || client.guilds.get(args[0]) || null;
		if (!server) return message.channel.send(`<:${emoji.x}> I couldn't find a guild with ID \`${args[0]}\``);

		let qServerDB = dbQueryNoNew("Server", {id: message.guild.id})
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> This guild does not have a database entry.`);

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
					adminRoleList.push(`${server.roles.get(id).name} (ID: \`${id}\`)`);
				} else {
					// Fix role list and delete the old no longer found role
					var index = client.servers.get(server.id, "admin_roles").findIndex(r => r == id);
					client.servers.set(server.id, client.servers.get(server.id, "admin_roles").splice(index, 1), "admin_roles");
				}
			});
			if (adminRoleList.length < 1) {
				cfgArr.push(`<:${config.emoji.x}> **Admin Roles:** None Configured`);
				issuesAlert++;
			} else {
				cfgArr.push(`<:${config.emoji.check}> **Admin Roles:** ${adminRoleList.join(", ")}`);
			}
		}
		// Staff roles
		if (!client.servers.get(server.id, "staff_roles") || client.servers.get(server.id, "staff_roles").length < 1) {
			cfgArr.push(`<:${config.emoji.x}> **Staff Roles:** None Configured`);
			issuesAlert++;
		} else {
			var staffRoleList = [];
			var configRoles = client.servers.get(server.id, "staff_roles");
			configRoles.forEach(id => {
				if (server.roles.get(id)) {
					//Push to the list
					staffRoleList.push(`${server.roles.get(id).name} (ID: \`${id}\`)`);
				} else {
					// Fix role list and delete the old no longer found role
					var index = client.servers.get(server.id, "staff_roles").findIndex(r => r == id);
					client.servers.set(server.id, client.servers.get(server.id, "staff_roles").splice(index, 1), "staff_roles");
				}
			});
			if (staffRoleList.length < 1) {
				cfgArr.push(`<:${config.emoji.x}> **Staff Roles:** None Configured`);
				issuesAlert++;
			} else {
				cfgArr.push(`<:${config.emoji.check}> **Staff Roles:** ${staffRoleList.join(", ")}`);
			}
		}
		// Staff review channel
		if (!client.servers.get(server.id, "channels.staff")) {
			cfgArr.push(`<:${config.emoji.x}> **Suggestion Review Channel:** None Configured`);
			if (client.servers.get(message.guild.id, "mode") === "review") {
				issuesAlert++;
			} else {
				issuesFine++;
			}
		} else {
			var channel = client.channels.get(client.servers.get(server.id, "channels.staff"));
			if (!channel) {
				client.servers.delete(server.id, "channels.staff");
				if (client.servers.get(message.guild.id, "mode") === "review") {
					issuesAlert++;
				} else {
					issuesFine++;
				}
				cfgArr.push(`<:${config.emoji.x}> **Suggestion Review Channel:** None Configured`);
			} else {
				cfgArr.push(`<:${config.emoji.check}> **Suggestion Review Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Suggestions channel
		if (!client.servers.get(server.id, "channels.suggestions")) {
			cfgArr.push(`<:${config.emoji.x}> **Approved Suggestions Channel:** None Configured`);
			issuesAlert++;
		} else {
			var channel = client.channels.get(client.servers.get(server.id, "channels.suggestions"));
			if (!channel) {
				client.servers.delete(server.id, "channels.suggestions");
				cfgArr.push(`<:${config.emoji.x}> **Approved Suggestions Channel:** None Configured`);
				issuesAlert++;
			} else {
				cfgArr.push(`<:${config.emoji.check}> **Approved Suggestions Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Denied channel
		if (!client.servers.get(server.id, "channels.denied")) {
			cfgArr.push(`<:${config.emoji.x}> **Denied Suggestions Channel:** None Configured`);
			issuesFine++;
		} else {
			var channel = client.channels.get(client.servers.get(server.id, "channels.denied"));
			if (!channel) {
				client.servers.delete(server.id, "channels.denied");
				cfgArr.push(`<:${config.emoji.x}> **Denied Suggestions Channel:** None Configured`);
				issuesFine++;
			} else {
				cfgArr.push(`<:${config.emoji.check}> **Denied Suggestions Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Log channel
		if (!client.servers.get(server.id, "channels.log")) {
			cfgArr.push(`<:${config.emoji.x}> **Log Channel:** None Configured`);
			issuesFine++;
		} else {
			var channel = client.channels.get(client.servers.get(server.id, "channels.log"));
			if (!channel) {
				client.servers.delete(server.id, "channels.log");
				cfgArr.push(`<:${config.emoji.x}> **Log Channel:** None Configured`);
				issuesFine++;
			} else {
				cfgArr.push(`<:${config.emoji.check}> **Log Channel:** <#${channel.id}> (${channel.id})`);
			}
		}
		// Emojis
		var emoji = require("node-emoji");
		var upEmoji;
		var midEmoji;
		var downEmoji;
		if (client.servers.get(server.id, "emojis.up")) {
			if (emoji.find(client.servers.get(server.id, "emojis.up"))) {
				upEmoji = client.servers.get(server.id, "emojis.up");
			} else if (client.servers.get(server.id, "emojis.up").startsWith("a")) {
				upEmoji = `<${client.servers.get(server.id, "emojis.up")}>`;
			} else {
				upEmoji = `<:${client.servers.get(server.id, "emojis.up")}>`;
			}
		} else {
			upEmoji = config.initial.reactions.upvote;
		}
		if (client.servers.get(server.id, "emojis.mid")) {
			if (emoji.find(client.servers.get(server.id, "emojis.mid"))) {
				midEmoji = client.servers.get(server.id, "emojis.mid");
			} else if (client.servers.get(server.id, "emojis.mid").startsWith("a")) {
				midEmoji = `<${client.servers.get(server.id, "emojis.mid")}>`;
			} else {
				midEmoji = `<:${client.servers.get(server.id, "emojis.mid")}>`;
			}
		} else {
			midEmoji = config.initial.reactions.shrug;
		}
		if (client.servers.get(server.id, "emojis.down")) {
			if (emoji.find(client.servers.get(server.id, "emojis.down"))) {
				downEmoji = client.servers.get(server.id, "emojis.down");
			} else if (client.servers.get(server.id, "emojis.down").startsWith("a")) {
				downEmoji = `<${client.servers.get(server.id, "emojis.down")}>`;
			} else {
				downEmoji = `<:${client.servers.get(server.id, "emojis.down")}>`;
			}
		} else {
			downEmoji = config.initial.reactions.downvote;
		}

		cfgArr.push(`<:${config.emoji.check}> **Reaction Emojis:** ${upEmoji}, ${midEmoji}, ${downEmoji}`);
		if (!client.servers.get(server.id, "react")) client.servers.get(server.id, true, "react");
		if (client.servers.get(server.id, "react") && client.servers.get(server.id, "react") == true) {
			cfgArr.push(`<:${config.emoji.check}> **Suggestion Feed Reactions:** Enabled`);
		} else if (!client.servers.get(server.id, "react") || client.servers.get(server.id, "react") == false) cfgArr.push(`<:${config.emoji.check}> **Suggestion Feed Reactions:** Enabled`);
		// Mode
		switch (client.servers.get(server.id, "mode")) {
		case "review":
			cfgArr.push(`<:${config.emoji.check}> **Mode:** All suggestions are held for review`);
			break;
		case "autoapprove":
			cfgArr.push(`<:${config.emoji.check}> **Mode:** All suggestions are automatically approved`);
			break;
		default:
			cfgArr.push(`<:${config.emoji.x}> **Mode:** Broken mode configuration, please reconfigure the mode.`);
			issuesAlert++;
		}
		// Prefix
		cfgArr.push(`<:${config.emoji.check}> **Prefix:** ${client.servers.get(server.id, "prefix")}`);
		// Notify
		if (!client.servers.get(server.id, "notify")) client.servers.set(server.id, true, "notify");
		if (client.servers.get(server.id, "notify") && client.servers.get(server.id, "notify") == true) {
			cfgArr.push(`<:${config.emoji.check}> **Notifications:** All suggestion actions DM the suggesting user`);
		} else if (!client.servers.get(server.id, "notify") || client.servers.get(server.id, "notify") == false) cfgArr.push(`<:${config.emoji.check}> **Notifications:** Suggestion actions do not DM the suggesting user`);

		let cfgEmbed = new Discord.RichEmbed()
			.setTitle(`Server Configuration for ${server.name}`)
			.setDescription(cfgArr.join("\n"));
		if (issuesAlert > 0) {
			cfgEmbed.setColor("#e74c3c")
				.addField("Config Status", `<:${config.emoji.x}> Not Fully Configured, Bot Will Not Work`);
		} else if (issuesFine > 0) {
			cfgEmbed.setColor("#e67e22")
				.addField("Config Status", ":shrug: Not Fully Configured, Bot Will Still Work");
		} else {
			cfgEmbed.setColor("#2ecc71")
				.addField("Config Status", `<:${config.emoji.check}> Fully Configured`);
		}
		return message.channel.send(cfgEmbed);
	}
};
