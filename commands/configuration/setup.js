const { emoji } = require("../../config.json");
const { dbQueryNoNew, dbQuery, dbModify, dbDeleteOne } = require("../../utils/db");
const { handleRoleInput, handleChannelInput } = require("../../utils/config");
const { checkConfig } = require("../../utils/checks");
const { string } = require("../../utils/strings");
const { confirmation } = require("../../utils/actions");
const { Server } = require("../../utils/schemas");
module.exports = {
	controls: {
		name: "setup",
		permission: 2,
		usage: "setup",
		description: "Walks you through an interactive configuration process",
		image: "images/Setup.gif",
		examples: "The bot will send a prompt, and you send your response in the channel. The bot will then send another prompt, and the cycle continues until your server is configured.",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS", "READ_MESSAGE_HISTORY"],
		cooldown: 45,
		docs: "admin/setup"
	},
	do: async (locale, message, client, args, Discord) => {
		async function awaitMessage(msg) {
			return msg.channel.awaitMessages(response => response.author.id === msg.author.id, {
				max: 1,
				time: 120000,
				errors: ["time"],
			}).then(async (collected) => {
				if (collected.first().content && collected.first().content.toLowerCase() === "cancel") {
					msg.channel.send(string(locale, "SETUP_CANCELLED", {}, "error"));
					return false;
				}
				return collected.first();
			}).catch(async () => {
				await msg.channel.send(string(locale, "SETUP_TIMED_OUT_ERROR", {}, "error"));
				return false;
			});
		}

		function setupEmbed (title, desc, inputs, url, step) {
			return (new Discord.MessageEmbed()
				.setTitle(title)
				.setURL(url)
				.setColor(client.colors.default)
				.setDescription(desc)
				.addField(string(locale, "INPUTS"), inputs)
				.setFooter(`${string(locale, "TIME_SETUP_WARNING")} • ${step}/8`));
		}

		async function setup(through) {
			let db = await dbQuery("Server", {id: message.guild.id});
			switch (through) {
			case 0: {
				//Server Admin role
				let adminRolesEmbed = setupEmbed(string(locale, "CONFIG_NAME:ADMIN"), string(locale, "SETUP_ADMIN_ROLES_DESC"), string(locale, "SETUP_ROLES_INPUT"), "https://suggester.js.org/#/config/adminroles",1);
				if (db.config.admin_roles.length >= 1) adminRolesEmbed.addField(string(locale, "SETUP_ROLES_DONE_TITLE"), string(locale, "SETUP_ROLES_DONE_DESC"));
				await message.channel.send(adminRolesEmbed);
				let returnCollect = await awaitMessage(message);
				if (returnCollect.content) {
					if (returnCollect.content.toLowerCase() === "done" && db.config.admin_roles.length >= 1) return setup(1);
					//await message.channel.send((await handleRoleInput(locale, "add", returnCollect.content, message.guild.roles.cache, "admin_roles", "CFG_ALREADY_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_ADD_SUCCESS")), { disableMentions: "everyone" });
					let output = await handleRoleInput(locale, "add", returnCollect.content, message.guild.roles.cache, "admin_roles", "CFG_ALREADY_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_ADD_SUCCESS");
					if (output === "CONFIRM") {
						if ((
							await confirmation(
								message,
								string(locale, "EVERYONE_PERMISSION_WARNING", { check: `<:${emoji.check}>`, x: `<:${emoji.x}>`}),
								{
									deleteAfterReaction: true
								}
							)
						)) {
							message.channel.send((await handleRoleInput(locale, "add", returnCollect.content, message.guild.roles.cache, "admin_roles", "CFG_ALREADY_ADMIN_ROLE_ERROR", "CFG_ADMIN_ROLE_ADD_SUCCESS", null, true)), { disableMentions: "everyone" });
							return setup(0);
						}
						else return setup(0);
					} else message.channel.send(output, { disableMentions: "everyone" });
					return setup(0);
				} else return;
			}
			case 1: {
				let staffRolesEmbed = setupEmbed(string(locale, "CONFIG_NAME:STAFF"), string(locale, "SETUP_STAFF_ROLES_DESC_ND"), string(locale, "SETUP_ROLES_INPUT"), "https://suggester.js.org/#/config/staffroles", 2);
				if (db.config.staff_roles.length >= 1) staffRolesEmbed.addField(string(locale, "SETUP_ROLES_DONE_TITLE"), string(locale, "SETUP_ROLES_DONE_DESC"));
				await message.channel.send(staffRolesEmbed);
				let returnCollect = await awaitMessage(message);
				if (returnCollect.content) {
					if (returnCollect.content.toLowerCase() === "done" && db.config.admin_roles.length >= 1) return setup(2);
					let output = await handleRoleInput(locale, "add", returnCollect.content, message.guild.roles.cache, "staff_roles", "CFG_ALREADY_STAFF_ROLE_ERROR", "CFG_STAFF_ROLE_ADD_SUCCESS");
					if (output === "CONFIRM") {
						if ((
							await confirmation(
								message,
								string(locale, "EVERYONE_PERMISSION_WARNING", { check: `<:${emoji.check}>`, x: `<:${emoji.x}>`}),
								{
									deleteAfterReaction: true
								}
							)
						)) {
							message.channel.send((await handleRoleInput(locale, "add", returnCollect.content, message.guild.roles.cache, "staff_roles", "CFG_ALREADY_STAFF_ROLE_ERROR", "CFG_STAFF_ROLE_ADD_SUCCESS", null, true)), { disableMentions: "everyone" });
							return setup(1);
						}
						else return setup(1);
					} else message.channel.send(output, { disableMentions: "everyone" });
					return setup(1);
				} else return;
			}
			case 2: {
				//Mode
				let modeEmbed = setupEmbed(string(locale, "CONFIG_NAME:MODE"), string(locale, "SETUP_MODE_DESC"), string(locale, "SETUP_MODE_INPUTS"), "https://suggester.js.org/#/config/mode", 3);
				modeEmbed.addField(string(locale, "SETUP_REVIEW_TEXT"), string(locale, "SETUP_REVIEW_DESC"))
					.addField(string(locale, "SETUP_AUTOAPPROVE_TEXT"), string(locale, "SETUP_AUTOAPPROVE_DESC"));
				await message.channel.send(modeEmbed);
				let returnCollect = await awaitMessage(message);
				if (returnCollect.content) {
					switch (returnCollect.content.toLowerCase()) {
					case "review":
						db.config.mode = "review";
						await dbModify("Server", {id: message.guild.id}, db);
						message.channel.send(string(locale, "CFG_MODE_REVIEW_SET_SUCCESS", {}, "success"));
						return setup(3);
					case "autoapprove":
					case "auto-approve":
					case "auto_approve":
					case "auto": {
						let suggestionsAwaitingReview = await dbQueryNoNew("Suggestion", {
							status: "awaiting_review",
							id: message.guild.id
						});
						if (suggestionsAwaitingReview) {
							message.channel.send(string(locale, "CFG_SUGGESTIONS_AWAITING_REVIEW_ERROR_Q", { prefix: db.config.prefix }, "error"));
							return setup(2);
						}
						db.config.mode = "autoapprove";
						await dbModify("Server", {id: message.guild.id}, db);

						message.channel.send(string(locale, "CFG_MODE_AUTOAPPROVE_SET_SUCCESS", {}, "success"));
						return setup(3);
					}
					default:
						message.channel.send(string(locale, "CFG_MODE_INVALID_ERROR", {}, "error"));
						return setup(2);
					}
				}
				break;
			}
			case 3: {
				//Suggestion channel
				let suggestionChannelEmbed = setupEmbed(string(locale, "CONFIG_NAME:SUGGESTIONS"), string(locale, "SETUP_SUGGESTIONS_CHANNEL_DESC"), string(locale, "SETUP_CHANNELS_INPUT"), "https://suggester.js.org/#/config/suggestions", 4);
				await message.channel.send(suggestionChannelEmbed);
				let returnCollect = await awaitMessage(message);
				if (returnCollect.content) {
					let { content } = await message.channel.send((await handleChannelInput(locale, returnCollect.content, message.guild, "suggestions", "suggestions", "CFG_SUGGESTIONS_SET_SUCCESS")));
					if (!content.startsWith(`<:${emoji.check}>`)) return setup(3);
					return setup(4);
				} else return;
			}
			case 4:
				//Review channel (if mode is review)
				if (db.config.mode === "review") {
					let reviewChannelEmbed = setupEmbed(string(locale, "CONFIG_NAME:REVIEW"), string(locale, "SETUP_REVIEW_CHANNEL_DESC"), string(locale, "SETUP_CHANNELS_INPUT"), "https://suggester.js.org/#/config/review", 5);
					await message.channel.send(reviewChannelEmbed);
					let returnCollect = await awaitMessage(message);
					if (returnCollect.content) {
						let { content } = await message.channel.send((await handleChannelInput(locale, returnCollect.content, message.guild, "staff", "staff", "CFG_REVIEW_SET_SUCCESS")));
						if (!content.startsWith(`<:${emoji.check}>`)) return setup(4);
						return setup(5);
					} else return;
				} else return setup(5);
			case 5: {
				//Denied channel
				let deniedChannelEmbed = setupEmbed(string(locale, "CONFIG_NAME:DENIED"), string(locale, "SETUP_DENIED_CHANNEL_DESC"), `${string(locale, "SETUP_CHANNELS_INPUT")}\n${string(locale, "SETUP_SKIP_CHANNEL")}`, "https://suggester.js.org/#/config/denied", 6);
				await message.channel.send(deniedChannelEmbed);
				let returnCollect = await awaitMessage(message);
				if (returnCollect.content) {
					if (returnCollect.content.toLowerCase() === "skip") return setup(6);
					let { content } = await message.channel.send((await handleChannelInput(locale, returnCollect.content, message.guild, "denied", "denied", "CFG_DENIED_SET_SUCCESS")));
					if (!content.startsWith(`<:${emoji.check}>`)) return setup(5);
					return setup(6);
				} else return;
			}
			case 6: {
				//Logs
				let logChannelEmbed = setupEmbed(string(locale, "CONFIG_NAME:LOG"), string(locale, "SETUP_LOG_CHANNEL_DESC"), `${string(locale, "SETUP_CHANNELS_INPUT")}\n${string(locale, "SETUP_SKIP_CHANNEL")}`, "https://suggester.js.org/#/config/logs", 7);
				await message.channel.send(logChannelEmbed);
				let returnCollect = await awaitMessage(message);
				if (returnCollect.content) {
					if (returnCollect.content.toLowerCase() === "skip") return setup(7);
					let { content } = await message.channel.send((await handleChannelInput(locale, returnCollect.content, message.guild, "log", "log", "CFG_LOG_SET_SUCCESS")));
					if (!content.startsWith(`<:${emoji.check}>`)) return setup(6);
					return setup(7);
				} else return;
			}
			case 7: {
				//Prefix
				let prefixEmbed = setupEmbed(string(locale, "CONFIG_NAME:PREFIX"), string(locale, "SETUP_PREFIX_DESC"), string(locale, "SETUP_PREFIX_INPUT"), "https://suggester.js.org/#/config/prefix", 8);
				await message.channel.send(prefixEmbed);
				let returnCollect = await awaitMessage(message);
				if (returnCollect.content) {
					let prefix = returnCollect.content.toLowerCase().split(" ")[0];

					if (prefix.length > 20) {
						message.channel.send(string(locale, "CFG_PREFIX_TOO_LONG_ERROR", {}, "error"));
						return setup(7);
					}
					let disallowed = ["suggester:", `${client.user.id}:`];
					if (disallowed.includes(prefix)) {
						message.channel.send(string(locale, "CFG_PREFIX_DISALLOWED_ERROR", {}, "error"));
						return setup(7);
					}

					// eslint-disable-next-line no-inner-declarations
					async function savePrefix(p) {
						db.config.prefix = p;
						await dbModify("Server", {id: message.guild.id}, db);
						return message.channel.send(string(locale, "CFG_PREFIX_SET_SUCCESS", { prefix: Discord.escapeMarkdown(p) }, "success"));
					}
					if (prefix.includes("suggest")) {
						if ((await confirmation(
							message,
							string(locale, "SETUP_PREFIX_INCLUDES_SUGGEST", { prefix: prefix, check: `<:${emoji.check}>`, x: `<:${emoji.x}>`}),
							{
								deleteAfterReaction: true
							}
						)
						)) {
							await savePrefix(prefix);
							return setup(8);
						} else return setup(7);
					} else {
						await savePrefix(prefix);
						return setup(8);
					}
				} else return;
			}
			case 8: {
				let doneEmbed = new Discord.MessageEmbed()
					.setTitle(string(locale, "SETUP_COMPLETE_HEADER"))
					.setColor(client.colors.default)
					.setDescription(string(locale, "SETUP_COMPLETE_DESC", { prefix: Discord.escapeMarkdown(db.config.prefix) }))
					.addField(string(locale, "SETUP_ADDITIONAL_CONFIG_HEADER"), string(locale, "SETUP_ADDITIONAL_CONFIG_DESC_ND", { prefix: Discord.escapeMarkdown(db.config.prefix) }));
				return message.channel.send(doneEmbed);
			}
			default:
				return message.channel.send("ERROR", {}, "error");
			}
		}

		let qServerDB = await dbQuery("Server", {id: message.guild.id});
		let check = await checkConfig(locale, qServerDB, client);

		async function start (startAt=0) {
			let oldAllowlist = qServerDB.allowlist;
			await dbDeleteOne("Server", {id: message.guild.id}); //Delete old config
			let newDB = await new Server({ id: message.guild.id }).save();
			if (oldAllowlist) {
				newDB.allowlist = oldAllowlist;
				await dbModify("Server", {id: message.guild.id}, newDB); //Add allowlist if previous
			}
			return setup(startAt);
		}

		let startAt = client.admins.has(message.author.id) && args[0] && parseInt(args[0]) ? parseInt(args[0]) : 0;

		if (!check) {
			if ((
				await confirmation(
					message,
					string(locale, "SETUP_WARNING", { check: `<:${emoji.check}>`, x: `<:${emoji.x}>`}),
					{
						denyMessage: string(locale, "SETUP_CANCELLED", {}, "error"),
						confirmMessage: string(locale, "SETUP_BEGIN"),
						keepReactions: false
					}
				)
			)) await start(startAt);
		} else await start(startAt);
	}
};
