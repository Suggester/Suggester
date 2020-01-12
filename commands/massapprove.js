const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "massapprove <suggestion ids> -r (reason)",
		aliases: ["mapprove", "multiapprove"],
		description: "Approves all specified suggestions",
		enabled: true,
		hidden: false,
		docs: "staff/massapprove",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {
		if (client.servers.get(message.guild.id, "mode") === "autoapprove") return message.channel.send(`<:${config.emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

		var missingConfigs = [];
		if (!client.servers.get(message.guild.id)) return message.channel.send(`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`);
		if (!client.servers.get(message.guild.id, "admin_roles") || client.servers.get(message.guild.id, "admin_roles").length < 1) missingConfigs.push("Server Admin Roles");
		if (!client.servers.get(message.guild.id, "staff_roles") || client.servers.get(message.guild.id, "staff_roles").length < 1) missingConfigs.push("Server Staff Roles");
		if (!client.servers.get(message.guild.id, "channels.suggestions") || !client.channels.get(client.servers.get(message.guild.id, "channels.suggestions"))) missingConfigs.push("Approved Suggestions Channel");
		if (client.servers.get(message.guild.id, "mode") === "review" && (!client.servers.get(message.guild.id, "channels.staff") || !client.channels.get(client.servers.get(message.guild.id, "channels.staff")))) missingConfigs.push("Suggestion Review Channel");

		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${client.servers.get(message.guild.id, "prefix")}config\` command.`)
				.addField("Missing Elements", `<:${config.emoji.x}> ${missingConfigs.join(`\n<:${config.emoji.x}> `)}`)
				.setColor("#e74c3c");
			return message.channel.send(embed);
		}

		if (client.channels.get(client.servers.get(message.guild.id, "channels.suggestions"))) {
			var perms = core.channelPermissions(client.channels.get(client.servers.get(message.guild.id, "channels.suggestions")).memberPermissions(client.user.id), "suggestions", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${client.servers.get(message.guild.id, "channels.suggestions")}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${client.servers.get(message.guild.id, "channels.suggestions")}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${config.emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestion channel.`);
		}

		if (client.channels.get(client.servers.get(message.guild.id, "channels.staff"))) {
			var perms = core.channelPermissions(client.channels.get(client.servers.get(message.guild.id, "channels.staff")).memberPermissions(client.user.id), "staff", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${client.servers.get(message.guild.id, "channels.staff")}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${client.servers.get(message.guild.id, "channels.staff")}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${config.emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
		}

		if (!args[0]) return message.channel.send("You must specify at least one suggestion!");
		var reasonSplit = args.join(" ").split("-r");
		if (reasonSplit[1]) var reason = reasonSplit[1].split(" ").splice(1).join(" ");
		var suggestions = reasonSplit[0].split(" ");

		function asyncFunction (inputSuggestion, cb) {
			setTimeout(() => {
				cb();
			}, 100);
		}

		var failLog = [];
		var completedArr = [];
		var completed = 0;
		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		console.log(suggestions);
		message.channel.send("Processing... this may take a moment").then(msg => {
			let requests = suggestions.reduce((promiseChain, inputSuggestion) => {
				return promiseChain.then(() => new Promise((resolve) => {
					var failedYet = false;
					if (!inputSuggestion || !client.suggestions.find(s => s.id.toString() == inputSuggestion && s.guild == message.guild.id)) {
						failLog.push(`[${inputSuggestion}] Invalid suggestion ID`);
						failedYet = true;
						asyncFunction(inputSuggestion, resolve);
					}
					if (!failedYet) {
						var suggestion = client.suggestions.find(s => s.id.toString() == inputSuggestion && s.guild == message.guild.id);
						var id = suggestion.id;
						console.log(suggestion);
						if (suggestion.status !== "awaiting_review") {
							switch (suggestion.status) {
							case "approved":
								console.log(`[${inputSuggestion}] Already approved`);
								failLog.push(`[${inputSuggestion}] Already approved`);
								failedYet = true;
								asyncFunction(inputSuggestion, resolve);
								break;
							case "denied":
								console.log(`[${inputSuggestion}] Already denied/deleted`);
								failLog.push(`[${inputSuggestion}] Already denied/deleted`);
								failedYet = true;
								asyncFunction(inputSuggestion, resolve);
								break;
							}
						}
						if (!failedYet) {

							var suggester;
							if (client.users.get(client.suggestions.get(id, "suggester"))) {
								suggester = client.users.get(client.suggestions.get(id, "suggester"));
							} else {
								var found = false;
								var sent = false;
								client.fetchUser(client.users.get(client.suggestions.get(id, "suggester")), true).then(user => {
									suggester = user;
									found = true;
								}).catch(notFound => {
									found = false;
									sent = true;
									failLog.push(`[${inputSuggestion}] Could not find suggestion author`);
									failedYet = true;
									asyncFunction(inputSuggestion, resolve);
								});

								if (!suggester && !found && !sent) {
									failLog.push(`[${inputSuggestion}] Could not find suggestion author`);
									failedYet = true;
									asyncFunction(inputSuggestion, resolve);
								}

							}

							if (!failedYet) {
								client.suggestions.set(id, "approved", "status");
								client.suggestions.set(id, message.author.id, "staff_member");
								client.suggestions.set(id, {
									"upvotes": 0,
									"downvotes": 0
								}, "votes");
								var isComment = false;
								if (reason) {
									client.suggestions.set(id, [{
										"comment": reason,
										"author": message.author.id,
										"id": 1
									}], "comments");
									isComment = true;
								}

								var messageid;
								client.suggestions.set(id, {}, "emojis");
								client.channels.get(client.servers.get(message.guild.id, "channels.suggestions")).send(core.suggestionEmbed(client.suggestions.get(id), client)).then(posted => {
									client.suggestions.set(id, posted.id, "messageid");
									if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") == true) {
										let dmEmbed = new Discord.RichEmbed()
											.setTitle("Your Suggestion Was Approved!")
											.setFooter(`Suggestion ID: ${id.toString()}`)
											.setDescription(client.suggestions.get(id, "suggestion"))
											.addField("Suggestions Feed Post", `[Jump to post](https://discordapp.com/channels/${client.suggestions.get(id, "guild")}/${client.servers.get(client.suggestions.get(id, "guild"), "channels.suggestions")}/${posted.id})`)
											.setColor("#2ecc71");
										isComment ? dmEmbed.addField("Comment Added", reason) : "";
										suggester.send(dmEmbed).catch(err => {});
									}
									if (!client.servers.get(message.guild.id, "emojis.up")) {
										var reactEmojiUp = config.initial.reactions.upvote;
									} else {
										var reactEmojiUp = client.servers.get(message.guild.id, "emojis.up");
									}
									posted.react(reactEmojiUp);
									client.suggestions.set(id, reactEmojiUp, "emojis.up");
									setTimeout(function () {
										if (!client.servers.get(message.guild.id, "emojis.mid")) {
											var reactEmojiMid = config.initial.reactions.shrug;
										} else {
											var reactEmojiMid = client.servers.get(message.guild.id, "emojis.mid");
										}
										posted.react(reactEmojiMid);
										client.suggestions.set(id, reactEmojiMid, "emojis.mid");
									}, 1500);
									setTimeout(function () {
										if (!client.servers.get(message.guild.id, "emojis.down")) {
											var reactEmojiDown = config.initial.reactions.downvote;
										} else {
											var reactEmojiDown = client.servers.get(message.guild.id, "emojis.down");
										}
										posted.react(reactEmojiDown);
										client.suggestions.set(id, reactEmojiDown, "emojis.down");
									}, 3000);
								});

								if (client.servers.get(message.guild.id, "channels.log")) {
									let logEmbed = new Discord.RichEmbed()
										.setAuthor(`${message.author.tag} approved #${id.toString()}`, message.author.displayAvatarURL)
										.addField("Suggestion", suggestion.suggestion)
										.setFooter(`Suggestion ID: ${id.toString()} | Approver ID: ${message.author.id}`)
										.setTimestamp()
										.setColor("#2ecc71");
									isComment ? logEmbed.addField("Comment Added by Approver", reason) : "";
									core.serverLog(logEmbed, message.guild.id, client);
								}

								let updateEmbed = new Discord.RichEmbed()
									.setTitle("Suggestion Awaiting Review (#" + id.toString() + ")")
									.setAuthor(`${message.author.tag} (ID: ${message.author.id})`, message.author.displayAvatarURL)
									.setDescription(suggestion.suggestion)
									.setColor("#2ecc71")
									.addField("A change was processed on this suggestion", "This suggestion has been approved");
								client.channels.get(client.servers.get(message.guild.id, "channels.staff")).fetchMessage(client.suggestions.get(id, "reviewMessage")).then(fetched => fetched.edit(updateEmbed));

								completed++;
								completedArr.push(inputSuggestion);
								asyncFunction(inputSuggestion, resolve);
							}
						}
					}
				})
				);
			}, Promise.resolve());

			requests.then(() => {
				setTimeout(function () {
					let embed = new Discord.RichEmbed();

					if (completed > 0) {
						embed.setDescription(`<:${config.emoji.check}> Successfully approved ${completed.toString()}/${suggestions.length.toString()} suggestions`)
							.setColor("#2ecc71");
					} else {
						embed.setDescription(`<:${config.emoji.x}> Approved ${completed.toString()}/${suggestions.length.toString()} suggestions`)
							.setColor("#e74c3c");
					}
					if (failLog.length > 0) embed.addField("Error Logs", `\`\`\`ini\n${failLog.join("\n")}\`\`\``);
					msg.edit(embed);
				}, 1200);

			}).catch(e => console.error(e));
		});
	}
};


