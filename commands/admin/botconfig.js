const { colors } = require("../../config.json");
const Persist = require("../../utils/Persistent");
const { string } = require("../../utils/strings");
const { checkURL } = require("../../utils/checks");
module.exports = {
	controls: {
		name: "botconfig",
		permission: 0,
		usage: "config <game|status|username|nick|avatar>\n\n**game:** <type> <new game>\n**status:** <new status>\n**username:** <new username>\n**nick:** <new nickname>\n**avatar**: <new avatar link>",
		description: "Configures elements of the bot user",
		enabled: true
	},
	do: async (locale, message, client, args, Discord) => {
		const persistent = new Persist();
		if (!args[0]) return message.channel.send(string(locale, "NO_PLAYING_STATUS_ERROR", {}, "error"));
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
			return message.channel.send(string(locale, "PLAYING_STATUS_SET_SUCCESS", {}, "success"), gameEmbed);
		}
		case "status": {
			if (!args[1]) return message.channel.send(string(locale, "NO_STATUS_ERROR", {}, "error"));
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
				return message.channel.send(string(locale, "NO_STATUS_ERROR", {}, "error"));
			}
			}
			await client.user.setStatus(status);

			persistent.save("presence", {
				status: status
			});
			return message.channel.send(string(locale, "STATUS_SET_SUCCESS", {}, "success"), statusEmbed);
		}
		case "avatar":
		case "pfp":
		case "av":
		case "picture": {
			if (!args[1]) return message.channel.send(string(locale, "NO_AVATAR_ERROR", {}, "error"));
			if (!(checkURL(args[1]))) return message.channel.send(string(locale, "INVALID_AVATAR_ERROR", {}, "error"));
			else {
				await client.user.setAvatar(args[1]);
				let avatarEmbed = new Discord.MessageEmbed()
					.setImage(client.user.displayAvatarURL({format: "png"}))
					.setColor(colors.default);
				message.channel.send(string(locale, "AVATAR_SET_SUCCESS", {}, "success"), avatarEmbed);
			}
		}
		}
	}
};
