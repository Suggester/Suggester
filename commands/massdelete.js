const config = require("../config.json");
const core = require("../coreFunctions.js");
module.exports = {
	controls: {
		permission: 3,
		usage: "massdelete <suggestion ids> -r (reason)",
		aliases: ["mdelete", "multidelete"],
		description: "Deletes all specified suggestions",
		enabled: true,
		docs: "staff/massdelete",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: (message, client, args, Discord) => {

		var missingConfigs = [];
		if (!client.servers.get(message.guild.id)) {
			return message.channel.send(
				`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`
			);
		}
		if (
			!client.servers.get(message.guild.id, "admin_roles") ||
			client.servers.get(message.guild.id, "admin_roles").length < 1
		) {
			missingConfigs.push("Server Admin Roles");
		}
		if (
			!client.servers.get(message.guild.id, "staff_roles") ||
			client.servers.get(message.guild.id, "staff_roles").length < 1
		) {
			missingConfigs.push("Server Staff Roles");
		}
		if (
			!client.servers.get(message.guild.id, "channels.suggestions") ||
			!client.channels.get(
				client.servers.get(message.guild.id, "channels.suggestions")
			)
		) {
			missingConfigs.push("Approved Suggestions Channel");
		}
		if (
			client.servers.get(message.guild.id, "mode") === "review" &&
			(!client.servers.get(message.guild.id, "channels.staff") ||
				!client.channels.get(
					client.servers.get(message.guild.id, "channels.staff")
				))
		) {
			missingConfigs.push("Suggestion Review Channel");
		}

		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed();
			embed.setDescription(
				`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${client.servers.get(
					message.guild.id,
					"prefix"
				)}config\` command.`
			);
			embed.addField(
				"Missing Elements",
				`<:${config.emoji.x}> ${missingConfigs.join(`\n<:${config.emoji.x}> `)}`
			);
			embed.setColor("#e74c3c");
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

		if (
			client.channels.get(
				client.servers.get(message.guild.id, "channels.denied")
			)
		) {
			var perms = core.channelPermissions(
				client.channels
					.get(client.servers.get(message.guild.id, "channels.denied"))
					.memberPermissions(client.user.id),
				"suggestions",
				client
			);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed();
				embed.setDescription(
					`This command cannot be run because some permissions are missing. ${
						client.user.username
					} needs the following permissions in the <#${client.servers.get(
						message.guild.id,
						"channels.suggestions"
					)}> channel:`
				);
				embed.addField(
					"Missing Elements",
					`<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`
				);
				embed.addField(
					"How to Fix",
					`In the channel settings for <#${client.servers.get(
						message.guild.id,
						"channels.denied"
					)}>, make sure that **${client.user.username}** has a <:${
						config.emoji.check
					}> for the above permissions.`
				);
				embed.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(
				`<:${config.emoji.x}> Could not find your denied suggestions channel, even though there is one set!`
			);
		}

		if (
			client.channels.get(
				client.servers.get(message.guild.id, "channels.staff")
			)
		) {
			var perms = core.channelPermissions(
				client.channels
					.get(client.servers.get(message.guild.id, "channels.staff"))
					.memberPermissions(client.user.id),
				"staff",
				client
			);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed();
				embed.setDescription(
					`This command cannot be run because some permissions are missing. ${
						client.user.username
					} needs the following permissions in the <#${client.servers.get(
						message.guild.id,
						"channels.staff"
					)}> channel:`
				);
				embed.addField(
					"Missing Elements",
					`<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`
				);
				embed.addField(
					"How to Fix",
					`In the channel settings for <#${client.servers.get(
						message.guild.id,
						"channels.staff"
					)}>, make sure that **${client.user.username}** has a <:${
						config.emoji.check
					}> for the above permissions.`
				);
				embed.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(
				`<:${config.emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`
			);
		}

		if (!args[0]) {
			return message.channel.send("You must specify at least one suggestion!");
		}
		var reasonSplit = args.join(" ").split("-r");
		if (reasonSplit[1]) {
			var reason = reasonSplit[1]
				.split(" ")
				.splice(1)
				.join(" ");
		}
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
		message.channel
			.send("Processing... this may take a moment")
			.then(msg => {
				let requests = suggestions.reduce((promiseChain, inputSuggestion) => {
					return promiseChain.then(
						() =>
							new Promise(resolve => {
								var failedYet = false;
								if (
									!inputSuggestion ||
									!client.suggestions.find(
										s =>
											s.id.toString() == inputSuggestion &&
											s.guild == message.guild.id
									)
								) {
									failLog.push(`[${inputSuggestion}] Invalid suggestion ID`);
									failedYet = true;
									asyncFunction(inputSuggestion, resolve);
								}
								if (!failedYet) {
									console.log("WE IN HERE0");
									var suggestion = client.suggestions.find(
										s =>
											s.id.toString() == inputSuggestion &&
											s.guild == message.guild.id
									);
									var id = suggestion.id;
									console.log(suggestion);
									if (suggestion.status !== "approved") {
										failLog.push(`[${inputSuggestion}] Not approved`);
										failedYet = true;
										asyncFunction(inputSuggestion, resolve);
									}
									if (!failedYet) {
										console.log("WE IN HERE1");
										var suggester;
										if (client.users.get(client.suggestions.get(id, "suggester"))) {
											suggester = client.users.get(
												client.suggestions.get(id, "suggester")
											);

										} else {
											var found = false;
											var sent = false;
											client
												.fetchUser(
													client.users.get(client.suggestions.get(id, "suggester")),
													true
												)
												.then(user => {
													console.log("1");
													suggester = user;
													found = true;
												})
												.catch(() => {
													console.log("2");
													found = false;
													sent = true;
													failLog.push(
														`[${inputSuggestion}] Could not find suggestion author`
													);
													failedYet = true;
													asyncFunction(inputSuggestion, resolve);
												});
										}

										if (!suggester && !found && !sent) {
											console.log("3");
											failLog.push(
												`[${inputSuggestion}] Could not find suggestion author`
											);
											failedYet = true;
											asyncFunction(inputSuggestion, resolve);
										}
										if (!failedYet) {
											console.log("WE IN HERE2");
											client.suggestions.set(id, "denied", "status");
											client.suggestions.set(
												id,
												message.author.id,
												"staff_member"
											);

											if (reason) {
												client.suggestions.set(id, reason, "denial_reason");
											}

											client.channels.get(client.servers.get(message.guild.id, "channels.suggestions")).fetchMessage(suggestion.messageid).then(m => m.delete()).catch(e => {});

											if (client.servers.get(message.guild.id, "notify") && client.servers.get(message.guild.id, "notify") == true) {
												let dmEmbed = new Discord.RichEmbed()
													.setTitle("Your Suggestion Was Deleted")
													.setFooter(`Suggestion ID: ${id.toString()}`)
													.setDescription(suggestion.suggestion)
													.setColor("#e74c3c");
												reason ? dmEmbed.addField("Reason Given", reason) : "";
												suggester.send(dmEmbed).catch(err => console.log(err));
											}

											if (
												suggestion.reviewMessage &&
												client.channels.get(
													client.servers.get(message.guild.id, "channels.staff")
												)
											) {
												let updateEmbed = new Discord.RichEmbed()
													.setTitle(
														"Suggestion Awaiting Review (#" + id.toString() + ")"
													)
													.setAuthor(
														`${suggester.tag} (ID: ${suggester.id})`,
														suggester.displayAvatarURL
													)
													.setDescription(suggestion.suggestion)
													.setColor("#e74c3c")
													.addField(
														"A change was processed on this suggestion",
														"This suggestion has been deleted"
													);
												client.channels
													.get(
														client.servers.get(message.guild.id, "channels.staff")
													)
													.fetchMessage(
														client.suggestions.get(id, "reviewMessage")
													)
													.then(fetched => fetched.edit(updateEmbed));
											}

											if (
												client.servers.get(suggestion.guild, "channels.denied")
											) {
												let deniedEmbed = new Discord.RichEmbed()
													.setTitle("Suggestion Deleted")
													.setAuthor(
														`Suggestion from ${suggester.tag} (${suggester.id})`
													)
													.setThumbnail(suggester.displayAvatarURL)
													.setDescription(suggestion.suggestion)
													.setFooter(`Suggestion ID: ${id.toString()}`)
													.setColor("#e74c3c");
												reason ? deniedEmbed.addField("Reason Given:", reason) : "";
												client.channels
													.get(
														client.servers.get(
															suggestion.guild,
															"channels.denied"
														)
													)
													.send(deniedEmbed);
											}

											if (client.servers.get(message.guild.id, "channels.log")) {
												let logEmbed = new Discord.RichEmbed()
													.setAuthor(
														`${message.author.tag} deleted #${id.toString()}`,
														message.author.displayAvatarURL
													)
													.addField("Suggestion", suggestion.suggestion)
													.setTimestamp()
													.setColor("#e74c3c")
													.setFooter(
														`Suggestion ID: ${id.toString()} | Denier ID: ${
															message.author.id
														}`
													);
												reason ? logEmbed.addField("Denial Reason", reason) : "";
												core.serverLog(logEmbed, message.guild.id, client);
											}
											completed++;
											completedArr.push(inputSuggestion);
											asyncFunction(inputSuggestion, resolve);
										}
									}
								}
							}));
				}, Promise.resolve());

				requests
					.then(() => {
						setTimeout(function () {
							let embed = new Discord.RichEmbed();
							if (completed > 0) {
								embed.setDescription(`<:${config.emoji.check}> Successfully deleted ${completed.toString()}/${suggestions.length.toString()} suggestions`)
									.setColor("#2ecc71");
							} else {
								embed.setDescription(`<:${config.emoji.x}> Deleted ${completed.toString()}/${suggestions.length.toString()} suggestions`)
									.setColor("#e74c3c");
							}
							if (failLog.length > 0) {
								embed.addField(
									"Error Logs",
									`\`\`\`ini\n${failLog.join("\n")}\`\`\``
								);
							}
							msg.edit(embed);
						}, 1200);

					})
					.catch(e => console.error(e));
			});
	}
};
