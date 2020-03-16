const { colors, emoji, prefix} = require("../../config.json");
const { checkChannel, checkConfig, fetchUser, serverLog, dbQuery } = require("../../coreFunctions.js");
const { Suggestion } = require("../../utils/schemas");
module.exports = {
	controls: {
		name: "massdeny",
		permission: 3,
		usage: "massdeny <suggestion ids> -r (reason)",
		aliases: ["mdeny", "multideny"],
		description: "Denies all specified suggestions",
		enabled: true,
		docs: "staff/massdeny",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		if (qServerDB.config.mode === "autoapprove") return message.channel.send(`<:${emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let missingPermsReview = checkChannel(qServerDB.config.channels.staff, message.guild.channels.cache, "staff", client);
		if (!missingPermsReview) return message.channel.send(`<:${emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
		if (missingPermsReview !== true) return message.channel.send(missingPermsReview);

		if (qServerDB.config.channels.denied) {
			let missingPermsDenied = checkChannel(qServerDB.config.channels.denied, message.guild.channels.cache, "denied", client);
			if (!missingPermsDenied) return message.channel.send(`<:${emoji.x}> Could not find your denied suggestions channel even though there is one configured! If you want to remove your denied suggestions channel, use \`${Discord.escapeMarkdown(qServerDB.prefix)}config denied none\``);
			if (missingPermsDenied !== true) return message.channel.send(missingPermsDenied);
		}

		if (!args[0]) return message.channel.send("You must specify at least one suggestion!");

		let reason;
		let reasonSplit = args.join(" ").split("-r");
		if (reasonSplit[1]) {
			reason = reasonSplit[1].split(" ").splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Denial reasons cannot be longer than 1024 characters.`);
		}
		let suggestions = reasonSplit[0].split(" ");

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(`<:${emoji.x}> One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers.`);
		let su = suggestions.map(Number);
		let msg = await message.channel.send("Processing... this may take a moment");

		let preDeny = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let alreadyDenied = preDeny.filter((s) => s.status === "denied");

		let notDeniedId = alreadyDenied.map((s) => s.suggestionId);

		let { n, nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "awaiting_review"
		}, {
			$set: {
				status: "denied",
				staff_member: message.author.id
			},
		}, {
			multi: true
		});

		let postDeny = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let denied = postDeny.filter((s) => s.status === "denied" && !notDeniedId.includes(s.suggestionId));
		let deniedId = denied.map((s) => s.suggestionId);

		if (n !== 0) {
			await msg.edit(
				new Discord.MessageEmbed()
					.setDescription(`<:${emoji.check}> ${nModified !== 0 ? "Successfully denied" : "Denied"} ${nModified}/${su.length} suggestions`)
					.addField("Result", `**Denied**: ${deniedId.length > 0 ? deniedId.join(", ") : "No suggestions were denied."}\n${notDeniedId.length > 0 ? "**Could Not Deny**: " + notDeniedId.join(", ") : ""}`)
					.setColor(colors.green)
					.setFooter(nModified !== su.length
						? "One or more of your suggestions could not be denied. Please make sure the suggestion IDs you have provided exist and have not already been denied."
						: "All of your suggestions have been denied."
					)
			);
		} else {
			return await msg.edit(
				new Discord.MessageEmbed()
					.setDescription(`<:${emoji.x}> None of the suggestions you provided could be denied. Please make sure the suggestion IDs you have provided exist and have not already been denied.`)
					.setColor(colors.red)
			);
		}

		for (let s in denied) {
			// eslint-disable-next-line no-prototype-builtins
			if (denied.hasOwnProperty(s)) {
				let suggester = await fetchUser(denied[s].suggester, client);
				if (qServerDB.config.notify) {
					let dmEmbed = new Discord.MessageEmbed()
						.setTitle(`Your suggestion in **${message.guild.name}** was denied`)
						.setFooter(`Suggestion ID: ${denied[s].suggestionId}`)
						.setDescription(denied[s].suggestion)
						.setColor(colors.red);
					if (reason) dmEmbed.addField("Reason Given", reason);
					await suggester.send(dmEmbed)
						.catch(() => {});
				}

				if (qServerDB.config.channels.log) {
					let logEmbed = new Discord.MessageEmbed()
						.setAuthor(`${message.author.tag} denied #${denied[s].suggestionId}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
						.addField("Suggestion", denied[s].suggestion)
						.setFooter(`Suggestion ID: ${denied[s].suggestionId} | Denier ID: ${message.author.id}`)
						.setTimestamp()
						.setColor(colors.red);
					if (reason) logEmbed.addField("Denial Reason", reason);
					serverLog(logEmbed, qServerDB);
				}

				let updateEmbed = new Discord.MessageEmbed()
					.setTitle(`Suggestion Awaiting Review (#${denied[s].suggestionId})`)
					.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
					.setDescription(denied[s].suggestion)
					.setColor(colors.red)
					.addField("A change was processed on this suggestion", "This suggestion has been denied");

				client.channels.cache.get(qServerDB.config.channels.staff)
					.messages.fetch(denied[s].reviewMessage)
					.then((fetched) => fetched.edit(updateEmbed));

				if (qServerDB.config.channels.denied) {
					let deniedEmbed = new Discord.MessageEmbed()
						.setTitle("Suggestion Denied")
						.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
						.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
						.setDescription(denied[s].suggestion)
						.setFooter(`Suggestion ID: ${denied[s].suggestionId}`)
						.setColor(colors.red);
					if (reason) deniedEmbed.addField("Reason Given", reason);
					client.channels.cache.get(qServerDB.config.channels.denied)
						.send(deniedEmbed);
				}

				let modified = denied[s];
				if (reason) modified.denial_reason = reason;
				denied[s] = modified;
				await denied[s].save();
			}
		}
	}
};
