const { slash_url } = require("../commands/other/invite");
const { lists } = require("../commands/other/vote");
const { string } = require("./strings");
const { dbModify } = require("./db");
const { support_invite } = require("../config.json");
module.exports = {
	protip: async function(locale, message, client, Discord, force=null, command=null, not=[], admin=false, clean=false) {
		const list = {
			invite: {
				string: "PROTIP_INVITE",
				use: {
					bot_invite: slash_url.replace("[ID]", client.user.id)
				}
			},
			approve_reason: {
				string: "PROTIP_REASON_APPROVE",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				command: ["approve"]
			},
			approve_mass: {
				string: "PROTIP_MASS_APPROVE",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				command: ["approve"]
			},
			deny_reason: {
				string: "PROTIP_REASON_DENY",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				command: ["deny"]
			},
			deny_mass: {
				string: "PROTIP_MASS_DENY",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				command: ["deny"]
			},
			in_channel_config: {
				string: "PROTIP_INCHANNEL",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				admin: true
			},
			emote_config: {
				string: "PROTIP_EMOTES",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				admin: true
			},
			voting: {
				string: "PROTIP_VOTING",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || ".",
					list: lists[Object.keys(lists)[Math.floor(Math.random()*Object.keys(lists).length)]],
					support_invite: `https://discord.gg/${support_invite}`
				}
			},
			notify: {
				string: "PROTIP_NOTIFY",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				}
			},
			locale: {
				string: "PROTIP_LOCALE",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || ".",
					support_invite: `https://discord.gg/${support_invite}`
				}
			},
			changelog: {
				string: "PROTIP_CHANGELOG",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				}
			},
			acomment: {
				string: "PROTIP_ACOMMENT",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				command: ["comment"]
			},
			markcomment: {
				string: "PROTIP_MARKCOMMENT",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				command: ["mark"]
			},
			block: {
				string: "PROTIP_BLOCK",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				admin: true
			},
			colorchange: {
				string: "PROTIP_COLORCHANGE",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
				},
				admin: true
			},
			queue: {
				string: "PROTIP_QUEUE",
				use: {
					prefix: (message.guild ? (await message.guild.db).config.prefix : null) || "."
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
			},
			large: {
				string: "PROTIP_LARGE_SERVER",
				use: {
					support_invite: `https://discord.gg/${support_invite}`
				},
				admin: true,
				members: 5000
			}
		};
		let qUserDB = await message.author.db;
		if (message.guild) {
			let qServerDB = await message.guild.db;
			if (qServerDB.flags.includes("PROTIPS_DISABLED")) return;
		}
		const randomChance = Math.floor(Math.random() * 5);
		if (!qUserDB.protips || randomChance !== 2) return;
		let filteredList = Object.keys(list).filter(k => !qUserDB.displayed_protips.includes(k) && (command ? (list[k].command && list[k].command.includes(command)) : !list[k].command) && !not.includes(k) && (!admin ? !list[k].admin : true) && (list[k].members ? (message.guild ? message.guild.memberCount >= list[k].members : false) : true));
		if (force && qUserDB.displayed_protips.includes(force)) return;
		let key = force || filteredList[Math.floor(Math.random()*filteredList.length)];
		if (Math.floor(Math.random() * 100) === 5) key = "rickroll";
		let str = list[key];
		if (!str) return;
		if (message.guild && !message.channel.permissionsFor(client.user.id).has("EMBED_LINKS")) {
			let desc = string(locale, str.string, str.use, str.special_emotes, str.special_emotes);
			let matches = desc.match(/\[([A-Za-z0-9]+)\]\(([A-Za-z:./0-9?=_&-<>]+)\)/g);
			if (matches) for (let m of matches) {
				let ma = m.match(/\[([A-Za-z0-9]+)\]\(([A-Za-z:./0-9?=_&-<>]+)\)/);
				desc = desc.replace(ma[0], `${ma[1]} (${ma[2]})`);
			}
			let pm = await message.channel.send(`${string(locale, "PROTIP_TITLE")} ${desc}`);
			if (clean) setTimeout(function() { pm.delete(); }, 7500);
		} else {
			let pm = await message.channel.send(new Discord.MessageEmbed()
				.setColor(client.colors.protip)
				.setDescription(`${string(locale, "PROTIP_TITLE")} ${string(locale, str.string, str.use, str.special_emotes,  str.special_emotes)}`));
			if (clean) setTimeout(function() {
				pm.delete(); }, 7500);
		}
		qUserDB.displayed_protips.push(key);
		await dbModify("User", { id: message.author.id }, qUserDB);
	}
};
