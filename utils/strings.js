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
			context: "Error that shows when the botconfig command is run without any status parameter"
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
		"EVAL_FLAGGED_DESTRUCTIVE": {
			string: "This command has been flagged as possibly destructive. Please recheck your command and confirm you would like to execute it.",
			context: "Confirmation sent when an eval is flagged as possibly destructive"
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
		"PAGINATION_NAV_INSTRUCTIONS": {
			string: "Use the arrow reactions to navigate pages, and the ⏹ reaction to close the changelog embed",
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
		"PING_CLIENT_PING_HEADER": {
			string: "Client Ping",
			context: "Client Ping header for the ping command"
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
			context: "Description of the log embed when a suggestion is submitted for review",
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
			context: "General help when the config command is used with no parameters"
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
		}
	}
};
