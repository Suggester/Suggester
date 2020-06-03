const { emoji } = require("../config.json");
module.exports = {
	string: function (string_name, replaced, prefix_with) {
		const list = module.exports.list;
		const string = list[string_name];
		if (!string) return `String ${string_name} Not Found`;
		let newString = string.string;
		if (string.replaced) {
			Object.keys(string.replaced).forEach(r => {
				if (replaced[r]) newString = newString.replace(new RegExp(string.replaced[r].to_replace, "g"), replaced[r]);
			});
		}
		switch (prefix_with) {
		case "success":
			newString = `<:${emoji.check}> ${newString}`;
			break;
		case "error":
			newString = `<:${emoji.x}> ${newString}`;
			break;
		}
		return newString;
	},
	list: {
		"NO_ACK_SET": {
			string: "No Acknowledgement Set",
			context: "Shown in the acknowledgement command when no acknowledgement is set for user"
		},
		"ACK_FILLER_TEXT": {
			string: "{{user}}'s acknowledgement is: `{{acknowledgement}}`",
			context: "Shows a user's acknowledgement",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The tag of a user"
				},
				acknowledgement: {
					to_replace: "{{acknowledgement}}",
					description: "The acknowledgement set for a user"
				}
			}
		},
		"ACK_RESET_SUCCESS": {
			string: "{{user}}'s acknowledgement has been reset.",
			context: "Shows after user's name when the acknowledgement has been reset",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The tag of a user"
				}
			}
		},
		"ACK_SET_SUCCESS": {
			string: "Set `{{user}}`'s acknowledgement to **{{acknowledgement}}**.",
			context: "Text showing that the acknowledgement has been set for a user",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The tag of a user"
				},
				acknowledgement: {
					to_replace: "{{acknowledgement}}",
					description: "The acknowledgement set for a user"
				}
			}
		},
		"NO_PLAYING_STATUS_ERROR": {
			string: "You must specify a playing status!",
			context: "Error that shows when the botconfig command is run without any playing status parameters"
		},
		"PLAYING_STATUS_SET_SUCCESS": {
			string: "Playing status set!",
			context: "Success message when the bot playing status is configured"
		},
		"NO_STATUS_ERROR": {
			string: "You must specify a valid status!",
			context: "Error that shows when the botconfig or mark commands are run without any status parameter"
		},
		"STATUS_SET_SUCCESS": {
			string: "Status set!",
			context: "Success message when the bot status is configured"
		},
		"NO_AVATAR_ERROR": {
			string: "You must specify an avatar!",
			context: "Error that shows when the botconfig command is run without any avatar parameter"
		},
		"INVALID_AVATAR_ERROR": {
			string: "Please provide a valid image URL! Images can have extensions of `jpeg`, `jpg`, `png`, or `gif`",
			context: "Error that shows when the avatar specified is invalid"
		},
		"AVATAR_SET_SUCCESS": {
			string: "Avatar set!",
			context: "Success message when the bot avatar is configured"
		},
		"NO_DB_PARAMS_SPECIFIED_ERROR": {
			string: "You must specify whether to query or modify, a collection name, query field, and query value.",
			context: "Shown in the db command when not enough parameters are specified"
		},
		"INVALID_COLLECTION_ERROR": {
			string: "Collection {{collection}} is invalid.",
			context: "Shown when the collection specified in the db command is not a valid database collection",
			replaced: {
				collection: {
					to_replace: "{{collection}}",
					description: "The name of a database collection"
				}
			}
		},
		"NO_MODIFICATION_PARAMS_ERROR": {
			string: "You must specify modification parameters!",
			context: "Shown when trying to modify the database with no modification parameters"
		},
		"DB_EMBED_TITLE_MODIFIED": {
			string: "Database Modified",
			context: "Title of the db command embed if the database was modified"
		},
		"DB_EMBED_TITLE_QUERY": {
			string: "Database Query",
			context: "Title of the db command embed if the database was queried"
		},
		"DB_EMBED_QUERY_INFO": {
			string: "**Collection:** {{collection}}\n**Query:** {{query}}",
			context: "Description of the db command embed which shows the query information",
			replaced: {
				collection: {
					to_replace: "{{collection}}",
					description: "Collection name"
				},
				query: {
					to_replace: "{{query}}",
					description: "Query object"
				}
			}
		},
		"DB_EMBED_MODIFY_INFO": {
			string: "**Field:** {{field}}\n**Old Value:** {{oldValue}}\n**New Value:** {{newValue}}",
			context: "Information that shows if the database was modified",
			replaced: {
				field: {
					to_replace: "{{field}}",
					description: "Field name"
				},
				oldValue: {
					to_replace: "{{oldValue}}",
					description: "Old value of field"
				},
				newValue: {
					to_replace: "{{newValue}}",
					description: "New value of field"
				}
			}
		},
		"DB_NO_RESULT_FOUND": {
			string: "No Result Found",
			context: "Shows when no result is found in the database"
		},
		"RESULT_FIELD_TITLE": {
			string: "Result",
			context: "The result of a command"
		},
		"DEPLOY_NOT_PRODUCTION": {
			string: "I am not running in the production environment. You probably don't want to deploy now.",
			context: "Error produced when the bot is not running in the production environment and a deploy is attempted"
		},
		"PROCESSING": {
			string: "Processing... this may take a moment",
			context: "String used when the bot is processing an input"
		},
		"CANCELLED": {
			string: "Cancelled",
			context: "String used when an action is cancelled"
		},
		"SPECIFY_USER_OR_GUILD_ERROR": {
			string: "You must specify `user` or `guild`",
			context: "Error sent when the specified flag type is invalid"
		},
		"USER_FLAGS_LIST": {
			string: "{{user}}'s flags are: `{{flags}}`",
			context: "String used for listing user flags",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The tag of a user"
				},
				flags: {
					to_replace: "{{flags}}",
					description: "List of user flags"
				}
			}
		},
		"NO_FLAGS_SET": {
			string: "No Flags Set",
			context: "String shown when no flags are set for a user"
		},
		"NO_FLAG_SPECIFIED_ERROR": {
			string: "You must specify a flag!",
			context: "Error shown when no flag is specified"
		},
		"FLAG_ALREADY_PRESENT_ERROR": {
			string: "Flag {{flag}} is already present.",
			context: "Shown when a flag is already added to a user/guild",
			replaced: {
				flag: {
					to_replace: "{{flag}}",
					description: "The flag specified by the user"
				}
			}
		},
		"FLAG_NOT_PRESENT_ERROR": {
			string: "Flag {{flag}} is not present.",
			context: "Shown when a flag is not currently added to a user/guild",
			replaced: {
				flag: {
					to_replace: "{{flag}}",
					description: "The flag specified by the user"
				}
			}
		},
		"ADD_REMOVE_INVALID_ACTION_ERROR": {
			string: "You must specify `add` or `remove`.",
			context: "Error shown when an invalid action is specified in the flag command"
		},
		"FLAG_ADDED_USER_SUCCESS": {
			string: "Flag `{{flag}}` added to {{user}}",
			context: "Message shown when a flag is added to a user",
			replaced: {
				flag: {
					to_replace: "{{flag}}",
					description: "The flag specified by the user"
				},
				user: {
					to_replace: "{{user}}",
					description: "The tag of a user"
				}
			}
		},
		"FLAG_REMOVED_USER_SUCCESS": {
			string: "Flag `{{flag}}` removed from {{user}}",
			context: "Message shown when a flag is removed from a user",
			replaced: {
				flag: {
					to_replace: "{{flag}}",
					description: "The flag specified by the user"
				},
				user: {
					to_replace: "{{user}}",
					description: "The tag of a user"
				}
			}
		},
		"INVALID_GUILD_ID_ERROR": {
			string: "Invalid guild ID",
			context: "String used when a specified guild ID is invalid"
		},
		"GUILD_FLAGS_LIST": {
			string: "Guild `{{guild}}` has the following flags: `{{flags}}`",
			context: "String used for listing guild flags",
			replaced: {
				guild: {
					to_replace: "{{guild}}",
					description: "The ID of a guild"
				},
				flags: {
					to_replace: "{{flags}}",
					description: "List of user flags"
				}
			}
		},
		"FLAG_ADDED_GUILD_SUCCESS": {
			string: "Flag `{{flag}}` added to guild `{{guild}}`",
			context: "Message shown when a flag is added to a guild",
			replaced: {
				flag: {
					to_replace: "{{flag}}",
					description: "The flag specified by the user"
				},
				guild: {
					to_replace: "{{guild}}",
					description: "The ID of a guild"
				}
			}
		},
		"FLAG_REMOVED_GUILD_SUCCESS": {
			string: "Flag `{{flag}}` removed from guild `{{guild}}`",
			context: "Message shown when a flag is removed from a guild",
			replaced: {
				flag: {
					to_replace: "{{flag}}",
					description: "The flag specified by the user"
				},
				guild: {
					to_replace: "{{guild}}",
					description: "The ID of a guild"
				}
			}
		},
		"INVALID_USER_ERROR": {
			string: "You must specify a valid user!",
			context: "String used when no/an invalid user is specified in a command"
		},
		"INVALID_GLOBALBAN_PARAMS_ERROR": {
			string: "Invalid blacklist setting. Use `true` to blacklist and `false` to unblacklist.",
			context: "Error produced when globalban is run with an invalid blacklist setting"
		},
		"IS_GLOBALLY_BANNED": {
			string: "{{banned}} is globally blocked.",
			context: "String used when a user/guild is globally blocked",
			replaced: {
				banned: {
					to_replace: "{{banned}}",
					description: "The user/guild identifier"
				}
			}
		},
		"IS_NOT_GLOBALLY_BANNED": {
			string: "{{banned}} is not globally blocked.",
			context: "String used when a user/guild is not globally blocked",
			replaced: {
				banned: {
					to_replace: "{{banned}}",
					description: "The user/guild identifier"
				}
			}
		},
		"USER_PROTECTED_ERROR": {
			string: "This user is protected and cannot be blacklisted.",
			context: "Error shown when a user is protected and someone attempts to globally blacklist them"
		},
		"GUILD_PROTECTED_ERROR": {
			string: "This guild is protected and cannot be blacklisted.",
			context: "Error shown when a guild is protected and someone attempts to globally blacklist it"
		},
		"GUILD_WHITELIST_ADD_SUCCESS": {
			string: "Whitelisted guild with ID `{{guild}}`",
			context: "Success message when a guild is whitelisted",
			replaced: {
				guild: {
					to_replace: "{{guild}}",
					description: "The ID of a guild"
				}
			}
		},
		"GUILD_WHITELIST_REMOVE_SUCCESS": {
			string: "Unwhitelisted guild with ID `{{guild}}`",
			context: "Success message when a guild is unwhitelisted",
			replaced: {
				guild: {
					to_replace: "{{guild}}",
					description: "The ID of a guild"
				}
			}
		},
		"NO_GUILD_DATABASE_ENTRY_ERROR": {
			string: "This guild does not have a database entry!",
			context: "String used when a guild does not have a database entry for fetching data through global commands"
		},
		"NONE_CONFIGURED": {
			string: "None Configured",
			context: "Used when a configuration element is not configured"
		},
		"CFG_ADMIN_ROLES_TITLE": {
			string: "**Admin Roles:**",
			context: "Denotes the list of admin roles when configuration is listed"
		},
		"CFG_BLOCKED_ROLES_TITLE": {
			string: "**Blocked Roles:**",
			context: "Denotes the list of blocked roles when configuration is listed"
		},
		"CFG_STAFF_ROLES_TITLE": {
			string: "**Staff Roles:**",
			context: "Denotes the list of staff roles when configuration is listed"
		},
		"CFG_ALLOWED_ROLES_TITLE": {
			string: "**Allowed Suggesting Roles:**",
			context: "Denotes the list of allowed suggesting roles when configuration is listed"
		},
		"CFG_ALLOWED_ROLES_APPEND": {
			string: "(all users can submit suggestions)",
			context: "Appended to the end of the configuration value for allowed suggesting roles if none are configured"
		},
		"CFG_APPROVED_ROLE_TITLE": {
			string: "**Approved Suggestion Role:**",
			context: "Denotes the approved suggestion role when configuration is listed"
		},
		"CFG_SUGGESTION_CHANNEL_TITLE": {
			string: "**Approved Suggestions Channel:**",
			context: "Denotes the approved suggestion channel when configuration is listed"
		},
		"CFG_REVIEW_CHANNEL_TITLE": {
			string: "**Suggestion Review Channel:**",
			context: "Denotes the suggestion review channel when configuration is listed"
		},
		"CFG_REVIEW_NOT_NECESSARY_APPEND": {
			string: "(Unnecessary because the mode is set to autoapprove)",
			context: "Appended to the end of the review channel configuration element when none is set and the mode is set to autoapprove"
		},
		"CFG_DENIED_CHANNEL_TITLE": {
			string: "**Denied Suggestions Channel:**",
			context: "Denotes the denied suggestions channel when configuration is listed"
		},
		"CFG_LOG_CHANNEL_TITLE": {
			string: "**Log Channel:**",
			context: "Denotes the log channel when configuration is listed"
		},
		"CFG_ARCHIVE_CHANNEL_TITLE": {
			string: "**Implemented Suggestions Archive Channel:**",
			context: "Denotes the implemented suggestions archive channel when configuration is listed"
		},
		"CFG_COMMANDS_CHANNEL_TITLE": {
			string: "**Suggestion Command Channel:**",
			context: "Denotes the implemented suggestions archive channel when configuration is listed"
		},
		"CFG_COMMANDS_CHANNEL_APPEND": {
			string: "(Suggestions can be made in all channels)",
			context: "Appended to the end of the commands channel configuration value if none is specified"
		},
		"CFG_UPVOTE_REACTION_DISABLED": {
			string: "(Upvote Reaction Disabled)",
			context: "Shown when the upvote reaction config element is disabled"
		},
		"CFG_MID_REACTION_DISABLED": {
			string: "(Shrug/No Opinion Reaction Disabled)",
			context: "Shown when the shrug/no opinion reaction config element is disabled"
		},
		"CFG_DOWNVOTE_REACTION_DISABLED": {
			string: "(Downvote Reaction Disabled)",
			context: "Shown when the downvote reaction config element is disabled"
		},
		"CFG_REACTION_EMOJIS_TITLE": {
			string: "**Suggestion Feed Reactions:**",
			context: "Denotes the suggestion feed reactions when configuration is listed"
		},
		"ENABLED": {
			string: "Enabled",
			context: "Used when something is enabled"
		},
		"DISABLED": {
			string: "Disabled",
			context: "Used when something is disabled"
		},
		"CFG_MODE_TITLE": {
			string: "**Mode:**",
			context: "Denotes the mode when configuration is listed"
		},
		"CFG_MODE_REVIEW": {
			string: "All suggestions are held for review",
			context: "Shown when the mode is set to review"
		},
		"CFG_MODE_AUTOAPPROVE": {
			string: "All suggestions are automatically approved",
			context: "Shown when the mode is set to autoapprove"
		},
		"ERROR": {
			string: "An error occurred. Please try again.",
			context: "Used when an unknown error occurs."
		},
		"CFG_PREFIX_TITLE": {
			string: "**Prefix:**",
			context: "Denotes the prefix when configuration is listed"
		},
		"CFG_NOTIFICATIONS_TITLE": {
			string: "**DM Notifications:**",
			context: "Denotes the notification setting when configuration is listed"
		},
		"CFG_CLEAN_COMMANDS_TITLE": {
			string: "**Clean Suggestion Commands:**",
			context: "Denotes the clean commands setting when configuration is listed"
		},
		"SERVER_CONFIGURATION_TITLE": {
			string: "Server Configuration for {{server}}",
			context: "Title for the configuration list embed",
			replaced: {
				server: {
					to_replace: "{{server}}",
					description: "A server name"
				}
			}
		},
		"ROLE_CONFIGURATION_TITLE": {
			string: "Role Configuration",
			context: "Title for the Role Configuration field of the configuration list"
		},
		"CHANNEL_CONFIGURATION_TITLE": {
			string: "Channel Configuration",
			context: "Title for the Channel Configuration field of the configuration list"
		},
		"OTHER_CONFIGURATION_TITLE": {
			string: "Other Configuration",
			context: "Title for the Other Configuration field of the configuration list"
		},
		"CFG_STATUS_TITLE": {
			string: "Config Status",
			context: "Title for the Config Status field of the configuration list"
		},
		"CFG_STATUS_GOOD": {
			string: "Bot configured, commands will work",
			context: "Shown when the bot is configured enough to work"
		},
		"CFG_STATUS_BAD": {
			string: "Not fully configured, bot will not work",
			context: "Shown when the bot is not configured enough to work"
		},
		"CFG_PERMISSIONS_TITLE": {
			string: "Bot Permissions",
			context: "Title for the Bot Permissions field of the configuration list"
		},
		"CFG_FLAGS_TITLE": {
			string: "Server Flags",
			context: "Title for the Server Flags field of the configuration list"
		},
		"PAGINATION_NAVIGATION_INSTRUCTIONS": {
			string: "Use the arrow reactions to navigate pages, and the ⏹ reaction to close the embed",
			context: "Included in pagination embeds to give instructions on how to navigate pages"
		},
		"PAGINATION_PAGE_COUNT": {
			string: "Page {{current}}/{{total}}",
			context: "Included in pagination embeds to show the number of pages and the current page",
			replaced: {
				current: {
					to_replace: "{{current}}",
					description: "The current page number"
				},
				total: {
					to_replace: "{{total}}",
					description: "The total number of pages"
				}
			}
		},
		"CHANGELOG_RELEASED_FOOTER": {
			string: "Changelog released at",
			context: "Included in pagination embeds to give instructions on how to navigate pages"
		},
		"CHANGELOG_EMBED_HEADER": {
			string: "Changelog: {{version}}",
			context: "The title of the changelog embed",
			replaced: {
				version: {
					to_replace: "{{version}}",
					description: "The version number of the latest release"
				}
			}
		},
		"HELP_BASE_DESCRIPTION": {
			string: "Please see https://suggester.js.org/ for a command list and usage information!",
			context: "Help command description directing to the documentation"
		},
		"HELP_PREFIX_INFO": {
			string: "My prefix in this server is {{prefix}}",
			context: "Shows prefix in the help command",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server's prefix"
				}
			}
		},
		"HELP_PERMISSION_LEVEL": {
			string: "Permission Level",
			context: "Permission Level field name in help command"
		},
		"HELP_USAGE": {
			string: "Usage",
			context: "Usage field name in help command"
		},
		"HELP_DOCUMENTATION": {
			string: "Documentation",
			context: "Documentation field name in help command"
		},
		"HELP_ADDITIONAL_INFO": {
			string: "Additional Information",
			context: "Additional Information field name in help command"
		},
		"HELP_ALIAS": {
			string: "Alias",
			context: "Alias field name in help command"
		},
		"HELP_ALIAS_PLURAL": {
			string: "Aliases",
			context: "Aliases field name in help command"
		},
		"COMMAND_DISABLED": {
			string: "This command is currently disabled globally.",
			context: "Used when a command is disabled globally"
		},
		"MISSING_CONFIG_TITLE": {
			string: "Missing Config!",
			context: "Title to any missing configuration warning embed"
		},
		"MISSING_CONFIG_DESCRIPTION": {
			string: "This server has an incomplete configuration.\nA server manager can run `{{prefix}}setup` to configure it.",
			context: "Description to any missing configuration warning embed",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server's prefix"
				}
			}
		},
		"INVITE_BOT": {
			string: "You can invite {{name}} to your server with this link: {{link}}",
			context: "The response to the invite command",
			replaced: {
				name: {
					to_replace: "{{name}}",
					description: "The bot name"
				},
				link: {
					to_replace: "{{link}}",
					description: "The bot invite link"
				}
			}
		},
		"INVITE_RESTRICTED": {
			string: "This bot cannot be invited publicly. You can invite the public version with this link: {{link}}",
			context: "Used when the invite command is run on a private instance",
			replaced: {
				link: {
					to_replace: "{{link}}",
					description: "The bot invite link"
				}
			}
		},
		"NOTIFICATIONS_ENABLED": {
			string: "Notifications are **enabled**. You will receive a DM when an action is taken on any of your suggestions.",
			context: "Shown when a user has enabled notifications"
		},
		"NOTIFICATIONS_DISABLED": {
			string: "Notifications are **disabled**. You will not receive a DM when an action is taken on any of your suggestions.",
			context: "Shown when a user has disabled notifications"
		},
		"NOTIFICATIONS_ALREADY_ENABLED": {
			string: "DM Notifications are already enabled.",
			context: "Shown when notifications are enabled and a user tries to enable them"
		},
		"NOTIFICATIONS_ALREADY_DISABLED": {
			string: "DM Notifications are already disabled.",
			context: "Shown when notifications are disabled and a user tries to disable them"
		},
		"ON_OFF_TOGGLE_ERROR": {
			string: "You must specify `on`, `off`, or `toggle`.",
			context: "Used when a configuration element requires on, off, or toggle parameters"
		},
		"PING_DEVELOPERS_HEADER": {
			string: "Developers",
			context: "Developers header for the ping command"
		},
		"PING_GUILD_COUNT_HEADER": {
			string: "Guild Count",
			context: "Guild Count header for the ping command (also used in stats)"
		},
		"PING_UPTIME_HEADER": {
			string: "Uptime",
			context: "Uptime header for the ping command"
		},
		"PING_SHARD_PING_HEADER": {
			string: "Shard Ping",
			context: "Shard Ping header for the ping command"
		},
		"PING_BOT_LATENCY_HEADER": {
			string: "Bot Latency",
			context: "Bot latency (previously 'Edit Time') header for the ping command"
		},
		"UNCONFIGURED_ERROR": {
			string: "You must configure your server to use this command. Please use the `setup` command.",
			context: "Used when a server does not have a database entry"
		},
		"NO_ALLOWED_ROLE_ERROR": {
			string: "You do not have a role with permission to submit suggestions.\nThe following roles can submit suggestions: {{roleList}}",
			context: "Error when a user tries to suggest without an approved role",
			replaced: {
				roleList: {
					to_replace: "{{roleList}}",
					description: "A list of roles that are allowed to submit suggestions"
				}
			}
		},
		"NOT_COMMAND_CHANNEL_ERROR": {
			string: "Suggestions can only be submitted in the {{channel}} channel.",
			context: "Error when a user uses suggest in a non-command channel",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "The mention of the commands channel"
				}
			}
		},
		"NO_SUGGESTION_ERROR": {
			string: "Please provide a suggestion!",
			context: "Error when a user does not provide a suggestion in the suggest command"
		},
		"TOO_LONG_SUGGESTION_ERROR": {
			string: "Suggestions cannot be longer than 1024 characters.",
			context: "Error when a suggestion is too long"
		},
		"NO_REVIEW_CHANNEL_ERROR": {
			string: "I could not find your suggestion review channel! Please make sure you have configured one.",
			context: "Error when the configured staff review channel is not found"
		},
		"NO_SUGGESTION_CHANNEL_ERROR": {
			string: "I could not find your approved suggestions channel! Please make sure you have configured one.",
			context: "Error when the configured suggestions channel is not found"
		},
		"SUGGESTION_FROM_TITLE": {
			string: "Suggestion from {{user}}",
			context: "Title for embeds showing who the suggesting user is",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user's tag"
				}
			}
		},
		"SUGGESTION_FOOTER": {
			string: "Suggestion ID: {{id}} | Submitted at",
			context: "Footer for suggestion embeds",
			replaced: {
				id: {
					to_replace: "{{id}}",
					description: "A suggestion ID"
				}
			}
		},
		"SUGGESTION_SUBMITTED_REVIEW_SUCCESS": {
			string: "Your suggestion has been submitted for review!",
			context: "Success message when a suggestion is sent for review"
		},
		"SUGGESTION_REVIEW_EMBED_TITLE": {
			string: "Suggestion Awaiting Review (#{{id}})",
			context: "Title for the suggestion review embed",
			replaced: {
				id: {
					to_replace: "{{id}}",
					description: "A suggestion ID"
				}
			}
		},
		"USER_INFO_HEADER": {
			string: "{{user}} (ID: {{id}})",
			context: "Used when a header using the user's tag and ID is present",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "A user ID"
				}
			}
		},
		"APPROVE_DENY_HEADER": {
			string: "Approve/Deny",
			context: "Header for the approve/deny field of the review embed"
		},
		"REVIEW_COMMAND_INFO": {
			string: "Use **{{prefix}}approve {{id}}** to send to {{channel}}\nUse **{{prefix}}deny {{id}}** to deny",
			context: "Information in the review embed showing instructions on how to approve/deny",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server's prefix"
				},
				id: {
					to_replace: "{{id}}",
					description: "A suggestion ID"
				},
				channel: {
					to_replace: "{{channel}}",
					description: "The suggestions channel mention"
				}
			}
		},
		"WITH_ATTACHMENT_HEADER": {
			string: "With Attachment",
			context: "Header used when a suggestion has an attachment"
		},
		"SUGGESTION_HEADER": {
			string: "Suggestion",
			context: "Header used for the suggestion content"
		},
		"LOG_SUGGESTION_SUBMITTED_REVIEW_TITLE": {
			string: "{{user}} submitted a suggestion for review",
			context: "Title in the log embed when a suggestion is submitted for review",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user tag"
				}
			}
		},
		"LOG_SUGGESTION_SUBMITTED_AUTOAPPROVE_TITLE": {
			string: "{{user}} submitted a suggestion",
			context: "Title in the log embed when a suggestion is submitted in autoapprove mode",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user tag"
				}
			}
		},
		"LOG_SUGGESTION_SUBMITTED_FOOTER": {
			string: "Suggestion ID: {{id}} | User ID: {{user}}",
			context: "Description of the log embed when a user is shown",
			replaced: {
				id: {
					to_replace: "{{id}}",
					description: "A suggestion ID"
				},
				user: {
					to_replace: "{{user}}",
					description: "A user ID"
				}
			}
		},
		"SUGGESTION_SUBMITTED_AUTOAPPROVE_SUCCESS": {
			string: "Your suggestion has been added to the {{channel}} channel!",
			context: "Success message when a suggestion is submitted in the autoapprove mode",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "Mention of the suggestion channel"
				}
			}
		},
		"SUPPORT_INVITE": {
			string: "Need help with the bot? Join our support server at {{link}} 😉",
			context: "Response to the support command",
			replaced: {
				link: {
					to_replace: "{{link}}",
					description: "The link to the support server"
				}
			}
		},
		"VERIFY_ACK_DEVELOPER": {
			string: "Developer",
			context: "Verify acknowledgement for Developer"
		},
		"VERIFY_ACK_GLOBAL_ADMIN": {
			string: "Global Administrator",
			context: "Verify acknowledgement for Global Administrator"
		},
		"VERIFY_ACK_GLOBAL_STAFF": {
			string: "Suggester Staff Team",
			context: "Verify acknowledgement for Suggester Staff Team"
		},
		"VERIFY_ACK_GLOBAL_BLACKLIST": {
			string: "Blacklisted Globally",
			context: "Verify acknowledgement for Blacklisted Globally"
		},
		"VERIFY_ACK_SERVER_ADMIN": {
			string: "Server Admin",
			context: "Verify acknowledgement for Server Admin"
		},
		"VERIFY_ACK_SERVER_STAFF": {
			string: "Server Staff",
			context: "Verify acknowledgement for Server Staff"
		},
		"VERIFY_ACK_SERVER_BLACKLIST": {
			string: "Blacklisted on this server",
			context: "Verify acknowledgement for Blacklisted on this server"
		},
		"VERIFY_TITLE_GLOBAL_ACKS": {
			string: "Global Acknowledgements",
			context: "Header for the global acknowledgements section of the verify command"
		},
		"VERIFY_TITLE_SERVER_ACKS": {
			string: "Server Acknowledgements",
			context: "Header for the server acknowledgements section of the verify command"
		},
		"VERIFY_FLAGS_TITLE": {
			string: "User Flags",
			context: "Header for the user flags section of the verify embed"
		},
		"VERIFY_NO_ACKS": {
			string: "This user has no acknowledgements",
			context: "Shown in the verify command when a user has no acknowledgements"
		},
		"VERIFY_PERMISSION_LEVEL_FOOTER": {
			string: "Permission Level: {{level}}",
			context: "The footer of the verify embed showing permission level",
			replaced: {
				level: {
					to_replace: "{{level}}",
					description: "The permission level of the user"
				}
			}
		},
		"VOTE_INFO": {
			string: "You can vote for Suggester on various bot lists, which is a great way to support the bot! If you're in the Suggester support server ({{link}}), you can get special rewards for voting 🤩\n>>> __Links to Vote:__\n{{links}}",
			context: "Response to the vote command",
			replaced: {
				link: {
					to_replace: "{{link}}",
					description: "Link to the support server"
				},
				links: {
					to_replace: "{{links}}",
					description: "Links to vote for the bot (takes up multiple lines)"
				}
			}
		},
		"AUTOSETUP_WARNING": {
			string: "⚠️ Automatic Setup Warning ⚠️\n**This setup will overwrite any previous configuration and add channels to your server.**\n\nIf you would like to continue with automatic setup, click the {{check}} reaction. If you would like to abort automatic setup, click the {{x}} reaction.",
			context: "Warning when automatic setup is initiated",
			replaced: {
				check: {
					to_replace: "{{check}}",
					description: "The check emoji"
				},
				x: {
					to_replace: "{{x}}",
					description: "The X emoji"
				}
			}
		},
		"SETUP_WARNING": {
			string: "⚠️ Warning ⚠️\n**This setup will overwrite any previous server configuration.**\n\nIf you would like to continue with setup, click the {{check}} reaction. If you would like to abort setup, click the {{x}} reaction.",
			context: "Warning when setup is initiated",
			replaced: {
				check: {
					to_replace: "{{check}}",
					description: "The check emoji"
				},
				x: {
					to_replace: "{{x}}",
					description: "The X emoji"
				}
			}
		},
		"SETUP_CANCELLED": {
			string: "**Setup Cancelled**",
			context: "Message when setup is cancelled"
		},
		"AUTOMATIC_SETUP": {
			string: "Automatic setup",
			context: "Audit log reason for automatic setup"
		},
		"CREATE_LOG_CHANNEL": {
			string: "Create suggestion log channel",
			context: "Audit log reason for log channel webhook creation"
		},
		"REMOVE_LOG_CHANNEL": {
			string: "Remove old log channel",
			context: "Audit log reason for log channel webhook deletion"
		},
		"AUTOMATIC_SETUP_COMPLETE": {
			string: "Automatic setup complete!\n>>> Want to use more advanced configuration elements like custom reactions, a role given on approved suggestions, and more? Try the `{{prefix}}config` command: https://suggester.js.org/#/admin/config",
			context: "Message sent when automatic setup is complete",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server's prefix"
				}
			}
		},
		"CONFIG_HELP": {
			string: "Please see https://suggester.js.org/#/admin/config for information about the config command. You can use `{{prefix}}autosetup` or `{{prefix}}setup` to automatically setup or walkthrough setting up your server",
			context: "General help when the config command is used with no parameters",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server's prefix"
				}
			}
		},
		"CFG_NO_ROLE_SPECIFIED_ERROR": {
			string: "You must specify a role name, @mention, or ID!",
			context: "Error when no role is specified for configuration"
		},
		"CFG_INVALID_ROLE_ERROR": {
			string: "I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.",
			context: "Error when an invalid role is specified for configuration"
		},
		"CFG_ALREADY_ADMIN_ROLE_ERROR": {
			string: "This role has already been added as an admin role!",
			context: "Error when a role has already been added as an admin role"
		},
		"CFG_ADMIN_ROLE_ADD_SUCCESS": {
			string: "Added **{{role}}** to the list of server admin roles.",
			context: "Success message when a role is added to the server admin role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_NOT_ADMIN_ROLE_ERROR": {
			string: "This role is not currently an admin role.",
			context: "Error when a role has not already been added as an admin role"
		},
		"CFG_ADMIN_ROLE_REMOVE_SUCCESS": {
			string: "Removed **{{role}}** from the list of server admin roles.",
			context: "Success message when a role is removed from the server admin role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_ALREADY_STAFF_ROLE_ERROR": {
			string: "This role has already been added as a staff role!",
			context: "Error when a role has already been added as a staff role"
		},
		"CFG_STAFF_ROLE_ADD_SUCCESS": {
			string: "Added **{{role}}** to the list of server staff roles.",
			context: "Success message when a role is added to the server staff role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_NOT_STAFF_ROLE_ERROR": {
			string: "This role is not currently a staff role.",
			context: "Error when a role has not already been added as a staff role"
		},
		"CFG_STAFF_ROLE_REMOVE_SUCCESS": {
			string: "Removed **{{role}}** from the list of server staff roles.",
			context: "Success message when a role is removed from the server staff role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_ALREADY_ALLOWED_ROLE_ERROR": {
			string: "This role has already been given permission to submit suggestions.",
			context: "Error when a role has already been added as an allowed suggesting role"
		},
		"CFG_ALLOWED_ROLE_ADD_SUCCESS": {
			string: "Members with the **{{role}}** role can now submit suggestions.",
			context: "Success message when a role is added to the allowed suggesting role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_NOT_ALLOWED_ROLE_ERROR": {
			string: "This role is not currently able to submit suggestions.",
			context: "Error when a role has not already been added as an allowed suggestion role"
		},
		"CFG_ALLOWED_ROLE_REMOVE_SUCCESS": {
			string: "Members with the **{{role}}** can no longer submit suggestions.",
			context: "Success message when a role is removed from the allowed suggesting role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_INVALID_ROLE_PARAM_ERROR": {
			string: "Please specify `add`, `remove`, or `list`.",
			context: "Error when a user specifies an invalid action for role configuration"
		},
		"CFG_RESET_APPROVED_ROLE_SUCCESS": {
			string: "Successfully reset the approved suggestion role.",
			context: "Success message when the approved suggestion role is reset"
		},
		"CFG_NO_MANAGE_ROLES_ERROR": {
			string: "Please give {{bot}} the **Manage Roles** permission in order for the approved suggestion role to work.",
			context: "Error when an approved suggestion role is configured but the bot does not have the Manage Roles permission",
			replaced: {
				bot: {
					to_replace: "{{bot}}",
					description: "The bot mention"
				}
			}
		},
		"CFG_ALREADY_APPROVED_ROLE_ERROR": {
			string: "This role is already set to be given when a member's suggestion is approved!",
			context: "Error when the specified approved suggestion role is already set"
		},
		"CFG_UNMANAGEABLE_ROLE_ERROR": {
			string: "I am not able to give members this role. Please ensure my highest role is __above__ the **{{role}}** role and that it is not a managed role.",
			context: "Error when the bot cannot give members an approved role",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_APPROVED_ROLE_SUCCESS": {
			string: "Members who have their suggestion approved will now receive the **{{role}}** role.",
			context: "Success message when the approved suggestion role is configured",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_NO_CHANNEL_SPECIFIED_ERROR": {
			string: "You must specify a channel #mention, channel ID, or channel name.",
			context: "Error when no channel is specified for configuration"
		},
		"CFG_INVALID_CHANNEL_ERROR": {
			string: "I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.",
			context: "Error when an invalid channel is specified for configuration"
		},
		"CFG_REVIEW_SET_SUCCESS": {
			string: "Successfully set {{channel}} as the suggestion review channel.",
			context: "Success message when the review channel is configured",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "A channel mention"
				}
			}
		},
		"CFG_SUGGESTIONS_SET_SUCCESS": {
			string: "Successfully set {{channel}} as the approved suggestions channel.",
			context: "Success message when the suggestions channel is configured",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "A channel mention"
				}
			}
		},
		"CFG_DENIED_SET_SUCCESS": {
			string: "Successfully set {{channel}} as the denied suggestions channel.",
			context: "Success message when the denied channel is configured",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "A channel mention"
				}
			}
		},
		"CFG_DENIED_RESET_SUCCESS": {
			string: "Successfully reset the denied suggestions channel.",
			context: "Success message when the denied channel is reset"
		},
		"CFG_WEBHOOK_CREATION_ERROR": {
			string: "A webhook could not be created in the provided channel. Please make sure that you have less than 10 webhooks in the channel and try again.",
			context: "Error shown when a webhook cannot be created in a log channel"
		},
		"CFG_LOG_SET_SUCCESS": {
			string: "Successfully set {{channel}} as the log channel.",
			context: "Success message when the log channel is configured",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "A channel mention"
				}
			}
		},
		"CFG_LOG_RESET_SUCCESS": {
			string: "Successfully reset the log channel.",
			context: "Success message when the log channel is reset"
		},
		"CFG_COMMANDS_SET_SUCCESS": {
			string: "Successfully set {{channel}} as the suggestion commands channel.",
			context: "Success message when the suggestion commands channel is configured",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "A channel mention"
				}
			}
		},
		"CFG_COMMANDS_RESET_SUCCESS": {
			string: "Successfully reset the suggestion commands channel.",
			context: "Success message when the suggestion commands channel is reset"
		},
		"CFG_ARCHIVE_SET_SUCCESS": {
			string: "Successfully set {{channel}} as the implemented suggestions archive channel.",
			context: "Success message when the implemented suggestions archive channel is configured",
			replaced: {
				channel: {
					to_replace: "{{channel}}",
					description: "A channel mention"
				}
			}
		},
		"CFG_ARCHIVE_RESET_SUCCESS": {
			string: "Successfully reset the implemented suggestions archive channel.",
			context: "Success message when the implemented suggestions archive channel is reset"
		},
		"CFG_PREFIX_TOO_LONG_ERROR": {
			string: "Your prefix must be 20 characters or less.",
			context: "Error shown when a specified prefix is too long"
		},
		"CFG_PREFIX_DISALLOWED_ERROR": {
			string: "This prefix is disallowed, please choose a different prefix.",
			context: "Error shown when a specified prefix is disallowed"
		},
		"CFG_PREFIX_SET_SUCCESS": {
			string: "Successfully set this server's prefix to **{{prefix}}**",
			context: "Success message when the prefix is configured",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server prefix"
				}
			}
		},
		"CFG_MODE_REVIEW_SET_SUCCESS": {
			string: "Successfully set the mode for this server to **review**.",
			context: "Success message when the mode is set to review"
		},
		"CFG_MODE_AUTOAPPROVE_SET_SUCCESS": {
			string: "Successfully set the mode for this server to **autoapprove**.",
			context: "Success message when the mode is set to autoapprove"
		},
		"CFG_SUGGESTIONS_AWAITING_REVIEW_ERROR": {
			string: "All suggestions awaiting review must be cleared before the autoapprove mode is set.",
			context: "Error when a user tries to set the autoapprove mode while suggestions are still awaiting review"
		},
		"CFG_MODE_INVALID_ERROR": {
			string: "Please specify a valid mode. (Either `review` or `autoapprove`)",
			context: "Error shown when the specified mode is invalid."
		},
		"CFG_EMOJI_UPVOTE_TITLE": {
			string: "Upvote",
			context: "Upvote header when emojis are listed in the config command"
		},
		"CFG_EMOJI_MID_TITLE": {
			string: "Shrug/No Opinion",
			context: "Middile reaction header when emojis are listed in the config command"
		},
		"CFG_EMOJI_DOWNVOTE_TITLE": {
			string: "Downvote",
			context: "Downvote header when emojis are listed in the config command"
		},
		"CFG_NO_EMOJI_ERROR": {
			string: "You must specify an emoji.",
			context: "Error when no emoji is specified for configuration"
		},
		"CFG_EMOJI_NOT_FOUND_ERROR": {
			string: "The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.",
			context: "Error when the specified emoji is not found"
		},
		"CFG_EMOJI_DISABLED_ERROR": {
			string: "This emoji is already disabled.",
			context: "Error shown when an emoji is already disabled"
		},
		"CFG_EMOJI_UP_DISABLE_SUCCESS": {
			string: "Successfully disabled the upvote reaction.",
			context: "Success message when the upvote reaction is disabled"
		},
		"CFG_EMOJI_MID_DISABLE_SUCCESS": {
			string: "Successfully disabled the shrug/no opinion reaction.",
			context: "Success message when the shrug/no opinion reaction is disabled"
		},
		"CFG_EMOJI_DOWN_DISABLE_SUCCESS": {
			string: "Successfully disabled the downvote reaction.",
			context: "Success message when the downvote reaction is disabled"
		},
		"CFG_EMOJI_UP_SET_SUCCESS": {
			string: "Successfully set the upvote emoji for this server to {{emote}}.",
			context: "Success message when the upvote reaction is set",
			replaced: {
				emote: {
					to_replace: "{{emote}}",
					description: "An emoji"
				}
			}
		},
		"CFG_EMOJI_MID_SET_SUCCESS": {
			string: "Successfully set the shrug/no opinion emoji for this server to {{emote}}.",
			context: "Success message when the shrug/no opinion reaction is set",
			replaced: {
				emote: {
					to_replace: "{{emote}}",
					description: "An emoji"
				}
			}
		},
		"CFG_EMOJI_DOWN_SET_SUCCESS": {
			string: "Successfully set the downvote emoji for this server to {{emote}}.",
			context: "Success message when the downvote reaction is set",
			replaced: {
				emote: {
					to_replace: "{{emote}}",
					description: "An emoji"
				}
			}
		},
		"CFG_FEED_REACTIONS_ENABLED": {
			string: "Suggestion feed reactions are **enabled**.",
			context: "Message when suggestion feed reactions are enabled"
		},
		"CFG_FEED_REACTIONS_DISABLED": {
			string: "Suggestion feed reactions are **disabled**.",
			context: "Message when suggestion feed reactions are disabled"
		},
		"CFG_FEED_REACTIONS_ALREADY_ENABLED": {
			string: "Suggestion feed reactions are already enabled.",
			context: "Message when suggestion feed reactions are already enabled"
		},
		"CFG_FEED_REACTIONS_ALREADY_DISABLED": {
			string: "Suggestion feed reactions are already disabled.",
			context: "Message when suggestion feed reactions are already disabled"
		},
		"CFG_EMOJI_INVALID_SETTING_ERROR": {
			string: "You must specify a valid emoji setting. (`up`, `mid`, `down`, `on`, `off`, `toggle`)",
			context: "Error when a user does not specify a valid emoji config setting"
		},
		"GUILD_NOTIFICATIONS_ENABLED": {
			string: "Notifications are **enabled**. Members will receive a DM when an action is taken on any of their suggestions.",
			context: "Shown when a guild has enabled notifications"
		},
		"GUILD_NOTIFICATIONS_DISABLED": {
			string: "Notifications are **disabled**. Members will not receive a DM when an action is taken on any of their suggestions.",
			context: "Shown when a guild has disabled notifications"
		},
		"GUILD_NOTIFICATIONS_ALREADY_ENABLED": {
			string: "Server notifications are already enabled.",
			context: "Shown when notifications are enabled and a guild tries to enable them"
		},
		"GUILD_NOTIFICATIONS_ALREADY_DISABLED": {
			string: "Server notifications are already disabled.",
			context: "Shown when notifications are disabled and a guild tries to disable them"
		},
		"CFG_CLEAN_COMMANDS_ENABLED": {
			string: "Auto-cleaning of suggestion commands is **enabled**.",
			context: "Shown when a guild has enabled cleaning of the suggest command"
		},
		"CFG_CLEAN_COMMANDS_DISABLED": {
			string: "Auto-cleaning of suggestion commands is **disabled**.",
			context: "Shown when a guild has cleaning of the suggest command"
		},
		"CFG_CLEAN_COMMANDS_ALREADY_ENABLED": {
			string: "Auto-cleaning of suggestion commands is already enabled.",
			context: "Shown when cleaning of suggestion commands is enabled and a guild tries to enable them"
		},
		"CFG_CLEAN_COMMANDS_ALREADY_DISABLED": {
			string: "Auto-cleaning of suggestion commands is already disabled.",
			context: "Shown when cleaning of suggestion commands is disabled and a guild tries to disable them"
		},
		"CFG_CLEAN_COMMANDS_NO_MANAGE_MESSAGES": {
			string: "Auto-cleaning of suggestion commands requires the bot have the **Manage Messages** permission in this server. Please give the bot this permission and try again.",
			context: "Error shown when the bot does not have Manage Messages and cleaning of suggestions commands is enabled"
		},
		"CFG_NO_PARAMS_ERROR": {
			string: "Invalid configuration element specified. Please run this command with no parameters to view configuration instructions.",
			context: "Error if no configuration element is specified"
		},
		"STATS_RESPONSE": {
			string: "You can find statistics about the bot at {{link}}",
			context: "Provides link to the chart dashboard of bot stats",
			replaced: {
				link: {
					to_replace: "{{link}}",
					description: "The link to the chart dashboard"
				}
			}
		},
		"INVALID_SUGGESTION_ID_ERROR": {
			string: "Please provide a valid suggestion ID.",
			context: "Error shown when the specified suggestion ID is invalid"
		},
		"SUGGESTION_NOT_APPROVED_ERROR": {
			string: "You can only perform this action on approved suggestions.",
			context: "Error shown when a suggestion is not approved and an action like comment/mark is used"
		},
		"SUGGESTION_IMPLEMENTED_ERROR": {
			string: "This suggestion has been marked as implemented and moved to the implemented archive channel, so no further actions can be taken on it.",
			context: "Error shown when a suggestion has already been marked as implemented and an action like comment/mark is used"
		},
		"NO_COMMENT_ERROR": {
			string: "You must provide a comment!",
			context: "Error shown when no comment is specified for the comment command"
		},
		"TOO_MANY_COMMENTS_ERROR": {
			string: "Due to Discord embed limitations, suggestions can only have up to 23 comments.",
			context: "Error shown when a suggestion has the maximum number of comments"
		},
		"COMMENT_TOO_LONG_ERROR": {
			string: "Comments cannot be longer than 1024 characters.",
			context: "Error shown when a specified comment is too long"
		},
		"SUGGESTION_FEED_MESSAGE_NOT_EDITED_ERROR": {
			string: "There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.",
			context: "Error shown when the suggestion feed embed cannot be edited"
		},
		"SUGGESTION_FEED_MESSAGE_NOT_FETCHED_ERROR": {
			string: "There was an error fetching the suggestion feed message. Please check that the suggestion feed message exists and try again.",
			context: "Error shown when the suggestion feed embed cannot be deleted"
		},
		"NO_SUGGESTION_CONTENT": {
			string: "[No Suggestion Content]",
			context: "Shown when there is a suggestion with no content"
		},
		"SUGGESTION_FEED_LINK": {
			string: "Suggestions Feed Post",
			context: "Hyperlink title to the suggestions feed post"
		},
		"COMMENT_TITLE_ANONYMOUS": {
			string: "Staff Comment",
			context: "Title for an anonymous comment"
		},
		"COMMENT_TITLE": {
			string: "Comment from {{user}} (ID {{id}})",
			context: "Title for a comment",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "A comment ID"
				}
			}
		},
		"ANONYMOUS_COMMENT_ADDED_TITLE": {
			string: "Anonymous Comment Added",
			context: "Header for the Anonymous Comment Added embed"
		},
		"COMMENT_ADDED_TITLE": {
			string: "Comment Added",
			context: "Header for the Comment Added embed"
		},
		"COMMENT_ADDED_DM_TITLE": {
			string: "A comment was added to your suggestion in **{{server}}**!",
			context: "Title for the DM notification of a comment being added to a suggestion",
			replaced: {
				server: {
					to_replace: "{{server}}",
					description: "The name of the server the command was run in"
				}
			}
		},
		"ANONYMOUS_COMMENT_ADDED_LOG": {
			string: "{{user}} added an anonymous comment to #{{id}}",
			context: "Title for the log embed when an anonymous comment is added",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"COMMENT_ADDED_LOG": {
			string: "{{user}} added a comment to #{{id}}",
			context: "Title for the log embed when a comment is added",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"SUGGESTION": {
			string: "Suggestion",
			context: "Header used throughout the bot showing the suggestion in question"
		},
		"MODE_AUTOAPPROVE_DISABLED_ERROR": {
			string: "This command is disabled when the mode is set to autoapprove.",
			context: "Error shown when a command only usable in the review mode is used in the autoapprove mode"
		},
		"SUGGESTION_ALREADY_APPROVED_APPROVE_ERROR": {
			string: "This suggestion has already been approved! Use `{{prefix}}delete {{id}}` to remove it.",
			context: "Error shown when a suggestion has already been approved and the approve command is used",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server prefix"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"SUGGESTION_ALREADY_DENIED_APPROVE_ERROR": {
			string: "This suggestion has already been denied! Previously denied suggestions cannot be approved.",
			context: "Error shown when a suggestion is already denied and a user attempts to approve it"
		},
		"SUGGESTION_ALREADY_DENIED_DENIED_ERROR": {
			string: "This suggestion has already been denied!",
			context: "Error shown when a suggestion is already denied and a user attempts to deny it"
		},
		"SUGGESTION_APPROVED_TITLE": {
			string: "Suggestion Approved",
			context: "Title for the suggestion approved embed"
		},
		"APPROVED_BY": {
			string: "Approved by {{user}}",
			context: "Details who approved a suggestion",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user tag"
				}
			}
		},
		"APPROVED_DM_TITLE": {
			string: "Your suggestion was approved in **{{server}}**!",
			context: "Title for the DM notification of a suggestion being approved",
			replaced: {
				server: {
					to_replace: "{{server}}",
					description: "The name of the server the command was run in"
				}
			}
		},
		"APPROVED_LOG": {
			string: "{{user}} approved #{{id}}",
			context: "Title for the log embed when a suggestion is approved",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"SUGGESTION_CHANGE_REVIEW_EMBED": {
			string: "A change was processed on this suggestion",
			context: "Shown when a suggestion is no longer in review"
		},
		"ALREADY_ATTACHMENT_ERROR": {
			string: "Due to Discord embed limitations, suggestions can only have 1 attachment.",
			context: "Error produced when a suggestion already has an attachment and a user attempts to add an attachment"
		},
		"NO_ATTACHMENT_ERROR": {
			string: "Please provide an attachment!",
			context: "Error shown when a user does not provide an attachment for the attach command"
		},
		"ATTACHMENT_ADDED_HEADER": {
			string: "Attachment Added",
			context: "Title of the reply embed when an attachment is added"
		},
		"ATTACHED_LOG": {
			string: "{{user}} added an attachment to #{{id}}",
			context: "Title for the log embed when an attachment is added to a suggestion",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"TIME_SETUP_WARNING": {
			string: "You have 2 minutes to respond",
			context: "Footer of setup embeds showing the amount of time a user has to respond"
		},
		"INPUTS": {
			string: "Inputs",
			context: "Header showing valid inputs for the setup command"
		},
		"SETUP_TIMED_OUT_ERROR": {
			string: "Setup has timed out. Please rerun the setup command if you would like to continue.",
			context: "Error shown when setup times out"
		},
		"SETUP_ADMIN_ROLES_DESC": {
			string: "Any member with a server admin role can use all staff commands, as well as edit bot configuration. Anyone who has the `Manage Server` permission is automatically counted as an admin regardless of server configuration.",
			context: "Description for the server admin setting in setup"
		},
		"SETUP_STAFF_ROLES_DESC": {
			string: "Any member with a server staff role can use all [staff commands](https://suggester.js.org/) to manage suggestions.",
			context: "Description for the server staff setting in setup"
		},
		"SETUP_ROLES_INPUT": {
			string: "You can send a **role name**, **role ID**, or **role @mention** in this channel.",
			context: "Valid inputs for setup roles"
		},
		"SETUP_CHANNELS_INPUT": {
			string: "You can send a **channel #mention**, **channel ID**, or **channel name**.",
			context: "Valid inputs for setup channels"
		},
		"SETUP_ROLES_DONE_TITLE": {
			string: "Done setting up roles?",
			context: "Title for the field showing how to finish specifying roles in setup"
		},
		"SETUP_ROLES_DONE_DESC": {
			string: "Type `done` to go to the next step\nIf you're not done, just specify another role!",
			context: "Information about how to move on to the next setting"
		},
		"SETUP_BEGIN": {
			string: "Starting setup... Send `cancel` at any time to exit setup.",
			context: "Shown at the start of the setup prompt"
		},
		"SETUP_MODE_DESC": {
			string: "This is the mode for managing suggestions, either `review` or `autoapprove`",
			context: "Description for the mode setting in setup"
		},
		"SETUP_REVIEW_TEXT": {
			string: "Review",
			context: "Header for review information in setup"
		},
		"SETUP_REVIEW_DESC": {
			string: "This mode holds all suggestions for staff review, needing to be manually approved before being posted to the suggestions channel.",
			context: "Description of the review mode in setup"
		},
		"SETUP_AUTOAPPROVE_TEXT": {
			string: "Autoapprove",
			context: "Header for autoapprove information in setup"
		},
		"SETUP_AUTOAPPROVE_DESC": {
			string: "This mode automatically sends all suggestions to the suggestions channel, with no manual review.",
			context: "Description of the autoapprove mode in setup"
		},
		"SETUP_MODE_INPUTS": {
			string: "A valid mode (either `review` or `autoapprove`)",
			context: "Valid inputs for mode in the setup command"
		},
		"SETUP_SUGGESTIONS_CHANNEL_DESC": {
			string: "This is the channel where all suggestions are sent once they are approved.",
			context: "Description of the suggestions channel for setup"
		},
		"SETUP_REVIEW_CHANNEL_DESC": {
			string: "This is the channel where all suggestions are sent once they are suggested and awaiting staff review.",
			context: "Description of the review channel for setup"
		},
		"SETUP_DENIED_CHANNEL_DESC": {
			string: "This is the channel where all denied or deleted suggestions are sent.",
			context: "Description of the denied channel for setup"
		},
		"SETUP_LOG_CHANNEL_DESC": {
			string: "This is the channel where all actions on suggestions are logged.",
			context: "Description of the log channel for setup"
		},
		"SETUP_SKIP_CHANNEL": {
			string: "This channel is optional, send `skip` to skip it.",
			context: "Information in setup about skipping setting a channel"
		},
		"SETUP_PREFIX_DESC": {
			string: "The prefix is what is used to trigger the commands. Prefixes are usually symbols, for example `$`, `?` or `.`\nA prefix of `.` would mean commands would be used like `.vote`",
			context: "Information about the prefix in setup"
		},
		"SETUP_PREFIX_INPUT": {
			string: "Any text with no spaces",
			context: "Information about prefix inputs in setup"
		},
		"SETUP_PREFIX_INCLUDES_SUGGEST": {
			string: "The prefix you specified includes `suggest`, which means commands will be run using `{{prefix}}suggest`. React with {{check}} if you would like to __keep__ this prefix, and react with {{x}} to specify a new prefix.",
			context: "Warning if the prefix includes the term suggest in setup",
			replaced: {
				check: {
					to_replace: "{{check}}",
					description: "The check emoji"
				},
				x: {
					to_replace: "{{x}}",
					description: "The X emoji"
				},
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server prefix"
				}
			}
		},
		"SETUP_COMPLETE_HEADER": {
			string: "Setup Complete!",
			context: "Header for the setup complete embed"
		},
		"SETUP_COMPLETE_DESC": {
			string: "Suggester should now work in your server, try it out with `{{prefix}}suggest`!",
			context: "Content for the setup complete embed",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The server prefix"
				}
			}
		},
		"SETUP_ADDITIONAL_CONFIG_HEADER": {
			string: "Additional Configuration",
			context: "Header for the Additional Configuration aspect of the setup complete embed"
		},
		"SETUP_ADDITIONAL_CONFIG_DESC": {
			string: "There are a few other configuration options such as reaction emojis, user notifications, and more! See https://suggester.js.org/#/admin/config for more information.",
			context: "Description for the Additional Configuration aspect of the setup complete embed"
		},
		"EVERYONE_PERMISSION_WARNING": {
			string: "Adding the everyone role to the configuration will give __all members of your server__ enhanced permissions on the bot. React with {{check}} if you would like to add the everyone role, and {{x}} if you would like to cancel.",
			context: "Warning about giving the everyone role staff/admin permissions",
			replaced: {
				check: {
					to_replace: "{{check}}",
					description: "The check emoji"
				},
				x: {
					to_replace: "{{x}}",
					description: "The X emoji"
				}
			}
		},
		"PING_COUNT_CONTENT": {
			string: "{{guilds}} servers across {{shards}} shards",
			context: "Shows total number of guilds and shards in the ping command",
			replaced: {
				guilds: {
					to_replace: "{{guilds}}",
					description: "Total server count of the bot"
				},
				shards: {
					to_replace: "{{shards}}",
					description: "Total shard count of the bot"
				}
			}
		},
		"PING_SHARD_STATS_HEADER": {
			string: "Shard Statistics",
			context: "Header for the shard statistics section of the ping embed"
		},
		"BLACKLIST_NO_ARGS_ERROR": {
			string: "You must specify a user or `list` to show a list of blacklisted users.",
			context: "Error shown when no parameters are speciied for the blacklist command"
		},
		"BLACKLIST_EMPTY": {
			string: "There are no users blacklisted from using the bot on this server.",
			context: "Shown when no users are blacklisted on a server"
		},
		"BLACKLIST_SELF_ERROR": {
			string: "You cannot blacklist yourself.",
			context: "Error shown when a user attempts to blacklist themselves"
		},
		"BLACKLIST_USER_BOT_ERROR": {
			string: "This user is a bot, and therefore cannot be blacklisted.",
			context: "Error shown when a user attempts to blacklist a bot"
		},
		"BLACKLIST_REASON_TOO_LONG_ERROR": {
			string: "Blacklist reasons are limited to a length of 1024 characters.",
			context: "Error shown when a blacklist reason is too long"
		},
		"BLACKLIST_GLOBAL_STAFF_ERROR": {
			string: "Global Suggester staff members cannot be blacklisted.",
			context: "Error shown when a user attempts to blacklist a global staff member"
		},
		"BLACKLIST_STAFF_ERROR": {
			string: "Staff members cannot be blacklisted.",
			context: "Error shown when a user attempts to blacklist a server staff member"
		},
		"ALREADY_BLACKLISTED_ERROR": {
			string: "This user is already blacklisted from using the bot on this server!",
			context: "Error shown when a user attempts to blacklist a user who has already been blacklisted"
		},
		"BLACKLIST_REASON_HEADER": {
			string: "Reason:",
			context: "Shown if a reason is specified for the blacklist command"
		},
		"BLACKLIST_SUCCESS": {
			string: "**{{user}}** (`{{id}}`) has been blacklisted from using the bot on this server.",
			context: "Success message when a user is blacklisted in a guild",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The user tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The user ID"
				}
			}
		},
		"BLACKLIST_LOG_TITLE": {
			string: "{{staff}} blacklisted {{user}}",
			context: "Title of the log embed when a user is blacklisted",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The blacklisted user's tag"
				},
				staff: {
					to_replace: "{{staff}}",
					description: "The staff member's tag"
				}
			}
		},
		"BLACKLIST_USER_DATA": {
			string: "Tag: {{tag}}\nID: {{id}}\nMention: {{mention}}",
			context: "Shows data about the user in the blacklist embed",
			replaced: {
				tag: {
					to_replace: "{{tag}}",
					description: "The blacklisted user's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The blacklisted user's ID"
				},
				mention: {
					to_replace: "{{mention}}",
					description: "The blacklisted user's mention"
				}
			}
		},
		"STAFF_MEMBER_LOG_FOOTER": {
			string: "Staff Member ID: {{id}}",
			context: "Shows the staff member ID in the blacklist log embed",
			replaced: {
				id: {
					to_replace: "{{id}}",
					description: "The staff member's ID"
				}
			}
		},
		"NO_DENIED_CHANNEL_ERROR": {
			string: "I could not find your configured denied suggestions channel! Please reconfigure or remove your set denied suggestions channel.",
			context: "Error when the configured denied suggestions channel is not found"
		},
		"NO_ARCHIVE_CHANNEL_ERROR": {
			string: "I could not find your implemented suggestions archive channel! Please reconfigure or remove your set implemented suggestions archive channel.",
			context: "Error when the configured implemented suggestions channel is not found"
		},
		"DELETION_REASON_TOO_LONG_ERROR": {
			string: "Deletion reasons are limited to a length of 1024 characters.",
			context: "Error when the deletion reason is too long"
		},
		"DENIAL_REASON_TOO_LONG_ERROR": {
			string: "Denial reasons are limited to a length of 1024 characters.",
			context: "Error when the denial reason is too long"
		},
		"SUGGESTION_DELETED_TITLE": {
			string: "Suggestion Deleted",
			context: "Title for the suggestion deleted embed"
		},
		"DELETED_BY": {
			string: "Deleted by {{user}}",
			context: "Details who deleted a suggestion",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user tag"
				}
			}
		},
		"REASON_GIVEN": {
			string: "Reason Given",
			context: "Denotes the reason in the denied/deleted embed"
		},
		"DELETED_DM_TITLE": {
			string: "Your suggestion was deleted in **{{server}}**!",
			context: "Title for the DM notification of a suggestion being deleted",
			replaced: {
				server: {
					to_replace: "{{server}}",
					description: "The name of the server the command was run in"
				}
			}
		},
		"DELETED_LOG": {
			string: "{{user}} deleted #{{id}}",
			context: "Title for the log embed when a suggestion is deleted",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"VOTE_TOTAL_HEADER": {
			string: "Vote Counts",
			context: "Header used above vote counts"
		},
		"VOTE_COUNT_OPINION": {
			string: "Opinion:",
			context: "Denotes the vote opinion (upvotes-downvotes) for the suggestion"
		},
		"VOTE_COUNT_UP": {
			string: "Upvotes:",
			context: "Denotes the number of upvotes for the suggestion"
		},
		"VOTE_COUNT_DOWN": {
			string: "Downvotes:",
			context: "Denotes number of downvotes for the suggestion"
		},
		"UNKNOWN": {
			string: "Unknown",
			context: "Shown if something is unknown"
		},
		"NO_COMMENT_ID_SPECIFIED_ERROR": {
			string: "Please provide a valid comment ID.",
			context: "Error shown when the user does not specify or specifies an invalid comment ID"
		},
		"COMMENT_ALREADY_DELETED_ERROR": {
			string: "This comment has already been deleted!",
			context: "Error shown when a user attempts to delete a previously deleted comment"
		},
		"DELETED_COMMENT_LOG": {
			string: "{{user}} deleted comment {{comment}} from #{{id}}",
			context: "Title for the log embed when a comment is deleted",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				},
				comment: {
					to_replace: "{{comment}}",
					description: "The comment ID"
				}
			}
		},
		"COMMENT_DELETED_TITLE": {
			string: "Comment Deleted",
			context: "Title when a comment is deleted"
		},
		"SUGGESTION_DENIED_TITLE": {
			string: "Suggestion Denied",
			context: "Title for the suggestion denied embed"
		},
		"DENIED_BY": {
			string: "Denied by {{user}}",
			context: "Details who denied a suggestion",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "A user tag"
				}
			}
		},
		"DENIED_DM_TITLE": {
			string: "Your suggestion was denied in **{{server}}**!",
			context: "Title for the DM notification of a suggestion being denied",
			replaced: {
				server: {
					to_replace: "{{server}}",
					description: "The name of the server the command was run in"
				}
			}
		},
		"DENIED_LOG": {
			string: "{{user}} denied #{{id}}",
			context: "Title for the log embed when a suggestion is denied",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"INFO_AUTHOR_HEADER": {
			string: "Author",
			context: "Denotes the suggestion author in the info command"
		},
		"INFO_COMMENT_COUNT_HEADER": {
			string: "Comment Count",
			context: "Denotes the comment count in the info command"
		},
		"INFO_INTERNAL_STATUS_HEADER": {
			string: "Internal Status",
			context: "Denotes the internal status in the info command"
		},
		"INFO_PUBLIC_STATUS_HEADER": {
			string: "Public Status",
			context: "Denotes the public status in the info command"
		},
		"AWAITING_REVIEW_STATUS": {
			string: "Awaiting Staff Review",
			context: "Denotes a suggestion await staff review"
		},
		"QUEUE_POST_LINK": {
			string: "Queue Post",
			context: "Hyperlink for the queue post of a suggestion awaiting review"
		},
		"STATUS_IMPLEMENTED": {
			string: "Implemented",
			context: "Denotes a suggestion having the implemented status"
		},
		"STATUS_PROGRESS": {
			string: "In Progress",
			context: "Denotes a suggestion having the in progress status"
		},
		"STATUS_NO": {
			string: "Not Happening",
			context: "Denotes a suggestion having the not happening status"
		},
		"STATUS_DEFAULT": {
			string: "Default",
			context: "Denotes a suggestion having the default status"
		},
		"INFO_IMPLEMENTED": {
			string: "This suggestion was transferred to the implemented suggestion archive channel.",
			context: "Note on the info command when a suggestion has been transferred to the implemented archive channel"
		},
		"NONE_AWAITING_REVIEW": {
			string: "There are no suggestions awaiting review!",
			context: "Shown when the queue is empty in the listqueue command"
		},
		"PENDING_REVIEW_HEADER": {
			string: "Suggestions Pending Review",
			context: "Header for the listqueue embed"
		},
		"STATUS_ALREADY_SET_ERROR": {
			string: "This suggestion already has a status of **{{status}}**",
			context: "Error shown when the suggestion already has the status a user is trying to mark",
			replaced: {
				status: {
					to_replace: "{{status}}",
					description: "A status string"
				}
			}
		},
		"STATUS_EDITED_TITLE": {
			string: "Status Edited",
			context: "Header for the Status Edited embed"
		},
		"IMPLEMENTED_LINK": {
			string: "Implemented Archive Post",
			context: "Hyperlink to the implemented archive channel post when a suggestion is archived"
		},
		"STATUS_MARK_DM_TITLE": {
			string: "The status of your suggestion in **{{server}}** was edited!",
			context: "Title for the DM notification of a status being marked on a suggestion",
			replaced: {
				server: {
					to_replace: "{{server}}",
					description: "The name of the server the command was run in"
				}
			}
		},
		"STATUS_MARK_LOG": {
			string: "{{user}} set a status for #{{id}}",
			context: "Title for the log embed when a status is marked",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"NONE_SPECIFIED_MASS_ERROR": {
			string: "You must specify at least one suggestion.",
			context: "Error shown when no suggestions are specified for a mass command"
		},
		"NAN_MASS_APPROVE_ERROR": {
			string: "One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers. If you're trying to specify a comment, add `-r` between the suggestion IDs and the comment.",
			context: "Error shown when a suggestion ID specified in a mass approve command is not a number"
		},
		"NAN_MASS_DENY_ERROR": {
			string: "One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers. If you're trying to specify a reason, add `-r` between the suggestion IDs and the reason.",
			context: "Error shown when a suggestion ID specified in a mass deny/delete command is not a number"
		},
		"MASS_APPROVE_SUCCESS_TITLE": {
			string: "Approved {{some}}/{{total}} suggestions",
			context: "Title of the massapprove embed which shows the results of the command",
			replaced: {
				some: {
					to_replace: "{{some}}",
					description: "The number of suggestions that were approved"
				},
				total: {
					to_replace: "{{total}}",
					description: "The number of suggestions that were inputted"
				}
			}
		},
		"MASS_APPROVE_APPROVE_RESULTS_DETAILED": {
			string: "**Approved:** {{list}}",
			context: "Details which suggestions could be approved in the massapprove command",
			replaced: {
				list: {
					to_replace: "{{list}}",
					description: "The list of suggestions"
				}
			}
		},
		"MASS_APPROVE_FAIL_RESULTS_DETAILED": {
			string: "**Could Not Approve:** {{list}}",
			context: "Details which suggestions could not be approved in the massapprove command",
			replaced: {
				list: {
					to_replace: "{{list}}",
					description: "The list of suggestions"
				}
			}
		},
		"MASS_APPROVE_ERROR_DETAILS": {
			string: "One or more of these suggestions could not be approved. Please make sure the suggestion IDs you have provided exist and have not already been approved.",
			context: "Shows why suggestions generally are not approved in the massapprove command"
		},
		"MASS_DELETE_SUCCESS_TITLE": {
			string: "Deleted {{some}}/{{total}} suggestions",
			context: "Title of the massdelete embed which shows the results of the command",
			replaced: {
				some: {
					to_replace: "{{some}}",
					description: "The number of suggestions that were deleted"
				},
				total: {
					to_replace: "{{total}}",
					description: "The number of suggestions that were inputted"
				}
			}
		},
		"MASS_DELETE_SUCCESS_RESULTS_DETAILED": {
			string: "**Deleted:** {{list}}",
			context: "Details which suggestions could be deleted in the massdelete command",
			replaced: {
				list: {
					to_replace: "{{list}}",
					description: "The list of suggestions"
				}
			}
		},
		"MASS_DELETE_FAIL_RESULTS_DETAILED": {
			string: "**Could Not Delete:** {{list}}",
			context: "Details which suggestions could not be deleted in the massdelete command",
			replaced: {
				list: {
					to_replace: "{{list}}",
					description: "The list of suggestions"
				}
			}
		},
		"MASS_DELETE_ERROR_DETAILS": {
			string: "One or more of these suggestions could not be deleted. Please make sure the suggestion IDs you have provided exist and have not already been deleted/denied.",
			context: "Shows why suggestions generally are not deleted in the massdelete command"
		},
		"MASS_DENY_SUCCESS_TITLE": {
			string: "Denied {{some}}/{{total}} suggestions",
			context: "Title of the massdeny embed which shows the results of the command",
			replaced: {
				some: {
					to_replace: "{{some}}",
					description: "The number of suggestions that were denied"
				},
				total: {
					to_replace: "{{total}}",
					description: "The number of suggestions that were inputted"
				}
			}
		},
		"MASS_DENY_SUCCESS_RESULTS_DETAILED": {
			string: "**Denied:** {{list}}",
			context: "Details which suggestions could be denied in the massdeny command",
			replaced: {
				list: {
					to_replace: "{{list}}",
					description: "The list of suggestions"
				}
			}
		},
		"MASS_DENY_FAIL_RESULTS_DETAILED": {
			string: "**Could Not Deny:** {{list}}",
			context: "Details which suggestions could not be denied in the massdeny command",
			replaced: {
				list: {
					to_replace: "{{list}}",
					description: "The list of suggestions"
				}
			}
		},
		"MASS_DENY_ERROR_DETAILS": {
			string: "One or more of these suggestions could not be denied. Please make sure the suggestion IDs you have provided exist and have not already been approved/denied.",
			context: "Shows why suggestions generally are not denied in the massdeny command"
		},
		"NO_ATTACHMENT_REMOVE_ERROR": {
			string: "This suggestion does not have an attachment.",
			context: "Error shown when a user attempts to remove an attachment from a suggestion that has no attachment"
		},
		"ATTACHMENT_REMOVED_TITLE": {
			string: "Attachment Removed",
			context: "Title for the Attachment Removed embed"
		},
		"ATTACH_REMOVE_LOG": {
			string: "{{user}} removed the attachment from #{{id}}",
			context: "Title for the log embed when an attachment is removed from a suggestion",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The staff member's tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The suggestion ID"
				}
			}
		},
		"USER_NOT_BLACKLISTED_ERROR": {
			string: "This user is not blacklisted from using the bot on this server.",
			context: "Error shown when a user attempts to unblacklist a user who is not blacklisted on a server"
		},
		"UNBLACKLIST_SUCCESS": {
			string: "**{{user}}** (`{{id}}`) has been unblacklisted from using the bot on this server.",
			context: "Success message when a user is unblacklisted in a guild",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The user tag"
				},
				id: {
					to_replace: "{{id}}",
					description: "The user ID"
				}
			}
		},
		"UNBLACKLIST_LOG_TITLE": {
			string: "{{staff}} unblacklisted {{user}}",
			context: "Title of the log embed when a user is unblacklisted",
			replaced: {
				user: {
					to_replace: "{{user}}",
					description: "The unblacklisted user's tag"
				},
				staff: {
					to_replace: "{{staff}}",
					description: "The staff member's tag"
				}
			}
		},
		"COOLDOWN_SPAM_FLAG": {
			string: "{{mention}} ⚠️ You have been flagged by the command spam protection filter. This is generally caused when you use a lot of commands too quickly over a period of time. Due to this, you cannot use commands temporarily until a Suggester staff member reviews your situation. If you believe this is an error, please join {{support}} and contact our Support Team.",
			context: "Message shown when a user triggers the command cooldown spam filter",
			replaced: {
				mention: {
					to_replace: "{{mention}}",
					description: "The user mention"
				},
				support: {
					to_replace: "{{support}}",
					description: "The link to the support server"
				}
			}
		},
		"COMMAND_COOLDOWN": {
			string: "🕑 This command is on cooldown for {{time}} more second(s).",
			context: "Shown when a command is on cooldown and a user attempts to use it",
			replaced: {
				time: {
					to_replace: "{{time}}",
					description: "The number of seconds left for the cooldown"
				}
			}
		},
		"TUTORIAL_HEADER": {
			string: "Thanks for adding Suggester!",
			context: "Header for the tutorial embed"
		},
		"TUTORIAL_DESC": {
			string: "Suggester will help you easily and efficiently manage your server's suggestions, letting you get feedback from your community while also keeping out spam/unwanted suggestions! Staff members can also perform a number of actions on suggestions including (but not limited to) adding comments and marking statuses! The bot's prefix is `{{prefix}}` by default, but can be changed at any time using the `config` command.",
			context: "Description for the tutorial embed",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The bot prefix"
				}
			}
		},
		"TUTORIAL_GET_STARTED_HEADER": {
			string: "Let's Get Started!",
			context: "Header for the Let's Get Started section of the tutorial embed"
		},
		"TUTORIAL_GET_STARTED_DESCRIPTION": {
			string: "Before users can submit suggestions, someone with the **Manage Server** permission needs to do a bit of configuration. An easy way to do this is to run `{{prefix}}setup`, which will start a walkthrough for setting up the most essential elements of the bot.",
			context: "Description for the Let's Get Started section of the tutorial embed",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The bot prefix"
				}
			}
		},
		"TUTORIAL_NEXT_HEADER": {
			string: "What's Next?",
			context: "Header for the What's Next? section of the tutorial embed"
		},
		"TUTORIAL_NEXT_DESCRIPTION": {
			string: "After you run `{{prefix}}setup`, users can submit suggestions and the bot will work. If you are looking for more advanced configuration options like custom suggestion feed reactions and auto-cleaning of suggestion commands, take a look at https://suggester.js.org/#/admin/config.\n\nIf you're having an issue, or just want to find out more about the bot, head over to the __Suggester support server__: {{invite}}\nThis embed can be shown at any time using the `{{prefix}}tutorial` command.",
			context: "Description for the What's Next? section of the tutorial embed",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The bot prefix"
				},
				invite: {
					to_replace: "{{invite}}",
					description: "The invite to the Suggester support server"
				}
			}
		},
		"PERMISSIONS_MISSING_HEADER": {
			string: "This command cannot be run because some permissions are missing. {{name}} needs the following permissions in the {{channel}} channel:",
			context: "Header for the embed shown when the bot is missing permissions necessary for a command",
			replaced: {
				name: {
					to_replace: "{{name}}",
					description: "The username of the bot"
				},
				channel: {
					to_replace: "{{channel}}",
					description: "The channel where permissions are missing"
				}
			}
		},
		"MISSING_ELEMENTS_HEADER": {
			string: "Missing Elements",
			context: "Denotes what elements are missing when some permissions/config elements are"
		},
		"HOW_TO_FIX_HEADER": {
			string: "How to Fix",
			context: "Shows how to fix missing configuration elements/permissions"
		},
		"FIX_MISSING_PERMISSIONS_INFO": {
			string: "In the channel settings for {{channel}}, make sure that **{{name}}** has the above permissions allowed.",
			context: "Shows how to fix permission issues",
			replaced: {
				name: {
					to_replace: "{{name}}",
					description: "The username of the bot"
				},
				channel: {
					to_replace: "{{channel}}",
					description: "The channel where permissions are missing"
				}
			}
		},
		"MISSING_CONFIG_HEADER": {
			string: "This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the `{{prefix}}config` command.",
			context: "Shown when configuration elements are missing",
			replaced: {
				prefix: {
					to_replace: "{{prefix}}",
					description: "The bot prefix"
				}
			}
		},
		"PERMISSION:CREATE_INSTANT_INVITE": {
			string: "Create Instant Invite",
			context: "String representing the Create Instant Invite permission"
		},
		"PERMISSION:KICK_MEMBERS": {
			string: "Kick Members",
			context: "String representing the Kick Members permission"
		},
		"PERMISSION:BAN_MEMBERS": {
			string: "Ban Members",
			context: "String representing the Ban Members permission"
		},
		"PERMISSION:ADMINISTRATOR": {
			string: "Administrator",
			context: "String representing the Administrator permission"
		},
		"PERMISSION:MANAGE_CHANNELS": {
			string: "Manage Channels",
			context: "String representing the Manage Channels permission"
		},
		"PERMISSION:MANAGE_GUILD": {
			string: "Manage Server",
			context: "String representing the Manage Server permission"
		},
		"PERMISSION:ADD_REACTIONS": {
			string: "Add Reactions",
			context: "String representing the Add Reactions permission"
		},
		"PERMISSION:VIEW_AUDIT_LOG": {
			string: "View Audit Log",
			context: "String representing the View Audit Log permission"
		},
		"PERMISSION:VIEW_CHANNEL": {
			string: "View Channel",
			context: "String representing the View Channel permission"
		},
		"PERMISSION:SEND_MESSAGES": {
			string: "Send Messages",
			context: "String representing the Send Messages permission"
		},
		"PERMISSION:SEND_TTS_MESSAGES": {
			string: "Send TTS Messages",
			context: "String representing the Send TTS Messages permission"
		},
		"PERMISSION:MANAGE_MESSAGES": {
			string: "Manage Messages",
			context: "String representing the Manage Messages permission"
		},
		"PERMISSION:EMBED_LINKS": {
			string: "Embed Links",
			context: "String representing the Embed Links permission"
		},
		"PERMISSION:ATTACH_FILES": {
			string: "Attach Files",
			context: "String representing the Attach Files permission"
		},
		"PERMISSION:READ_MESSAGE_HISTORY": {
			string: "Read Message History",
			context: "String representing the Read Message History permission"
		},
		"PERMISSION:MENTION_EVERYONE": {
			string: "Mention Everyone",
			context: "String representing the Mention Everyone permission"
		},
		"PERMISSION:USE_EXTERNAL_EMOJIS": {
			string: "Use External Emojis",
			context: "String representing the Use External Emojis permission"
		},
		"PERMISSION:CONNECT": {
			string: "Connect",
			context: "String representing the Connect permission"
		},
		"PERMISSION:SPEAK": {
			string: "Speak",
			context: "String representing the Speak permission"
		},
		"PERMISSION:MUTE_MEMBERS": {
			string: "Mute Members",
			context: "String representing the Mute Members permission"
		},
		"PERMISSION:DEAFEN_MEMBERS": {
			string: "Deafen Members",
			context: "String representing the Deafen Members permission"
		},
		"PERMISSION:MOVE_MEMBERS": {
			string: "Move Members",
			context: "String representing the Move Members permission"
		},
		"PERMISSION:USE_VAD": {
			string: "Use Voice Activity",
			context: "String representing the Use Voice Activity permission"
		},
		"PERMISSION:PRIORITY_SPEAKER": {
			string: "Priority Speaker",
			context: "String representing the Priority Speaker permission"
		},
		"PERMISSION:CHANGE_NICKNAME": {
			string: "Change Nickname",
			context: "String representing the Change Nickname permission"
		},
		"PERMISSION:MANAGE_NICKNAMES": {
			string: "Manage Nicknames",
			context: "String representing the Manage Nicknames permission"
		},
		"PERMISSION:MANAGE_ROLES": {
			string: "Manage Roles",
			context: "String representing the Manage Roles permission"
		},
		"PERMISSION:MANAGE_WEBHOOKS": {
			string: "Manage Webhooks",
			context: "String representing the Manage Webhooks permission"
		},
		"PERMISSION:MANAGE_EMOJIS": {
			string: "Manage Emojis",
			context: "String representing the Manage Emojis permission"
		},
		"PERMISSION:STREAM": {
			string: "Stream",
			context: "String representing the Stream permission"
		},
		"PERMISSION:VIEW_GUILD_INSIGHTS": {
			string: "View Guild Insights",
			context: "String representing the View Guild Insights permission"
		},
		"NO_USERS_PERMISSION": {
			string: "No Users",
			context: "Permission shown in the help command if no users can use the command"
		},
		"BOT_ADMIN_PERMISSION": {
			string: "Bot Administrator",
			context: "Permission shown in the help command if only bot admins can use the command"
		},
		"GLOBAL_STAFF_PERMISSION": {
			string: "Global Staff+",
			context: "Permission shown in the help command if global staff+ can use the command"
		},
		"SERVER_ADMIN_PERMISSION": {
			string: "Server Administrator (Manage Server or Admin Role)+",
			context: "Permission shown in the help command if server admins+ can use the command"
		},
		"SERVER_STAFF_PERMISSION": {
			string: "Server Staff (Staff Role)+",
			context: "Permission shown in the help command if server staff+ can use the command"
		},
		"ALL_USERS_PERMISSION": {
			string: "All Users",
			context: "Permission shown in the help command if all users can use the command"
		},
		"CFG_ALREADY_BLOCKED_ROLE_ERROR": {
			string: "This role has already been blocked from using the bot on this server.",
			context: "Error when a role has already been added as a blocked role"
		},
		"CFG_BLOCKED_ROLE_ADD_SUCCESS": {
			string: "Members with the **{{role}}** role can no longer use the bot on this server.",
			context: "Success message when a role is added to the server blocked role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		},
		"CFG_NOT_BLOCKED_ROLE_ERROR": {
			string: "This role is not currently a blocked role.",
			context: "Error when a role has not already been added as a blocked role"
		},
		"CFG_BLOCK_ROLE_REMOVE_SUCCESS": {
			string: "Members with the **{{role}}** role are no longer blocked from using the bot on this server.",
			context: "Success message when a role is removed from the server blocked role list",
			replaced: {
				role: {
					to_replace: "{{role}}",
					description: "A role name"
				}
			}
		}
	}
};
