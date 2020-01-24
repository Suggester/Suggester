const { colors } = require("../config.json");
const Persist = require("../utils/Persistent");
module.exports = {
	controls: {
		permission: 0,
		usage: "config <game|status|username|nick|avatar>\n\n**game:** <type> <new game>\n**status:** <new status>\n**username:** <new username>\n**nick:** <new nickname>\n**avatar**: <new avatar link>",
		description: "Configures elements of the bot user",
		enabled: true,
		hidden: false
	},
	do: async (message, client, args, Discord) => {
		const persistent = new Persist();
		if (!args[0]) {
			return message.channel.send("Invalid parameters!");
		}
		switch (args[0]) {
		case "game": {
			let gameEmbed = new Discord.RichEmbed()
				.setColor(colors.default);
			let activity;
			let type;
			switch (args[1].toLowerCase()) {
			case "playing": {
				type = "PLAYING";
				activity = args.splice(2).join(" ");
				gameEmbed.setDescription("**Playing** " + activity);
				break;
			}
			case "listening": {
				type = "LISTENING";
				activity = args.splice(2).join(" ");
				gameEmbed.setDescription("**Listening to** " + activity);
				break;
			}
			case "watching": {
				type = "WATCHING";
				activity = args.splice(2).join(" ");
				gameEmbed.setDescription("**Watching** " + activity);
				break;
			}
			default: {
				type = "PLAYING";
				activity = args.splice(1).join(" ");
				gameEmbed.setDescription("**Playing** " + activity);
			}
			}
			await client.user.setPresence({
				game: {
					name: activity,
					type: type
				}
			});

			persistent.save("presence", {
				activity: activity,
				type: type
			});

			return message.channel.send("👤 Presence set!", gameEmbed);
		}
		case "status": {
			if (!args[1]) {
				return message.channel.send("Invalid parameters!");
			} else {
				let statusEmbed = new Discord.RichEmbed()
					.setColor(colors.default);
				let status;
				switch (args[1].toLowerCase()) {
				case "online": {
					status = "online";
					statusEmbed.setDescription("**Online**");
					break;
				}
				case "idle": {
					status = "idle";
					statusEmbed.setDescription("**Idle**");
					break;
				}
				case "dnd": {
					status = "dnd";
					statusEmbed.setDescription("**Do Not Disturb**");
					break;
				}
				case "invisible": {
					status = "invisible";
					statusEmbed.setDescription("**Invisible**");
					break;
				}
				default: {
					return message.channel.send("Invalid parameters!");
				}
				}
				await client.user.setStatus(status);

				persistent.save("presence", {
					status: status
				});
				return message.channel.send("🎮 Status set!", statusEmbed);
			}
		}
		case "username": {
			if (!args[1]) {
				return message.channel.send("Invalid parameters!");
			} else {
				let usernameEmbed = new Discord.RichEmbed()
					.setDescription(args.splice(1).join(" "))
					.setColor(colors.default);
				await client.user.setUsername(args.splice(1).join(" "));
				return message.channel.send("📛 Username set!", usernameEmbed);
			}
		}
		case "nick":
		case "nickname": {
			if (!args[1]) {
				return message.channel.send("Invalid parameters!");
			} else {
				let nickEmbed = new Discord.RichEmbed()
					.setDescription(args.splice(1).join(" "))
					.setColor(colors.default);
				await message.guild.me.setNickname(args.splice(1).join(" "));
				return message.channel.send("📛 Nickname set!", nickEmbed);
			}
		}
		case "avatar":
		case "pfp":
		case "av":
		case "picture": {
			if (!args[0]) {
				return message.channel.send("Invalid parameters!");
			} else {
				let avatarEmbed = new Discord.RichEmbed()
					.setImage(client.user.displayAvatarURL)
					.setColor(colors.default);
				await client.user.setAvatar(args[1]);
				return message.channel.send("👤 Avatar set!", avatarEmbed);
			}
		}
		}
	}
};