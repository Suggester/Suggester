const { url } = require("../commands/other/invite");
const { lists } = require("../commands/other/vote");
const { string } = require("./strings");
const { dbModify } = require("./db");
const { support_invite } = require("../config.json");
module.exports = {
	protip: async function(locale, message, client, Discord, force=null, command=null, not=[], admin=false) {
		const list = {
			invite: {
				string: "PROTIP_INVITE",
				use: {
					bot_invite: url.replace("[ID]", client.user.id)
				}
			},
			support: {
				string: "PROTIP_SUPPORT",
				use: {
					support_invite: `https://discord.gg/${support_invite}`
				}
			},
			approve_reason: {
				string: "PROTIP_REASON_APPROVE",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				command: ["approve"]
			},
			approve_mass: {
				string: "PROTIP_MASS_APPROVE",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				command: ["approve"]
			},
			deny_reason: {
				string: "PROTIP_REASON_DENY",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				command: ["deny"]
			},
			deny_mass: {
				string: "PROTIP_MASS_DENY",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				command: ["deny"]
			},
			in_channel_config: {
				string: "PROTIP_INCHANNEL",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				admin: true
			},
			emote_config: {
				string: "PROTIP_EMOTES",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				admin: true
			},
			voting: {
				string: "PROTIP_VOTING",
				use: {
					prefix: (await message.guild.db).config.prefix || ".",
					list: lists[Object.keys(lists)[Math.floor(Math.random()*Object.keys(lists).length)]],
					support_invite: `https://discord.gg/${support_invite}`
				}
			},
			notify: {
				string: "PROTIP_NOTIFY",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				}
			},
			locale: {
				string: "PROTIP_LOCALE",
				use: {
					prefix: (await message.guild.db).config.prefix || ".",
					support_invite: `https://discord.gg/${support_invite}`
				}
			},
			changelog: {
				string: "PROTIP_CHANGELOG",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				}
			},
			acomment: {
				string: "PROTIP_ACOMMENT",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				command: ["comment"]
			},
			markcomment: {
				string: "PROTIP_MARKCOMMENT",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				command: ["mark"]
			},
			block: {
				string: "PROTIP_BLOCK",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				admin: true
			},
			colorchange: {
				string: "PROTIP_COLORCHANGE",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				admin: true
			},
			queue: {
				string: "PROTIP_QUEUE",
				use: {
					prefix: (await message.guild.db).config.prefix || "."
				},
				admin: true
			},
			canary: {
				string: "PROTIP_CANARY",
				use: {
					support_invite: `https://discord.gg/${support_invite}`
				}
			},
			rickroll: {
				string: "PROTIP_RICKROLL",
				command: ["rickroll"]
			}
		};
		let qUserDB = await message.author.db;
		const randomChance = Math.floor(Math.random() * 5);
		if (!qUserDB.protips || randomChance !== 2) return;
		let filteredList = Object.keys(list).filter(k => !qUserDB.displayed_protips.includes(k) && (command ? (list[k].command && list[k].command.includes(command)) : !list[k].command) && !not.includes(k) && (!admin ? !list[k].admin : true));
		let key = force || filteredList[Math.floor(Math.random()*filteredList.length)];
		if (Math.floor(Math.random() * 100) === 5) key = "rickroll";
		let str = list[key];
		if (!str) return;
		if (message.guild && !message.channel.permissionsFor(client.user.id).has("EMBED_LINKS")) {
			let desc = string(locale, str.string, str.use);
			let matches = desc.match(/\[([A-Za-z0-9]+)\]\(([A-Za-z:./0-9?=_&-<>]+)\)/g);
			if (matches) for (let m of matches) {
				let ma = m.match(/\[([A-Za-z0-9]+)\]\(([A-Za-z:./0-9?=_&-<>]+)\)/);
				desc = desc.replace(ma[0], `${ma[1]} (${ma[2]})`);
			}
			message.channel.send(`${string(locale, "PROTIP_TITLE")} ${desc}`);
		} else {
			message.channel.send(new Discord.MessageEmbed()
				.setColor(client.colors.protip)
				.setDescription(`${string(locale, "PROTIP_TITLE")} ${string(locale, str.string, str.use)}`));
		}
		qUserDB.displayed_protips.push(key);
		await dbModify("User", { id: message.author.id }, qUserDB);
	}
};
