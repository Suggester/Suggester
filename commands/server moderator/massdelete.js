const { emoji, colors, prefix } = require("../../config.json");
const { checkChannel, checkConfig, fetchUser, dbQuery, serverLog } = require("../../coreFunctions.js");
const { Suggestion } = require("../../utils/schemas");
module.exports = {
	controls: {
		name: "massdelete",
		permission: 3,
		usage: "massdelete <suggestion ids> -r (reason)",
		aliases: ["mdelete", "multidelete"],
		description: "Deletes all specified suggestions",
		enabled: true,
		docs: "staff/massdelete",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"],
		cooldown: 20
	},
	do: async (message, client, args, Discord) => {
		let qServerDB = await dbQuery("Server", { id: message.guild.id });
		if (!qServerDB) return message.channel.send(`<:${emoji.x}> You must configure your server to use this command. Please use the \`${prefix}setup\` command.`);

		let missing = checkConfig(qServerDB);

		if (missing.length > 1) {
			let embed = new Discord.MessageEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${Discord.escapeMarkdown(qServerDB.config.prefix)}config\` command.`)
				.addField("Missing Elements", `<:${emoji.x}> ${missing.join(`\n<:${emoji.x}> `)}`)
				.setColor(colors.red);
			return message.channel.send(embed);
		}

		let missingPermsSuggestions = checkChannel(qServerDB.config.channels.suggestions, message.guild.channels.cache, "suggestions", client);
		if (!missingPermsSuggestions) return message.channel.send(`<:${emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestions channel.`);
		if (missingPermsSuggestions !== true) return message.channel.send(missingPermsSuggestions);

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
			if (reason.length > 1024) return message.channel.send(`<:${emoji.x}> Deletion reasons cannot be longer than 1024 characters.`);
		}
		let suggestions = reasonSplit[0].split(" ");

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(`<:${emoji.x}> One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers. If you're trying to specify a reason, add \`-r\` between the suggestion IDs and the reason.`);
		let su = suggestions.map(Number);
		let msg = await message.channel.send("Processing... this may take a moment");

		let preDeny = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let alreadyDenied = preDeny.filter((s) => s.status === "denied" || s.implemented);

		let notDeniedId = alreadyDenied.map((s) => s.suggestionId);

		let { n, nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "approved"
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
					.setDescription(`<:${emoji.check}> ${nModified !== 0 ? "Successfully deleted" : "Deleted"} ${nModified}/${su.length} suggestions`)
					.addField("Result", `**Deleted**: ${deniedId.length > 0 ? deniedId.join(", ") : "No suggestions were deleted."}\n${notDeniedId.length > 0 ? "**Could Not Delete**: " + notDeniedId.join(", ") : ""}`)
					.setColor(colors.green)
					.setFooter(nModified !== su.length
						? "One or more of these suggestions could not be deleted. Please make sure the suggestion IDs you have provided exist and have not already been deleted."
						: "All of these suggestions have been deleted."
					)
			);
		} else {
			return await msg.edit(
				new Discord.MessageEmbed()
					.setDescription(`<:${emoji.x}> None of the suggestions you provided could be deleted. Please make sure the suggestion IDs you have provided exist and have not already been denied.`)
					.setColor(colors.red)
			);
		}

		for (let s in denied) {
			// eslint-disable-next-line no-prototype-builtins
			if (denied.hasOwnProperty(s)) {
				let suggester = await fetchUser(denied[s].suggester, client);

				await client.channels.cache.get(qServerDB.config.channels.suggestions)
					.messages.fetch(denied[s].messageId)
					.then((m) => m.delete())
					.catch();

				let qUserDB = await dbQuery("User", { id: suggester.id });
				let selfNotify;
				if (suggester.id === message.author.id) qUserDB.selfnotify ? selfNotify = true : selfNotify = false;
				else selfNotify = true;
				if (qServerDB.config.notify && qUserDB.notify && selfNotify) {
					let dmEmbed = new Discord.MessageEmbed()
						.setTitle(`Your Suggestion In **${message.guild.name}** Was Deleted`)
						.setFooter(`Suggestion ID: ${denied[s].suggestionId}`)
						.setDescription(denied[s].suggestion || "[No Suggestion Content]")
						.setColor(colors.red);
					reason ? dmEmbed.addField("Reason Given:", reason) : "";
					denied[s].attachment ? dmEmbed.setImage(denied[s].attachment) : "";
					await suggester.send(dmEmbed).catch(() => {});
				}
				if (qServerDB.config.channels.log) {
					let logEmbed = new Discord.MessageEmbed()
						.setAuthor(`${message.author.tag} deleted #${denied[s].suggestionId}`, message.author.displayAvatarURL({format: "png", dynamic: true}))
						.addField("Suggestion", denied[s].suggestion || "[No Suggestion Content]")
						.setFooter(`Suggestion ID: ${denied[s].suggestionId} | Denier ID: ${message.author.id}`)
						.setTimestamp()
						.setColor(colors.red);
					reason ? logEmbed.addField("Reason Given:", reason) : "";
					denied[s].attachment ? logEmbed.setImage(denied[s].attachment) : "";

					serverLog(logEmbed, qServerDB, client);
				}
				let updateEmbed = new Discord.MessageEmbed()
					.setTitle(`Suggestion Awaiting Review (#${denied[s].suggestionId})`)
					.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL({format: "png", dynamic: true}))
					.setDescription(denied[s].suggestion)
					.setColor(colors.red)
					.addField("A change was processed on this suggestion", "This suggestion has been deleted");
				await client.channels.cache.get(qServerDB.config.channels.staff)
					.messages.fetch(denied[s].reviewMessage)
					.then((fetched) => fetched.edit(updateEmbed));

				if (qServerDB.config.channels.denied) {
					let deniedEmbed = new Discord.MessageEmbed()
						.setTitle("Suggestion Deleted")
						.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
						.setThumbnail(suggester.displayAvatarURL({format: "png", dynamic: true}))
						.setDescription(denied[s].suggestion || "[No Suggestion Content]")
						.setFooter(`Suggestion ID: ${denied[s].suggestionId}`)
						.setColor(colors.red);
					reason ? deniedEmbed.addField("Reason Given:", reason) : "";
					denied[s].attachment ? deniedEmbed.setImage(denied[s].attachment) : "";
					await client.channels.cache.get(qServerDB.config.channels.denied)
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
