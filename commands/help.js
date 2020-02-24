const { dbQuery, checkPermissions, permLevelToRole } = require("../coreFunctions");
const { readdir } = require("fs");
const config = require("../config.json");

module.exports = {
	controls: {
		permission: 10,
		aliases: ["command", "howto"],
		usage: "help <command name>",
		description: "Shows command information",
		enabled: true,
		docs: "all/help",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let permission = await checkPermissions(message.member, client);
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		let prefix = (qServerDB && qServerDB.config && qServerDB.config.prefix) || config.prefix;
		if (!args[0]) {
			let embed = new Discord.RichEmbed()
				.setDescription("Please see https://suggester.gitbook.io/ for a command list and usage information!")
				.setColor(config.colors.default);
			return message.channel.send(embed);
		}

		let commandName = args[0].toLowerCase();
		readdir("./commands/", (err, files) => {
			files.forEach(file => {
				const commandNameFile = file.split(".")[0]; //Command to check against
				const command = require(`../commands/${commandNameFile}.js`); //Command file
				if (commandName === commandNameFile || (command.controls.aliases && command.controls.aliases.includes(commandName))) {

					if (permission > command.controls.permission) return;

					let commandInfo = command.controls;

					let aliases;
					!commandInfo.aliases ? aliases = false : aliases = true;

					let returnEmbed = new Discord.RichEmbed()
						.setColor(config.colors.default)
						.setDescription(commandInfo.description)
						.addField("Permission Level", permLevelToRole(commandInfo.permission), true)
						.addField("Usage", `\`${prefix}${commandInfo.usage}\``, true)
						.setAuthor(`Command: ${commandName}`, "https://cdn.discordapp.com/attachments/654421515646795784/663738333398302770/9cfdac24571247cb012d11125397864e.png");

					if (aliases) returnEmbed.addField("Aliases", commandInfo.aliases.join(", "));
					if (commandInfo.docs && commandInfo.docs !== "") returnEmbed.addField("Documentation", `https://suggester.gitbook.io/docs/${commandInfo.docs}`);
					if (!commandInfo.enabled) returnEmbed.addField("Additional Information", "⚠️ This command is currently disabled");

					return message.channel.send(returnEmbed);
				}
			});
		});

	}
};
