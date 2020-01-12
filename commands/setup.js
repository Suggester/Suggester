const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 2,
		usage: "setup",
		description: "Initiates a walkthrough for server configuration",
		enabled: true,
		docs: "admin/setup",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"]
	},
	do: (message, client, args, Discord) => {
		var permissions = message.channel.memberPermissions(client.user.id);
		var required = [["ADD_REACTIONS", "Add Reactions"], ["VIEW_CHANNEL", "Read Messages"], ["SEND_MESSAGES", "Send Messages"], ["EMBED_LINKS", "Embed Links"], ["ATTACH_FILES", "Attach Files"], ["READ_MESSAGE_HISTORY", "Read Message History"], ["USE_EXTERNAL_EMOJIS", "Use External Emojis"]];
		var list = [];
		required.forEach(permission => {
			if (!permissions.has(permission[0])) list.push(permission[1]);
		});

		if (list.length > 0) {
			let embed = new Discord.RichEmbed()
				.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in this channel:`)
				.addField("Missing Elements", `<:${config.emoji.x}> ${list.join(`\n<:${config.emoji.x}> `)}`)
				.addField("How to Fix", `In the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
				.setColor("#e74c3c");
			return message.channel.send(embed);
		}

		function setup (through, add) {
			switch (through) {
			case 0:
				//Server Admin role
				switch (add) {
				case "next":
					var embed = new Discord.RichEmbed()
						.setColor(config.default_color)
						.setDescription("Any member with a server admin role can use all staff commands, as well as edit bot configuration. Anyone who has the `Manage Server` permission is automatically counted as an admin.")
						.addField("Inputs", "You can send a role name, role ID, or role @mention in this channel");
					if (client.servers.get(message.guild.id, "admin_roles").length >= 1) embed.addField("Done setting up admin roles?", "Type `done` to go to the next step\nIf you're not done, just specify another admin role!");
					message.channel.send("**SETUP: Admin Roles**", embed).then(msg => {
						msg.channel.awaitMessages(response => response.author.id === message.author.id, {
							max: 1,
							time: 120000,
							errors: ["time"],
						})
							.then((collected) => {
								if (!collected.first().content.split(" ")[0]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
								if (collected.first().content.toLowerCase() == "done") return setup(1);
								var role;
								var possibleid = collected.first().content.split(" ")[0];
								var inputName = collected.first().content;

								if (collected.first().mentions.roles.first()) {
									role = collected.first().mentions.roles.first();
								} else if (message.guild.roles.find(r => r.name.toLowerCase() == inputName.toLowerCase())) {
									role = message.guild.roles.find(r => r.name.toLowerCase() === inputName.toLowerCase());
								} else if (message.guild.roles.get(possibleid)) {
									role = message.guild.roles.get(possibleid);
								} else {
									message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${inputName}\` on this server! Please check that the spelling is correct.`);
									setup(0, "next");
									return;
								}
								if (client.servers.get(message.guild.id, "admin_roles").includes(role.id)) {
									message.channel.send(`<:${config.emoji.x}> This role has already been added as an admin role.`);
									setup(0, "next");
									return;
								}
								client.servers.push(message.guild.id, role.id, "admin_roles");
								message.channel.send(`<:${config.emoji.check}> Added **${role.name}** to the list of server admin roles.`);
								setup(0, "next");
							})
							.catch(e => {
								console.log(e);
								return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
							});
					});
					break;
				default:
					var embed = new Discord.RichEmbed()
						.setColor(config.default_color)
						.setDescription("Any member with a server admin role can use all staff commands, as well as edit bot configuration. Anyone who has the `Manage Server` permission is automatically counted as an admin.")
						.addField("Inputs", "You can send a role name, role ID, or role @mention in this channel");
					message.channel.send("**SETUP: Admin Roles**", embed).then(msg => {
						msg.channel.awaitMessages(response => response.author.id === message.author.id, {
							max: 1,
							time: 120000,
							errors: ["time"],
						})
							.then((collected) => {
								if (!collected.first().content.split(" ")[0]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
								var role;
								var possibleid = collected.first().content.split(" ")[0];
								var inputName = collected.first().content;
								if (collected.first().mentions.roles.first()) {
									role = collected.first().mentions.roles.first();
								} else if (message.guild.roles.find(r => r.name.toLowerCase() == inputName.toLowerCase())) {
									role = message.guild.roles.find(r => r.name.toLowerCase() === inputName.toLowerCase());
								} else if (message.guild.roles.get(possibleid)) {
									role = message.guild.roles.get(possibleid);
								} else {
									message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${inputName}\` on this server! Please check that the spelling is correct.`);
									setup(0, "next");
									return;
								}
								if (client.servers.get(message.guild.id, "admin_roles").includes(role.id)) {
									message.channel.send(`<:${config.emoji.x}> This role has already been added as an admin role.`);
									setup(0, "next");
									return;
								}
								client.servers.push(message.guild.id, role.id, "admin_roles");
								message.channel.send(`<:${config.emoji.check}> Added **${role.name}** to the list of server admin roles.`);
								setup(0, "next");
							})
							.catch(e => {
								console.log(e);
								return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
							});
					});
				}
				break;
			case 1:
				//Server staff role
				switch (add) {
				case "next":
					var embed = new Discord.RichEmbed()
						.setColor(config.default_color)
						.setDescription("Any member with a server staff role can use all staff commands to manage suggestions.")
						.addField("Inputs", "You can send a role name, role ID, or role @mention in this channel");
					if (client.servers.get(message.guild.id, "staff_roles").length >= 1) embed.addField("Done setting up staff roles?", "Type `done` to go to the next step\nIf you're not done, just specify another staff role!");
					message.channel.send("**SETUP: Staff Roles**", embed).then(msg => {
						msg.channel.awaitMessages(response => response.author.id === message.author.id, {
							max: 1,
							time: 120000,
							errors: ["time"],
						})
							.then((collected) => {
								if (!collected.first().content.split(" ")[0]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
								if (collected.first().content.toLowerCase() == "done") return setup(2);
								var role;
								var possibleid = collected.first().content.split(" ")[0];
								var inputName = collected.first().content;

								if (collected.first().mentions.roles.first()) {
									role = collected.first().mentions.roles.first();
								} else if (message.guild.roles.find(r => r.name.toLowerCase() == inputName.toLowerCase())) {
									role = message.guild.roles.find(r => r.name.toLowerCase() === inputName.toLowerCase());
								} else if (message.guild.roles.get(possibleid)) {
									role = message.guild.roles.get(possibleid);
								} else {
									message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${inputName}\` on this server! Please check that the spelling is correct.`);
									setup(1, "next");
									return;
								}
								if (client.servers.get(message.guild.id, "staff_roles").includes(role.id)) {
									message.channel.send(`<:${config.emoji.x}> This role has already been added as a staff role.`);
									setup(0, "next");
									return;
								}
								client.servers.push(message.guild.id, role.id, "staff_roles");
								message.channel.send(`<:${config.emoji.check}> Added **${role.name}** to the list of server staff roles.`);
								setup(1, "next");
							})
							.catch(e => {
								console.log(e);
								return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
							});
					});
					break;
				default:
					var embed = new Discord.RichEmbed()
						.setColor(config.default_color)
						.setDescription("Any member with a server staff role can use all staff commands to manage suggestions.")
						.addField("Inputs", "You can send a role name, role ID, or role @mention in this channel");
					message.channel.send("**SETUP: Staff Roles**", embed).then(msg => {
						msg.channel.awaitMessages(response => response.author.id === message.author.id, {
							max: 1,
							time: 120000,
							errors: ["time"],
						})
							.then((collected) => {
								if (!collected.first().content.split(" ")[0]) return message.channel.send(`<:${config.emoji.x}> You must specify a role name, @mention, or ID!`);
								var role;
								var possibleid = collected.first().content.split(" ")[0];
								var inputName = collected.first().content;
								if (collected.first().mentions.roles.first()) {
									role = collected.first().mentions.roles.first();
								} else if (message.guild.roles.find(r => r.name.toLowerCase() == inputName.toLowerCase())) {
									role = message.guild.roles.find(r => r.name.toLowerCase() === inputName.toLowerCase());
								} else if (message.guild.roles.get(possibleid)) {
									role = message.guild.roles.get(possibleid);
								} else {
									message.channel.send(`<:${config.emoji.x}> I could not find a role with the name or ID \`${inputName}\` on this server! Please check that the spelling is correct.`);
									setup(1, "next");
									return;
								}
								if (client.servers.get(message.guild.id, "staff_roles").includes(role.id)) {
									message.channel.send(`<:${config.emoji.x}> This role has already been added as a staff role.`);
									setup(0, "next");
									return;
								}
								client.servers.push(message.guild.id, role.id, "staff_roles");
								message.channel.send(`<:${config.emoji.check}> Added **${role.name}** to the list of server staff roles.`);
								setup(1, "next");
							})
							.catch(e => {
								console.log(e);
								return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
							});
					});
				}
				break;
			case 2:
				//Mode
				var embed = new Discord.RichEmbed()
					.setColor(config.default_color)
					.setDescription("This is the mode for managing suggestions, either `review` or `autoapprove`")
					.addField("Review", "This mode holds all suggestions for staff review, needing to be manually approved before being posted to the suggestions channel", true)
					.addField("Autoapprove", "This mode automatically sends all suggestions to the suggestions channel, with no manual review.", true)
					.addField("Inputs", "You can send `review` for the review mode, and `autoapprove` for the autoapprove mode", false);
				message.channel.send("**SETUP: Mode**", embed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then((collected) => {
							switch (collected.first().content.split(" ")[0].toLowerCase()) {
							case "review":
								client.servers.set(message.guild.id, "review", "mode");
								message.channel.send(`<:${config.emoji.check}> Successfully set the mode for this server to **review**.`);
								setup(3);
								return;
								break;
							case "autoapprove":
							case "auto-approve":
							case "auto_approve":
								if (client.suggestions.filter(s => s.status == "awaiting_review" && s.guild == message.guild.id).array().length > 0) {
									message.channel.send(`<:${config.emoji.x}> All suggestions awaiting review must be cleared before the autoapprove mode is set.`);
									setup(2);
									return;
								}
								client.servers.set(message.guild.id, "autoapprove", "mode");
								message.channel.send(`<:${config.emoji.check}> Successfully set the mode for this server to **autoapprove**.`);
								setup(3);
								return;
								break;
							case "auto":
								if (args[2] && args[2].toLowerCase() === "approve") {
									client.servers.set(message.guild.id, "autoapprove", "mode");
									message.channel.send(`<:${config.emoji.check}> Successfully set the mode for this server to **autoapprove**.`);
									setup(3);
									return;
								} else {
									message.channel.send(`<:${config.emoji.x}> Please specify a valid mode.`);
									setup(2);
									return;
								}
								break;
							default:
								message.channel.send(`<:${config.emoji.x}> Please specify a valid mode.`);
								setup(2);
								return;
							}
						}).catch(e => {
							console.log(e);
							return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});

				break;
			case 3:
				//Suggestion channel
				var embed = new Discord.RichEmbed()
					.setColor(config.default_color)
					.setDescription("This is the channel where all suggestions are sent once they are approved")
					.addField("Inputs", "You can send a channel #mention or channel ID", false);
				message.channel.send("**SETUP: Suggestion Channel**", embed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then((collected) => {
							var channel;
							if (collected.first().mentions.channels.first()) {
								channel = collected.first().mentions.channels.first();
							} else if (message.guild.channels.get(collected.first().content.split(" ")[0])) {
								channel = message.guild.channels.get(collected.first().content.split(" ")[0]);
							} else {
								message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${collected.first().content.split(" ")[0]}\` on this server! Please check that the ID is correct or #mention a channel.`);
								setup(3);
								return;
							}
							var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "suggestions", client);
							if (perms.length > 0) {
								let embed = new Discord.RichEmbed()
									.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
									.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
									.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
									.setColor("#e74c3c");
								message.channel.send(embed);
								setup(3);
								return;
							}
							client.servers.set(message.guild.id, channel.id, "channels.suggestions");
							message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the approved suggestions channel.`);
							setup(4);
							return;
						}).catch(e => {
							console.log(e);
							return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			case 4:
				//Review channel (if mode is review)
				if (client.servers.get(message.guild.id, "mode") == "review") {
					var embed = new Discord.RichEmbed()
						.setColor(config.default_color)
						.setDescription("This is the channel where all suggestions are sent once they are suggested and awaiting review")
						.addField("Inputs", "You can send a channel #mention or channel ID", false);
					message.channel.send("**SETUP: Staff Review Channel**", embed).then(msg => {
						msg.channel.awaitMessages(response => response.author.id === message.author.id, {
							max: 1,
							time: 120000,
							errors: ["time"],
						})
							.then((collected) => {
								var channel;
								if (collected.first().mentions.channels.first()) {
									channel = collected.first().mentions.channels.first();
								} else if (message.guild.channels.get(collected.first().content.split(" ")[0])) {
									channel = message.guild.channels.get(collected.first().content.split(" ")[0]);
								} else {
									message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${collected.first().content.split(" ")[0]}\` on this server! Please check that the ID is correct or #mention a channel.`);
									setup(4);
									return;
								}
								var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "staff", client);
								if (perms.length > 0) {
									let embed = new Discord.RichEmbed()
										.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
										.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
										.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
										.setColor("#e74c3c");
									message.channel.send(embed);
									setup(4);
									return;
								}
								client.servers.set(message.guild.id, channel.id, "channels.staff");
								message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the suggestion review channel.`);
								setup(5);
								return;
							}).catch(e => {
								console.log(e);
								return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
							});
					});
				} else {
					return setup(5);
				}
				break;
			case 5:
				//Denied channel
				var embed = new Discord.RichEmbed()
					.setColor(config.default_color)
					.setDescription("This is the channel where all denied or deleted suggestions are sent")
					.addField("Inputs", "You can send a channel #mention or channel ID\nOr send `skip` to not set a denied suggestions channel (it is optional)", false);
				message.channel.send("**SETUP: Denied Suggestions Channel**", embed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then((collected) => {
							if (collected.first().content.toLowerCase() === "skip") return setup(6);
							var channel;
							if (collected.first().mentions.channels.first()) {
								channel = collected.first().mentions.channels.first();
							} else if (message.guild.channels.get(collected.first().content.split(" ")[0])) {
								channel = message.guild.channels.get(collected.first().content.split(" ")[0]);
							} else {
								message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${collected.first().content.split(" ")[0]}\` on this server! Please check that the ID is correct or #mention a channel.`);
								setup(5);
								return;
							}
							var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "denied", client);
							if (perms.length > 0) {
								let embed = new Discord.RichEmbed()
									.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
									.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
									.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
									.setColor("#e74c3c");
								message.channel.send(embed);
								setup(5);
								return;
							}
							client.servers.set(message.guild.id, channel.id, "channels.denied");
							message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the denied suggestions channel.`);
							setup(6);
							return;
						}).catch(e => {
							console.log(e);
							return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			case 6:
				//Logs
				var embed = new Discord.RichEmbed()
					.setColor(config.default_color)
					.setDescription("This is the channel where all actions on suggestions are logged")
					.addField("Inputs", "You can send a channel #mention or channel ID\nOr send `skip` to not set a log channel (it is optional)", false);
				message.channel.send("**SETUP: Log Channel**", embed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then((collected) => {
							if (collected.first().content.toLowerCase() === "skip") return setup(7);
							var channel;
							if (collected.first().mentions.channels.first()) {
								channel = collected.first().mentions.channels.first();
							} else if (message.guild.channels.get(collected.first().content.split(" ")[0])) {
								channel = message.guild.channels.get(collected.first().content.split(" ")[0]);
							} else {
								message.channel.send(`<:${config.emoji.x}> I could not find a channel with the ID \`${collected.first().content.split(" ")[0]}\` on this server! Please check that the ID is correct or #mention a channel.`);
								setup(6);
								return;
							}
							var perms = core.channelPermissions(channel.memberPermissions(client.user.id), "log", client);
							if (perms.length > 0) {
								let embed = new Discord.RichEmbed()
									.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
									.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
									.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
									.setColor("#e74c3c");
								message.channel.send(embed);
								setup(6);
								return;
							}
							client.servers.set(message.guild.id, channel.id, "channels.log");
							channel.createWebhook("Suggester Logs", client.user.displayAvatarURL, "Create log channel").then(hook => {
								client.servers.set(message.guild.id, [hook.id, hook.token], "loghook");
							});

							message.channel.send(`<:${config.emoji.check}> Successfully set <#${channel.id}> as the log channel.`);
							setup(7);
							return;
						}).catch((e) => {
							console.log(e);
							return message.channel.send(`<:${config.emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			case 7:
				//Prefix
				var embed = new Discord.RichEmbed()
					.setColor(config.default_color)
					.setDescription("This is the text you put before the command to trigger the bot.");
				var oldPrefix = "undefined";
				if (client.servers.get(message.guild.id) && client.servers.get(message.guild.id, "prefix")) {
					oldPrefix = client.servers.get(message.guild.id, "prefix");
				} else {
					oldPrefix = config.prefix;
				}
				embed.addField("Inputs", `Any string with no spaces\nOr send \`skip\` to keep the same prefix of **${oldPrefix}**`, false);
				message.channel.send("**SETUP: Prefix**", embed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then((collected) => {
							var prefix = collected.first().content.split(" ")[0];
							if (prefix === "skip") {
								setup(8);
								return;
							}
							var disallowed = ["suggester:"];
							if (disallowed.includes(prefix.toLowerCase())) {
								message.channel.send(`<:${config.emoji.x}> This prefix is disallowed`);
								setup(7);
								return;
							}
							client.servers.set(message.guild.id, prefix, "prefix");
							message.channel.send(`<:${config.emoji.check}> Successfully set this server's prefix to **${prefix}**`);
							setup(8);
						});
				});
				break;
			case 8:
				var embed = new Discord.RichEmbed()
					.setTitle("Setup Complete!")
					.setColor(config.default_color)
					.setDescription(`The bot should now work in your server, try it out with \`${client.servers.get(message.guild.id, "prefix")}suggest\`!`)
					.addField("Additional Configuration", "There are a few other configuration options such as reaction emojis, user notifications, and more! See https://suggester.gitbook.io/docs/admin/config for more information.");
				message.channel.send(embed);
				break;
			}
		}

		if (client.servers.get(message.guild.id)) {
			message.channel.send(`:warning: Your server already has some configuration elements specified. :warning:\n**This setup will overwrite your previous configuration, and this choice is final.**\n\nIf you would still like to continue with setup, click the <:${config.emoji.check}> reaction. If you would like to abort setup, click the <:${config.emoji.x}> reaction.`).then(checkMsg => {
				setTimeout(function () {
					checkMsg.react(config.emoji.check);
					setTimeout(function () {
						checkMsg.react(config.emoji.x);
						setTimeout(function () {
							var origcheck = config.emoji.check.split(":");
							var check = origcheck[origcheck.length - 1];
							var origx = config.emoji.x.split(":");
							var x = origx[origx.length - 1];

							const filter = (reaction, user) =>
								(reaction.emoji.id === check || reaction.emoji.id === x) &&
								user.id === message.author.id;
							checkMsg
								.awaitReactions(filter, {
									time: 15000,
									max: 1,
									errors: ["time"]
								})
								.then(collected => {
									if (collected.first().emoji.id === x) {
										checkMsg.edit(`<:${config.emoji.x}> **Setup Cancelled**`);
										checkMsg.clearReactions();
										return;
									} else {
										checkMsg.delete();
										client.servers.set(message.guild.id, {
											prefix: config.prefix,
											admin_roles: [],
											staff_roles: [],
											channels: {
												suggestions: "",
												staff: "",
												denied: ""
											},
											gold_threshold: 20,
											notify: true,
											react: true,
											mode: "review",
											emojis: {
												up: "👍",
												mid: "🤷",
												down: "👎"
											}
										});
										setup(0);
									}
								});
						}, 100);
					}, 100);
				}, 2500);
			});
		} else {
			client.servers.set(message.guild.id, {
				prefix: config.prefix,
				admin_roles: [],
				staff_roles: [],
				channels: {
					suggestions: "",
					staff: "",
					denied: ""
				},
				gold_threshold: 20,
				notify: true,
				react: true,
				mode: "review",
				emojis: {
					up: "👍",
					mid: "🤷",
					down: "👎"
				}
			});
			setup(0);
		}

	}
};
