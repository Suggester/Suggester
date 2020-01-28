const config = require("../config.json");
const core = require("../coreFunctions.js");
const { Suggestion } = require("../utils/schemas");
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
	do: async (message, client, args, Discord) => {
		let qServerDb = await core.dbQuery("Server", { id: message.guild.id });
		if (qServerDb.config.mode === "autoapprove") return message.channel.send(`<:${config.emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

		let missingConfigs = [];
		if (!qServerDb) return message.channel.send(`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`);
		if (!qServerDb.config.admin_roles || qServerDb.config.admin_roles.length < 1) missingConfigs.push("Server Admin Roles");
		if (!qServerDb.config.staff_roles || qServerDb.config.staff_roles.length < 1) missingConfigs.push("Server Staff Roles");
		if (!qServerDb.config.channels.suggestions || !client.channels.get(qServerDb.config.channels.suggestions)) missingConfigs.push("Denied Suggestions Channel");
		if (qServerDb.config.mode === "review" && (!qServerDb.config.channels.staff || !client.channels.get(qServerDb.config.channels.staff))) missingConfigs.push("Suggestion Review Channel");

		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${qServerDb.config.prefix}config\` command.`)
				.addField("Missing Elements", `<:${config.emoji.x}> ${missingConfigs.join(`\n<:${config.emoji.x}> `)}`)
				.setColor("#e74c3c");
			return message.channel.send(embed);
		}

		if (qServerDb.config.channels.staff && client.channels.get(qServerDb.config.channels.staff)) {
			let perms = core.channelPermissions(client.channels.get(qServerDb.config.channels.staff).memberPermissions(client.user.id), "staff", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${qServerDb.config.channels.staff}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${qServerDb.config.channels.staff}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${config.emoji.x}> Could not find your staff review channel! Please make sure you have configured a staff review channel.`);
		}

		if (!args[0]) return message.channel.send("You must specify at least one suggestion!");

		let reason;
		let reasonSplit = args.join(" ").split("-r");
		if (reasonSplit[1]) {
			reason = reasonSplit[1].split(" ").splice(1).join(" ");
			if (reason.length > 1024) return message.channel.send(`<:${config.emoji.x}> Deletion reasons cannot be longer than 1024 characters.`);
		}
		let suggestions = reasonSplit[0].split(" ");

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send("One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers.");
		let su = suggestions.map(Number);
		let msg = await message.channel.send("Processing... this may take a moment");

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
		let denied = postDeny.filter((s) => s.status === "denied");
		let deniedId = postDeny.map((s) => s.suggestionId);
		let notDeniedId = su.filter((s) => !deniedId.includes(s));

		if (n !== 0) {
			await msg.edit(
				new Discord.RichEmbed()
					.setDescription(`<:${config.emoji.check}> ${nModified !== 0 ? "Successfully deleted" : "Deleted"} ${nModified}/${su.length} suggestions`)
					.addField("Result", `**Deleted**: ${deniedId.length > 0 ? deniedId.join(", ") : "No suggestions were deleted."}\n${notDeniedId.length > 0 ? "**Could Not Delete**: " + notDeniedId.join(", ") : ""}`)
					.setColor("#2ecc71")
					.setFooter(nModified !== su.length
						? "One or more of your suggestions could not be deleted. Please make sure the suggestion IDs you have provided exist and have not already been denied."
						: "All of your suggestions have been denied."
					)
			);
		} else {
			return await msg.edit(
				new Discord.RichEmbed()
					.setDescription(`<:${config.emoji.x}> None of the suggestions you provided could be deleted. Please make sure the suggestion IDs you have provided exist and have not already been denied.`)
					.setColor("#e74c3c")
			);
		}

		for (let s in denied) {
			// eslint-disable-next-line no-prototype-builtins
			if (denied.hasOwnProperty(s)) {
				let suggester = client.users.get(denied[s].suggester)
					|| client.fetchUser(denied[s].suggester);

				await client.channels.get(qServerDb.config.channels.suggestions)
					.fetchMessage(denied[s].messageId)
					.then((m) => m.delete())
					.catch();

				if (qServerDb.config.notify) {
					let dmEmbed = new Discord.RichEmbed()
						.setTitle(`Your suggestion in **${message.guild.name}** was deleted`)
						.setFooter(`Suggestion ID: ${denied[s].suggestionId}`)
						.setDescription(denied[s].suggestion)
						.setColor("#e74c3c");
					if (reason) dmEmbed.addField("Reason Given", reason);
					await suggester.send(dmEmbed)
						.catch((err) => {
							console.log(err);
						});
				}
				if (qServerDb.config.channels.log) {
					let logEmbed = new Discord.RichEmbed()
						.setAuthor(`${message.author.tag} deleted #${denied[s].suggestionId}`, message.author.displayAvatarURL)
						.addField("Suggestion", denied[s].suggestion)
						.setFooter(`Suggestion ID: ${denied[s].suggestionId} | Denier ID: ${message.author.id}`)
						.setTimestamp()
						.setColor("#e74c3c");
					if (reason) logEmbed.addField("Denial Reason", reason);

					core.serverLog(logEmbed, qServerDb);
				}
				let updateEmbed = new Discord.RichEmbed()
					.setTitle(`Suggestion Awaiting Review (#${denied[s].suggestionId})`)
					.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
					.setDescription(denied[s].suggestion)
					.setColor("#e74c3c")
					.addField("A change was processed on this suggestion", "This suggestion has been deleted");
				await client.channels.get(qServerDb.config.channels.staff)
					.fetchMessage(denied[s].reviewMessage)
					.then((fetched) => fetched.edit(updateEmbed));

				if (qServerDb.config.channels.denied) {
					let deniedEmbed = new Discord.RichEmbed()
						.setTitle("Suggestion Deleted")
						.setAuthor(`Suggestion from ${suggester.tag} (${suggester.id})`)
						.setThumbnail(suggester.displayAvatarURL)
						.setDescription(denied[s].suggestion)
						.setFooter(`Suggestion ID: ${denied[s].suggestionId}`)
						.setColor("#e74c3c");
					if (reason) deniedEmbed.addField("Reason Given", reason);
					await client.channels.get(qServerDb.config.channels.denied)
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
