const { emoji, colors } = require("../config.json");
const { dbQuery, dbModify, dbQueryNoNew, channelPermissions } = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 2,
		usage: "setup",
		description: "Initiates a walkthrough for server configuration",
		enabled: true,
		docs: "admin/setup",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"]
	},
	do: async (message, client, args, Discord) => {
		async function setup (through)  {
			let qServerDB = await dbQuery("Server", {id: message.guild.id});
			switch (through) {
			case 0: {
				//Server Admin role
				let adminRolesEmbed = new Discord.RichEmbed()
					.setColor(colors.default)
					.setDescription("Any member with a server admin role can use all staff commands, as well as edit bot configuration. Anyone who has the `Manage Server` permission is automatically counted as an admin.")
					.addField("Inputs", "You can send a role name, role ID, or role @mention in this channel");
				if (qServerDB.config.admin_roles.length >= 1) adminRolesEmbed.addField("Done setting up admin roles?", "Type `done` to go to the next step\nIf you're not done, just specify another admin role!");
				message.channel.send("**SETUP: Admin Roles**", adminRolesEmbed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then(async (collected) => {
							if (!collected.first().content.split(" ")[0]) {
								message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
								setup(0);
								return;
							}
							if (collected.first().content.toLowerCase() === "done" && qServerDB.config.admin_roles.length >= 1) return setup(1);

							let role = collected.first().mentions.roles.first() || message.guild.roles.find(r => r.name.toLowerCase() === collected.first().content.toLowerCase()) || message.guild.roles.find(r => r.id === collected.first().content.split(" ")[0]) || null;

							if (!role) {
								message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Please make sure that you are specifying a **role mention**, **role name**, or **role ID**.`);
								setup(0);
								return;
							}

							if (qServerDB.config.admin_roles.includes(role.id)) {
								message.channel.send(`<:${emoji.x}> This role has already been added as an admin role.`);
								setup(0);
								return;
							}

							await qServerDB.config.admin_roles.push(role.id);
							await dbModify("Server", { id: message.guild.id }, qServerDB);

							message.channel.send(`<:${emoji.check}> Added **${role.name}** to the list of server admin roles.`);
							setup(0);
						})
						.catch(e => {
							console.log(e);
							return message.channel.send(`<:${emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			}
			case 1: {
				let staffRolesEmbed = new Discord.RichEmbed()
					.setColor(colors.default)
					.setDescription("Any member with a server staff role can use all staff commands to manage suggestions.")
					.addField("Inputs", "You can send a role name, role ID, or role @mention in this channel");
				if (qServerDB.config.staff_roles.length >= 1) staffRolesEmbed.addField("Done setting up staff roles?", "Type `done` to go to the next step\nIf you're not done, just specify another staff role!");
				message.channel.send("**SETUP: Staff Roles**", staffRolesEmbed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then(async (collected) => {
							if (!collected.first().content.split(" ")[0]) {
								message.channel.send(`<:${emoji.x}> You must specify a role name, @mention, or ID!`);
								setup(1);
								return;
							}

							if (collected.first().content.toLowerCase() === "done" && qServerDB.config.staff_roles.length >= 1) return setup(2);

							let role = collected.first().mentions.roles.first() || message.guild.roles.find(r => r.name.toLowerCase() === collected.first().content.toLowerCase()) || message.guild.roles.find(r => r.id === collected.first().content.split(" ")[0]) || null;

							if (!role) {
								message.channel.send(`<:${emoji.x}> I could not find a role based on your input! Please make sure that you are specifying a **role mention**, **role name**, or **role ID**.`);
								setup(1);
								return;
							}

							if (qServerDB.config.staff_roles.includes(role.id)) {
								message.channel.send(`<:${emoji.x}> This role has already been added as a staff role.`);
								setup(1);
								return;
							}

							await qServerDB.config.staff_roles.push(role.id);
							await dbModify("Server", { id: message.guild.id }, qServerDB);

							message.channel.send(`<:${emoji.check}> Added **${role.name}** to the list of server staff roles.`);
							setup(1);
						})
						.catch(e => {
							console.log(e);
							return message.channel.send(`<:${emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			}
			case 2: {
				//Mode
				let modeEmbed = new Discord.RichEmbed()
					.setColor(colors.default)
					.setDescription("This is the mode for managing suggestions, either `review` or `autoapprove`")
					.addField("Review", "This mode holds all suggestions for staff review, needing to be manually approved before being posted to the suggestions channel", true)
					.addField("Autoapprove", "This mode automatically sends all suggestions to the suggestions channel, with no manual review.", true)
					.addField("Inputs", "You can send `review` for the review mode, and `autoapprove` for the autoapprove mode", false);
				message.channel.send("**SETUP: Mode**", modeEmbed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then(async (collected) => {
							switch (collected.first().content.split(" ")[0].toLowerCase()) {
							case "review":
								qServerDB.mode = "review";
								await dbModify("Server", {id: message.guild.id}, qServerDB);

								message.channel.send(`<:${emoji.check}> Successfully set the mode for this server to **review**.`);
								setup(3);
								return;
							case "autoapprove":
							case "auto-approve":
							case "auto_approve":
							case "auto": {
								let suggestionsAwaitingReview = await dbQueryNoNew("Suggestion", {status: "awaiting_review", id: message.guild.id});
								if (suggestionsAwaitingReview) {
									message.channel.send(`<:${emoji.x}> All suggestions awaiting review must be cleared before the autoapprove mode is set.`);
									setup(2);
									return;
								}
								qServerDB.config.mode = "autoapprove";
								await dbModify("Server", {id: message.guild.id}, qServerDB);

								message.channel.send(`<:${emoji.check}> Successfully set the mode for this server to **autoapprove**.`);
								setup(3);
								return;
							}
							default:
								message.channel.send(`<:${emoji.x}> Please specify a valid mode.`);
								setup(2);
								return;
							}
						}).catch(e => {
							console.log(e);
							return message.channel.send(`<:${emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});

				break;
			}
			case 3: {
				//Suggestion channel
				let suggestionChannelEmbed = new Discord.RichEmbed()
					.setColor(colors.default)
					.setDescription("This is the channel where all suggestions are sent once they are approved")
					.addField("Inputs", "You can send a channel #mention, channel ID, or channel name", false);
				message.channel.send("**SETUP: Suggestion Channel**", suggestionChannelEmbed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then(async (collected) => {
							let input = collected.first().content.split(" ")[0].toLowerCase();
							let channel = collected.first().mentions.channels.first() || message.guild.channels.find(channel => channel.id === input) || message.guild.channels.find(channel => channel.name === input) || null;
							if (!channel) {
								message.channel.send(`<:${emoji.x}> I could not find a channel based on your input! Please make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
								setup(3);
								return;
							}
							let perms = channelPermissions(channel.memberPermissions(client.user.id), "suggestions", client);
							if (perms.length > 0) {
								let suggestionChannelPermissionsMissingEmbed = new Discord.RichEmbed()
									.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
									.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
									.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
									.setColor(colors.red);
								message.channel.send(suggestionChannelPermissionsMissingEmbed);
								setup(3);
								return;
							}
							qServerDB.config.channels.suggestions = channel.id;
							await dbModify("Server", {id: message.guild.id}, qServerDB);
							message.channel.send(`<:${emoji.check}> Successfully set <#${channel.id}> as the approved suggestions channel.`);
							setup(4);
							return;
						}).catch(e => {
							console.log(e);
							return message.channel.send(`<:${emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			}
			case 4:
				//Review channel (if mode is review)
				if (qServerDB.config.mode === "review") {
					let reviewChannelEmbed = new Discord.RichEmbed()
						.setColor(colors.default)
						.setDescription("This is the channel where all suggestions are sent once they are suggested and awaiting review")
						.addField("Inputs", "You can send a channel #mention, channel ID, or channel name", false);
					message.channel.send("**SETUP: Suggestion Review Channel**", reviewChannelEmbed).then(msg => {
						msg.channel.awaitMessages(response => response.author.id === message.author.id, {
							max: 1,
							time: 120000,
							errors: ["time"],
						})
							.then(async (collected) => {
								let input = collected.first().content.split(" ")[0].toLowerCase();
								let channel = collected.first().mentions.channels.first() || message.guild.channels.find(channel => channel.id === input) || message.guild.channels.find(channel => channel.name === input) || null;
								if (!channel) {
									message.channel.send(`<:${emoji.x}> I could not find a channel based on your input! Please make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
									setup(4);
									return;
								}
								let perms = channelPermissions(channel.memberPermissions(client.user.id), "staff", client);
								if (perms.length > 0) {
									let reviewChannelPermissionsMissingEmbed = new Discord.RichEmbed()
										.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
										.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
										.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
										.setColor(colors.red);
									message.channel.send(reviewChannelPermissionsMissingEmbed);
									setup(4);
									return;
								}
								qServerDB.config.channels.staff = channel.id;
								await dbModify("Server", {id: message.guild.id}, qServerDB);
								message.channel.send(`<:${emoji.check}> Successfully set <#${channel.id}> as the suggestion review channel.`);
								setup(5);
								return;
							}).catch(e => {
								console.log(e);
								return message.channel.send(`<:${emoji.x}> **Setup Timed Out**\nPlease restart setup`);
							});
					});
				} else {
					return setup(5);
				}
				break;
			case 5: {
				//Denied channel
				let deniedChannelEmbed = new Discord.RichEmbed()
					.setColor(colors.default)
					.setDescription("This is the channel where all denied or deleted suggestions are sent")
					.addField("Inputs", "You can send a channel #mention, channel ID, or channel name\nOr send `skip` to not set a denied suggestions channel (it is optional)", false);
				message.channel.send("**SETUP: Denied Suggestions Channel**", deniedChannelEmbed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then(async (collected) => {
							if (collected.first().content.toLowerCase() === "skip") {
								message.channel.send(`<:${emoji.check}> Skipped setting a denied suggestions channel`);
								setup(6);
								return;
							}
							let input = collected.first().content.split(" ")[0].toLowerCase();
							let channel = collected.first().mentions.channels.first() || message.guild.channels.find(channel => channel.id === input) || message.guild.channels.find(channel => channel.name === input) || null;
							if (!channel) {
								message.channel.send(`<:${emoji.x}> I could not find a channel based on your input! Please make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
								setup(5);
								return;
							}
							let perms = channelPermissions(channel.memberPermissions(client.user.id), "denied", client);
							if (perms.length > 0) {
								let deniedChannelPermissionsMissingEmbed = new Discord.RichEmbed()
									.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
									.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
									.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
									.setColor(colors.red);
								message.channel.send(deniedChannelPermissionsMissingEmbed);
								setup(5);
								return;
							}
							qServerDB.config.channels.denied = channel.id;
							await dbModify("Server", {id: message.guild.id}, qServerDB);
							message.channel.send(`<:${emoji.check}> Successfully set <#${channel.id}> as the denied suggestions channel.`);
							setup(6);
							return;
						}).catch(e => {
							console.log(e);
							return message.channel.send(`<:${emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			}
			case 6: {
				//Logs
				let logChannelEmbed = new Discord.RichEmbed()
					.setColor(colors.default)
					.setDescription("This is the channel where all actions on suggestions are logged")
					.addField("Inputs", "You can send a channel #mention, channel ID, or channel name\nOr send `skip` to not set a log channel (it is optional)", false);
				message.channel.send("**SETUP: Log Channel**", logChannelEmbed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then(async (collected) => {
							if (collected.first().content.toLowerCase() === "skip") {
								message.channel.send(`<:${emoji.check}> Skipped setting a log channel`);
								setup(7);
								return;
							}
							let input = collected.first().content.split(" ")[0].toLowerCase();
							let channel = collected.first().mentions.channels.first() || message.guild.channels.find(channel => channel.id === input) || message.guild.channels.find(channel => channel.name === input) || null;
							if (!channel) {
								message.channel.send(`<:${emoji.x}> I could not find a channel based on your input! Please make sure to specify a **channel #mention**, **channel ID**, or **channel name**.`);
								setup(6);
								return;
							}
							let perms = channelPermissions(channel.memberPermissions(client.user.id), "log", client);
							if (perms.length > 0) {
								let logChannelPermissionsMissingEmbed = new Discord.RichEmbed()
									.setDescription(`This channel cannot be configured because ${client.user.username} is missing some permissions. ${client.user.username} needs the following permissions in the <#${channel.id}> channel:`)
									.addField("Missing Elements", `<:${emoji.x}> ${perms.join(`\n<:${emoji.x}> `)}`)
									.addField("How to Fix", `In the channel settings for <#${channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
									.setColor(colors.red);
								message.channel.send(logChannelPermissionsMissingEmbed);
								setup(6);
								return;
							}
							qServerDB.config.channels.log = channel.id;
							await channel.createWebhook("Suggester Logs", client.user.displayAvatarURL, "Create log channel from setup").then(async (webhook) => {
								qServerDB.config.loghook.id = webhook.id;
								qServerDB.config.loghook.token = webhook.token;

								await dbModify("Server", {id: message.guild.id}, qServerDB);

								message.channel.send(`<:${emoji.check}> Successfully set <#${channel.id}> as the log channel.`);
								setup(7);
								return;
							}).catch(() => {
								message.channel.send(`<:${emoji.x}> I was unable to create a webhook in the provided channel. Please make sure that you have less than 10 webhooks in the channel and try again.`);
								setup(6);
								return;
							});
						}).catch((e) => {
							console.log(e);
							return message.channel.send(`<:${emoji.x}> **Setup Timed Out**\nPlease restart setup`);
						});
				});
				break;
			}
			case 7: {
				//Prefix
				let prefixEmbed = new Discord.RichEmbed()
					.setColor(colors.default)
					.setDescription("This is the text you put before the command to trigger the bot.")
					.addField("Inputs", "Any string with no spaces", false);
				message.channel.send("**SETUP: Prefix**", prefixEmbed).then(msg => {
					msg.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 120000,
						errors: ["time"],
					})
						.then(async (collected) => {
							let prefix = collected.first().content.split(" ")[0];
							let disallowed = ["suggester:", `${client.user.id}:`];
							if (disallowed.includes(prefix.toLowerCase())) {
								message.channel.send(`<:${emoji.x}> This prefix is disallowed, please choose a different one.`);
								setup(7);
								return;
							}
							if (prefix.length > 20) {
								message.channel.send(`<:${emoji.x}> Your prefix must be 20 characters or less.`);
								setup(7);
								return;
							}
							qServerDB.config.prefix = prefix.toLowerCase();
							await dbModify("Server", {id: message.guild.id}, qServerDB);
							message.channel.send(`<:${emoji.check}> Successfully set this server's prefix to ${prefix.toLowerCase()}`);
							setup(8);
						});
				});
				break;
			}
			case 8: {
				let doneEmbed = new Discord.RichEmbed()
					.setTitle("Setup Complete!")
					.setColor(colors.default)
					.setDescription(`The bot should now work in your server, try it out with \`${qServerDB.config.prefix}suggest\`!`)
					.addField("Additional Configuration", "There are a few other configuration options such as reaction emojis, user notifications, and more! See https://suggester.gitbook.io/docs/admin/config for more information.");
				message.channel.send(doneEmbed);
				break;
			}
			}
		}

		let qServerDB = await dbQuery("Server", {id: message.guild.id});

		if (qServerDB) {
			message.channel.send(`:warning: Your server already has some configuration elements specified. :warning:\n**This setup will overwrite your previous configuration, and this choice is final.**\n\nIf you would still like to continue with setup, click the <:${emoji.check}> reaction. If you would like to abort setup, click the <:${emoji.x}> reaction.`).then(async (checkMsg) => {
				await checkMsg.react(emoji.check);
				await checkMsg.react(emoji.x);
				let origcheck = emoji.check.split(":");
				let check = origcheck[origcheck.length - 1];
				let origx = emoji.x.split(":");
				let x = origx[origx.length - 1];

				const filter = (reaction, user) =>
					(reaction.emoji.id === check || reaction.emoji.id === x) &&
					user.id === message.author.id;
				await checkMsg
					.awaitReactions(filter, {
						time: 15000,
						max: 1,
						errors: ["time"]
					})
					.then(async (collected) => {
						if (collected.first().emoji.id === x) {
							return checkMsg.edit(`<:${emoji.x}> **Setup Cancelled**`);
						} else {
							checkMsg.delete();

							await dbModify("Server", {id: message.guild.id}, {
								id: message.guild.id,
								blocked: false,
								whitelist: false,
								config: {
									prefix: ".",
									admin_roles: [],
									staff_roles: [],
									channels: {
										suggestions: "",
										staff: "",
										log: "",
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
									},
									loghook: {
										id: "",
										token: ""
									}
								}
							});

							setup(0);
						}
					});
			});
		} else {
			const {Server} = require("../utils/schemas");
			await new Server({
				id: message.guild.id,
				blocked: false,
				whitelist: false,
				config: {
					prefix: ".",
					admin_roles: [],
					staff_roles: [],
					channels: {
						suggestions: "",
						staff: "",
						log: "",
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
					},
					loghook: {
						id: "",
						token: ""
					}
				}
			}).save();
			setup(0);
		}

	}
};
