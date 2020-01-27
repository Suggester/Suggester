const config = require("../config.json");
const core = require("../coreFunctions.js");
const { Suggestion } = require("../utils/schemas");
module.exports = {
	controls: {
		permission: 3,
		usage: "massapprove <suggestion ids> -r (reason)",
		aliases: ["mapprove", "multiapprove"],
		description: "Approves all specified suggestions",
		enabled: true,
		hidden: false,
		docs: "staff/massapprove",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let qServerDb = await core.dbQuery("Server", { id: message.guild.id });
		if (qServerDb.config.mode === "autoapprove") return message.channel.send(`<:${config.emoji.x}> This command is disabled when the suggestion mode is set to \`autoapprove\`.`);

		let missingConfigs = [];
		if (!qServerDb) return message.channel.send(`<:${config.emoji.x}> You must configure your server to use this command. Please use the \`config\` command.\n:rotating_light: The database was recently lost due to an accident, which means that all configuration settings and suggestions were lost. Please join the support server for more information.`);
		if (!qServerDb.config.admin_roles || qServerDb.config.admin_roles.length < 1) missingConfigs.push("Server Admin Roles");
		if (!qServerDb.config.staff_roles || qServerDb.config.staff_roles.length < 1) missingConfigs.push("Server Staff Roles");
		if (!qServerDb.config.channels.suggestions || !client.channels.get(qServerDb.config.channels.suggestions)) missingConfigs.push("Approved Suggestions Channel");
		if (qServerDb.config.mode === "review" && (!qServerDb.config.channels.staff || !client.channels.get(qServerDb.config.channels.staff))) missingConfigs.push("Suggestion Review Channel");

		if (missingConfigs.length > 1) {
			let embed = new Discord.RichEmbed()
				.setDescription(`This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the \`${qServerDb.config.prefix}config\` command.`)
				.addField("Missing Elements", `<:${config.emoji.x}> ${missingConfigs.join(`\n<:${config.emoji.x}> `)}`)
				.setColor("#e74c3c");
			return message.channel.send(embed);
		}

		if (client.channels.get(qServerDb.config.channels.suggestions)) {
			let perms = core.channelPermissions(client.channels.get(qServerDb.config.channels.suggestions).memberPermissions(client.user.id), "suggestions", client);
			if (perms.length > 0) {
				let embed = new Discord.RichEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${qServerDb.config.channels.suggestions}> channel:`)
					.addField("Missing Elements", `<:${config.emoji.x}> ${perms.join(`\n<:${config.emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${qServerDb.config.channels.suggestions}>, make sure that **${client.user.username}** has a <:${config.emoji.check}> for the above permissions.`)
					.setColor("#e74c3c");
				return message.channel.send(embed);
			}
		} else {
			return message.channel.send(`<:${config.emoji.x}> Could not find your suggestions channel! Please make sure you have configured a suggestion channel.`);
		}

		if (client.channels.get(qServerDb.config.channels.staff)) {
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
			if (reason.length > 1024) return message.channel.send(`<:${config.emoji.x}> Comments cannot be longer than 1024 characters.`);
		}
		let suggestions = reasonSplit[0].split(" ");

		if (suggestions[suggestions.length - 1] === "") suggestions.pop();
		if (suggestions.some(isNaN)) return message.channel.send(`<:${config.emoji.x}> One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers.`);
		let su = suggestions.map(Number);
		let msg = await message.channel.send("Processing... this may take a moment");

		let { n, nModified } = await Suggestion.update({
			suggestionId: { $in: su },
			status: "awaiting_review"
		}, {
			$set: {
				status: "approved",
				staff_member: message.author.id,
				votes: {
					upvotes: 0,
					downvotes: 0
				}
			},
		}, {
			multi: true
		});

		let postApprove = await Suggestion.find({ id: message.guild.id, suggestionId: { $in: su } });
		let approved = postApprove.filter((s) => s.status === "approved");
		let approvedId = postApprove.map((s) => s.suggestionId);
		let notApprovedId = su.filter((s) => !approvedId.includes(s));

		if (n !== 0) {
			await msg.edit(
				new Discord.RichEmbed()
					.setDescription(`<:${config.emoji.check}> ${nModified !== 0 ? "Successfully approved" : "Approved"} ${nModified}/${su.length} suggestions`)
					.addField("Result", `**Approved**: ${approvedId.length > 0 ? approvedId.join(", ") : "No suggestions were approved."}\n${notApprovedId.length > 0 ? "**Could Not Approve**: " + notApprovedId.join(", ") : ""}`)
					.setColor("#2ecc71")
					.setFooter(nModified !== su.length
						? "One or more of your suggestions could not be approved. Please make sure the suggestion IDs you have provided exist and have not already been approved."
						: "All of your suggestions have been approved."
					)
			);
		} else {
			return await msg.edit(
				new Discord.RichEmbed()
					.setDescription(`<:${config.emoji.x}> None of the suggestions you provided could be approved. Please make sure the suggestion IDs you have provided exist and have not already been approved.`)
					.setColor("#e74c3c")
			);
		}

		for (let s in approved) {
			// eslint-disable-next-line no-prototype-builtins
			if (approved.hasOwnProperty(s)) {
				let suggester = client.users.get(approved[s].suggester)
					|| client.fetchUser(approved[s].suggester);

				let msg = await client.channels.get(qServerDb.config.channels.suggestions)
					.send(await core.suggestionEmbed(approved[s], qServerDb, client));

				if (qServerDb.config.notify) {
					let dmEmbed = new Discord.RichEmbed()
						.setTitle("Your suggestion was approved!")
						.setFooter(`Suggestion ID: ${approved[s].suggestionId}`)
						.setDescription(approved[s].suggestion)
						.addField("Suggestions Feed Post", `[Jump to Suggestion](https://discordapp.com/channels/${qServerDb.id}/${qServerDb.config.channels.suggestions}/${msg.id})`)
						.setColor("#2ecc71");
					if (reason) dmEmbed.addField("Comment Added", reason);

					await suggester.send(dmEmbed)
						.catch((err) => {
							console.log(err);
						});
				}

				if (qServerDb.config.channels.log) {
					let logEmbed = new Discord.RichEmbed()
						.setAuthor(`${message.author.tag} approved #${approved[s].suggestionId}`, message.author.displayAvatarURL)
						.addField("Suggestion", approved[s].suggestion)
						.setFooter(`Suggestion ID: ${approved[s].suggestionId} | Approver ID: ${message.author.id}`)
						.setTimestamp()
						.setColor("#2ecc71");
					if (reason) logEmbed.addField("Comment Added by Approver", reason);
					core.serverLog(logEmbed, qServerDb);
				}

				let updateEmbed = new Discord.RichEmbed()
					.setTitle("Suggestion Awaiting Review (#" + approved[s].suggestionId + ")")
					.setAuthor(`${suggester.tag} (ID: ${suggester.id})`, suggester.displayAvatarURL)
					.setDescription(approved[s].suggestion)
					.setColor("#2ecc71")
					.addField("A change was processed on this suggestion", "This suggestion has been approved");
				client.channels.get(qServerDb.config.channels.staff)
					.fetchMessage(approved[s].reviewMessage)
					.then((fetched) => fetched.edit(updateEmbed));

				if (qServerDb.config.react) {
					await msg.react(approved[s].emojis.up);
					await msg.react(approved[s].emojis.mid);
					await msg.react(approved[s].emojis.down);
				}
				let modified = approved[s];
				if (reason) {
					modified.comments = [{
						comment: reason,
						author: message.author.id,
						id: 1
					}];
				}
				approved[s] = modified;
				modified.messageId = msg.id;
				await approved[s].save();
			}
		}
	}
};


