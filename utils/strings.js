const { emoji } = require("../config.json");
module.exports = {
	string: function (string_name, replaced, prefix_with) {
		const list = (require("./strings.js").list);
		const string = list[string_name];
		if (!string) return `String ${string_name} Not Found`;
		let newString = string.string;
		if (string.replaced) {
			Object.keys(string.replaced).forEach(r => {
				if (replaced[r]) newString = newString.replace(string.replaced[r].to_replace, replaced[r]);
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
			string: "Set {{user}}'s acknowledgement to **{{acknowledgement}}**.",
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
			context: "Shows when trying to modify the database with no modification parameters"
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
			description: "The result of a command"
		},
		"DEPLOY_NOT_PRODUCTION": {
			string: "I am not running in the production environment. You probably don't want to deploy now.",
			description: "Error produced when the bot is not running in the production environment and a deploy is attempted"
		},
		"PROCESSING": {
			string: "Processing... this may take a moment",
			description: "String used when the bot is processing an input"
		},
		"CANCELLED": {
			string: "Cancelled",
			description: "String used when an action is cancelled"
		},
		"EVAL_FLAGGED_DESTRUCTIVE": {
			string: "This command has been flagged as possibly destructive. Please recheck your command and confirm you would like to execute it.",
			description: "Confirmation sent when an eval is flagged as possibly destructive"
		},
		"INVALID_FLAG_TYPE_ERROR": {
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
		"FLAG_INVALID_ACTION_ERROR": {
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
		"INVALID_FLAG_TYPE_ERROR": {
			string: "You must specify either `user` or `guild`",
			context: "Error produced when the flag command is used with an invalid entry type"
		}
	}
};
