const { colors, emoji } = require("../../config.json");
const Persist = require("../../utils/Persistent");
const validUrl = require("valid-url");
/**
 * Check a URL to see if it makes a valid attachment
 * @param {string} url - The string to be checked
 * @returns {boolean}
 */
function checkURL (url) {
	if (validUrl.isUri(url)){
		let noparams = url.split("?")[0];
		return (noparams.match(/\.(jpeg|jpg|gif|png)$/) != null);
	} else return false;
}
module.exports = {
	controls: {
		name: "botconfig",
		permission: 0,
		usage: "config <game|status|username|nick|avatar>\n\n**game:** <type> <new game>\n**status:** <new status>\n**username:** <new username>\n**nick:** <new nickname>\n**avatar**: <new avatar link>",
		description: "Configures elements of the bot user",
		enabled: true
	},
	do: async (message, client, args, Discord) => {
		const persistent = new Persist();
		if (!args[0]) return message.channel.send(":warning: Correct usage is `config game <playing|listening|watching> <status>`");
		switch (args[0]) {
		case "game": {
			let activity;
			let type;
			let full;
			switch (args[1].toLowerCase()) {
			case "playing": {
				type = "PLAYING";
				activity = args.splice(2).join(" ");
				full = `**Playing** ${activity}`;
				break;
			}
			case "listening": {
				type = "LISTENING";
				activity = args.splice(2).join(" ");
				full = `**Listening to** ${activity}`;
				break;
			}
			case "watching": {
				type = "WATCHING";
				activity = args.splice(2).join(" ");
				full = `**Watching** ${activity}`;
				break;
			}
			default: {
				type = "PLAYING";
				activity = args.splice(1).join(" ");
				full = `**Playing** ${activity}`;
			}
			}
			await client.user.setPresence({
				activity: {
					name: activity,
					type: type
				}
			});

			persistent.save("presence", {
				activity: activity,
				type: type
			});

			let gameEmbed = new Discord.MessageEmbed()
				.setDescription(full)
				.setColor(colors.default);
			return message.channel.send("👤 Presence set!", gameEmbed);
		}
		case "status": {
			if (!args[1]) return message.channel.send("Invalid parameters!");
			let statusEmbed = new Discord.MessageEmbed();
			let status;
			switch (args[1].toLowerCase()) {
			case "online": {
				status = "online";
				statusEmbed.setDescription("**Online**")
					.setColor(colors.green);
				break;
			}
			case "idle": {
				status = "idle";
				statusEmbed.setDescription("**Idle**")
					.setColor(colors.yellow);
				break;
			}
			case "dnd": {
				status = "dnd";
				statusEmbed.setDescription("**Do Not Disturb**")
					.setColor(colors.red);
				break;
			}
			case "offline":
			case "invisible": {
				status = "invisible";
				statusEmbed.setDescription("**Invisible**")
					.setColor(colors.gray);
				break;
			}
			default: {
				return message.channel.send("Invalid parameters! Valid status types are `online`, `idle`, `dnd`, and `invisible`.");
			}
			}
			await client.user.setStatus(status);

			persistent.save("presence", {
				status: status
			});
			return message.channel.send("🎮 Status set!", statusEmbed);
		}
		case "username": {
			if (!args[1]) {
				return message.channel.send("Invalid parameters! You must specify a username!");
			} else {
				message.channel.startTyping();
				await client.user.setUsername(args.splice(1).join(" "));
				let usernameEmbed = new Discord.MessageEmbed()
					.setDescription(client.user.username)
					.setColor(colors.default);
				await message.channel.send("📛 Username set!", usernameEmbed);
				await message.channel.stopTyping();
			}
		}
		case "nick":
		case "nickname": {
			if (!args[1]) {
				return message.channel.send("Invalid parameters! You must specify a nickname!");
			} else {
				let nick = args.splice(1).join(" ");
				if (nick.length > 32) return message.channel.send("Nicknames have a length limit of 32 characters.");
				await message.guild.me.setNickname(nick).then(member => {
					let nickEmbed = new Discord.MessageEmbed()
						.setDescription(member.nickname)
						.setColor(colors.default);
					message.channel.send("📛 Nickname set!", nickEmbed);
				}).catch(() => message.channel.send("An error occurred setting the nickname. Please make sure I have permissions."));
				return;
			}
		}
		case "avatar":
		case "pfp":
		case "av":
		case "picture": {
			if (!args[1]) return message.channel.send("Invalid parameters! You must specify an avatar!");
			if (!(checkURL(args[1]))) return message.channel.send(`<:${emoji.x}> Please provide a valid image URL! Images can have extensions of \`jpeg\`, \`jpg\`, \`png\`, or \`gif\``);
			else {
				message.channel.startTyping();
				await client.user.setAvatar(args[1]);
				let avatarEmbed = new Discord.MessageEmbed()
					.setImage(client.user.displayAvatarURL({format: "png"}))
					.setColor(colors.default);
				await message.channel.send("👤 Avatar set!", avatarEmbed);
				return message.channel.stopTyping();
			}
		}
		case "version": {
			if (!args[1]) return message.channel.send("Invalid parameters!");
			else {
				persistent.save("core", {
					"version": args[1]
				});
				return message.channel.send(`Bot version set to ${args[1]}. Initiate a reboot to see this change take effect.`);
			}
		}
		}
	}
};