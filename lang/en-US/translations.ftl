# TODO: should we plug custom instances here?
# "Consider creating a custom instance for your server @ website"
err_bot-unusable = {-emojis_error} This bot cannot be used in this server.

err_bot-not-public = {-emojis_error} This bot cannot be invited to other server

ping-original = {-emojis_ping-pong} Pong!
ping-edited = {-emojis_ping-pong} Pong! Message sent in `{$ms}ms`

## ----- COMMAND NAMES -----

command-name--ping = ping
command-name--github = github
command-name--invite = invite
command-name--privacy = privacy
command-name--support = support
command-name--suggest = suggest
command-name--vote = vote

## ---------------- OLD TRANSLATIONS ----------------

# Shown in the acknowledgement command when no acknowledgement is set for a user
no-ack-set = No Acknowledgement Set

# Shows a user's acknowledgement
#   user - The tag of a user
#   acknowledgement - The acknowledgement set for a user
ack-filler-text = {$user}'s acknowledgement is: `{$acknowledgement}`

# Shows after user's name when the acknowledgement has been reset
#   user - The tag of a user
ack-reset-success = {$user}'s acknowledgement has been reset.

# Text showing that the acknowledgement has been set for a user
#   user - The tag of a user
#   acknowledgement - The acknowledgement set for a user
ack-set-success = Set `{$user}`'s acknowledgement to **{$acknowledgement}**.

# Error that shows when the botconfig or mark commands are run without any status parameter
no-status-error = You must specify a valid status!

# Error that shows when the mark command is run without any status parameter
#   x - The x emoji
#   list - The list of statuses
none-or-invalid-status-error =
  You provided none or an invalid status. Please choose a reaction below to select a status, or {$x} to cancel.

  >>> **Status List:**
  {$list}

# Error that shows when the avatar specified is invalid
invalid-avatar-error = Please provide a valid image URL! Images can have extensions of `jpeg`, `jpg`, `png`, or `gif`

# Shown in the db command when not enough parameters are specified
no-db-params-specified-error = You must specify whether to query or modify, a collection name, query field, and query value.

# Shown when the collection specified in the db command is not a valid database collection
#   collection - The name of a database collection
invalid-collection-error = Collection {$collection} is invalid.

# Shown when trying to modify the database with no modification parameters
no-modification-params-error = You must specify modification parameters!

# Title of the db command embed if the database was modified
db-embed-title-modified = Database Modified

# Title of the db command embed if the database was queried
db-embed-title-query = Database Query

# Description of the db command embed which shows the query information
#   collection - Collection name
#   query - Query object
db-embed-query-info =
  {"**"}Collection:** {$collection}
  {"**"}Query:** {$query}

# Information that shows if the database was modified
#   field - Field name
#   oldValue - Old value of field
#   newValue - New value of field
db-embed-modify-info =
  {"**"}Field:** {$field}
  {"**"}Old Value:** {$oldValue}
  {"**"}New Value:** {$newValue}

# Shows when no result is found in the database
db-no-result-found = No Result Found

# The result of a command
result-field-title = Result

# Error produced when the bot is not running in the production environment and a deploy is attempted
deploy-not-production = I am not running in the production environment. You probably don't want to deploy now.

# String used when the bot is processing an input
processing = Processing... this may take a moment

# String used when an action is cancelled
cancelled = Cancelled

# String used when an embed is closed
closed = Closed

# Error sent when the specified flag type is invalid
specify-user-or-guild-error = You must specify `user` or `guild`

# String used for listing user flags
#   user - The tag of a user
#   flags - List of user flags
user-flags-list = {$user}'s flags are: `{$flags}`

# String shown when no flags are set for a user
no-flags-set = No Flags Set

# Error shown when no flag is specified
no-flag-specified-error = You must specify a flag!

# Shown when a flag is already added to a user/guild
#   flag - The flag specified by the user
flag-already-present-error = Flag {$flag} is already present.

# Shown when a flag is not currently added to a user/guild
#   flag - The flag specified by the user
flag-not-present-error = Flag {$flag} is not present.

# Error shown when an invalid action is specified in the flag command
add-remove-invalid-action-error = You must specify `add` or `remove`.

# Message shown when a flag is added to a user
#   flag - The flag specified by the user
#   user - The tag of a user
flag-added-user-success = Flag `{$flag}` added to {$user}

# Message shown when a flag is removed from a user
#   flag - The flag specified by the user
#   user - The tag of a user
flag-removed-user-success = Flag `{$flag}` removed from {$user}

# String used when a specified guild ID is invalid
invalid-guild-id-error = Invalid guild ID

# String used for listing guild flags
#   guild - The ID of a guild
#   flags - List of user flags
guild-flags-list = Guild `{$guild}` has the following flags: `{$flags}`

# Message shown when a flag is added to a guild
#   flag - The flag specified by the user
#   guild - The ID of a guild
flag-added-guild-success = Flag `{$flag}` added to guild `{$guild}`

# Message shown when a flag is removed from a guild
#   flag - The flag specified by the user
#   guild - The ID of a guild
flag-removed-guild-success = Flag `{$flag}` removed from guild `{$guild}`

# String used when no/an invalid user is specified in a command
invalid-user-error = You must specify a valid user!

# String used when an invalid member is specified in a command
invalid-member-error = You must specify a valid member!

# Error produced when globalban is run with an invalid block setting
invalid-globalban-new-params-error = Invalid block setting. Use `true` to block and `false` to unblock.

# String used when a user/guild is globally blocked
#   banned - The user/guild identifier
is-globally-banned = {$banned} is globally blocked.

# String used when a user/guild is not globally blocked
#   banned - The user/guild identifier
is-not-globally-banned = {$banned} is not globally blocked.

# Error shown when a user is protected and someone attempts to globally block them
user-protected-new-error = This user is protected and cannot be blocked.

# Error shown when a guild is protected and someone attempts to globally block it
guild-protected-new-error = This guild is protected and cannot be blocked.

# Success message when a guild is allowlisted
#   guild - The ID of a guild
guild-allowlist-add-success = Added guild with ID `{$guild}` to the allowed list

# Success message when a guild is unallowlisted
#   guild - The ID of a guild
guild-allowlist-remove-success = Removed guild with ID `{$guild}` from the allowed list

# String used when a guild does not have a database entry for fetching data through global commands
no-guild-database-entry-error = This guild does not have a database entry!

# Used when a configuration element is not configured
none-configured = None Configured

# Filler for when there is none of something
none = None

# Appended to the end of the configuration value for voting roles if none are configured
cfg-voting-roles-append = (all users can vote on suggestions)

# Appended to the end of the role removed message when no more voting roles exist
cfg-voting-roles-append-now = (All users can now vote on suggestions)

# Appended to the end of the review channel configuration element when none is set and the mode is set to autoapprove
cfg-review-not-necessary-append = (Unnecessary because the mode is set to autoapprove)

# Appended to the end of the commands channel configuration value if none is specified
cfg-commands-channel-append = (Suggestions can be made in all channels)

# Shown when the upvote reaction config element is disabled
cfg-upvote-reaction-disabled = (Upvote Reaction Disabled)

# Shown when the shrug/no opinion reaction config element is disabled
cfg-mid-reaction-disabled = (Shrug/No Opinion Reaction Disabled)

# Shown when the downvote reaction config element is disabled
cfg-downvote-reaction-disabled = (Downvote Reaction Disabled)

# Used when something is enabled
enabled = Enabled

# Used when something is disabled
disabled = Disabled

# Shown when the mode is set to review
cfg-mode-review = All suggestions are held for review

# Shown when the mode is set to autoapprove
cfg-mode-autoapprove = All suggestions are automatically approved

# Used when an unknown error occurs.
error = An error occurred. Please try again.

# Title for the configuration list embed
#   server - A server name
server-configuration-title = Server Configuration for {$server}

# Title for the Role Configuration field of the configuration list
role-configuration-title = Role Configuration

# Title for the Channel Configuration field of the configuration list
channel-configuration-title = Channel Configuration

# Title for the Other Configuration field of the configuration list
other-configuration-title = Other Configuration

# Title for the Trello Configuration field of the configuration list
trello-configuration-title = Trello Configuration

# Title for the Config Status field of the configuration list
cfg-status-title = Config Status

# Shown when the bot is configured enough to work
cfg-status-good = Bot configured, commands will work

# Shown when the bot is not configured enough to work
cfg-status-bad = Not fully configured, bot will not work

# Title for the Bot Permissions field of the configuration list
cfg-permissions-title = Bot Permissions

# Title for the Server Flags field of the configuration list
cfg-flags-title = Server Flags

# Included in pagination embeds to give instructions on how to navigate pages
pagination-navigation-instructions = Use the arrow reactions to navigate pages, and the ⏹ reaction to close the embed

# Included in pagination embeds to show the number of pages and the current page
#   current - The current page number
#   total - The total number of pages
pagination-page-count = Page {$current}/{$total}

# Included in pagination embeds to give instructions on how to navigate pages
changelog-released-footer = Changelog released at

# The title of the changelog embed
#   version - The version number of the latest release
changelog-embed-header = Changelog: {$version}

# Author title for the help embed
#   name - The bot name
help-author = {$name} Help

# Title for the module in the help embed
#   module - The command module
help-module-title = Module: {$module}

# Information in help that helps with understanding the format
#   prefix - The server's prefix
help-understanding =
  Use `{$prefix}help [command]` to view more information about a specific command, including usage examples.
  Required arguments are surrounded by `[brackets]`, optional arguments are surrounded by `(parenthesis)`

# Shows prefix in the help command
#   prefix - The server's prefix
help-prefix-info = My prefix in this server is {$prefix}

# Usage field name in help command
help-usage = Usage

# Examples field name in help command
help-examples = Examples

# Documentation field name in help command
help-documentation = Documentation

# Additional Information field name in help command
help-additional-info = Additional Information

# Alias field name in help command
help-alias = Alias

# Aliases field name in help command
help-alias-plural = Aliases

# Documentation field name in help command
help-docs-new = Documentation

# Used when a command is disabled globally
command-disabled = This command is currently disabled globally.

# Error shown when a command is disabled for a server
command-disabled-server = This command has been disabled on this server

# The response to the invite command
#   name - The bot name
#   link - The bot invite link
invite-bot = You can invite {$name} to your server with this link: {$link}

# Used when the invite command is run on a private instance
#   link - The bot invite link
invite-restricted = This bot cannot be invited publicly. You can invite the public version with this link: {$link}

# Shown when a user has enabled notifications
notifications-enabled = Notifications are **enabled**. You will receive a DM when an action is taken on any of your suggestions.

# Shown when a user has disabled notifications
notifications-disabled = Notifications are **disabled**. You will not receive a DM when an action is taken on any of your suggestions.

# Shown when notifications are enabled and a user tries to enable them
notifications-already-enabled = DM Notifications are already enabled.

# Shown when notifications are disabled and a user tries to disable them
notifications-already-disabled = DM Notifications are already disabled.

# Shown when a user has enabled automatic following
autofollow-enabled = Automatic following is **enabled**. You will automatically follow suggestions when you upvote them.

# Shown when a user has disabled automatic following
autofollow-disabled = Automatic following is **disabled**. You will not automatically follow suggestions when you upvote them, and you will not receive notifications for any suggestions you've automatically followed in the past.

# Shown when automatic following is enabled and a user tries to enable it
autofollow-already-enabled = Automatic following is already enabled.

# Shown when automatic following is disabled and a user tries to disable them
autofollow-already-disabled = Automatic following is already disabled.

# Shown when a guild has enabled automatic following
guild-autofollow-enabled = Automatic following is **enabled**. Users will automatically follow suggestions when they upvote them, and will be notified when they are updated.

# Shown when a guild has disabled automatic following
guild-autofollow-disabled = Automatic following is **disabled**. Users will not automatically follow suggestions when they upvote them, and not will be notified when they are updated even if they have followed them previously.

# Shown when a user has enabled protips
protips-enabled = Protips are **enabled**.

# Shown when a user has disabled protips
protips-disabled = Protips are **disabled**.

# Shown when protips are enabled and a user tries to enable them
protips-already-enabled = Protips are already enabled.

# Shown when protips are disabled and a user tries to disable them
protips-already-disabled = Protips are already disabled.

# Used when a configuration element requires on, off, or toggle parameters
on-off-toggle-error = You must specify `on`, `off`, or `toggle`.

# Developers header for the ping command
ping-developers-header = Developers

# Guild Count header for the ping command (also used in stats)
ping-guild-count-header = Guild Count

# Uptime header for the ping command
ping-uptime-header = Uptime

# Shard Ping header for the ping command
ping-shard-ping-header = Shard Ping

# Bot latency (previously 'Edit Time') header for the ping command
ping-bot-latency-header = Bot Latency

# Memory Usage header for the ping command
ping-memory-header = Memory Usage

# Used when a server does not have a database entry
unconfigured-error = You must configure your server to use this command. Please use the `setup` command.

# Error when a user tries to suggest without an approved role
#   roleList - A list of roles that are allowed to submit suggestions
no-allowed-role-error =
  You do not have a role with permission to submit suggestions.
  The following roles can submit suggestions: {$roleList}

# Error when a user uses suggest in a non-command channel
#   channels - The mentions of the commands channels
submit-not-command-channel-error = Suggestions can only be submitted in the following channels: {$channels}

# Error when a user uses edit in a non-command channel
#   channels - The mentions of the commands channels
edit-not-command-channel-error = Suggestions can only be edited in the following channels: {$channels}

# Error when a user does not provide a suggestion in the suggest command
no-suggestion-error = Please provide a suggestion!

# Error when the user does not provide a suggestion content in the edit command
edit-no-content-error = Please provide new content for the suggestion!

# Error when a suggestion is too long
too-long-suggestion-error-new = Suggestions cannot be longer than 1900 characters.

# Error when the configured staff review channel is not found
no-review-channel-error = I could not find your suggestion review channel! Please make sure you have configured one.

# Error when the configured suggestions channel is not found
no-suggestion-channel-error = I could not find your approved suggestions channel! Please make sure you have configured one.

# Title for embeds showing who the suggesting user is
#   user - A user's tag
suggestion-from-title = Suggestion from {$user}

# Footer for suggestion embeds
#   id - A suggestion ID
suggestion-footer = Suggestion ID: {$id} | Submitted at

# Footer for suggestion embeds
#   id - A suggestion ID
#   editor - The user who edited the suggestion
suggestion-footer-with-edit = Suggestion ID: {$id} | Edited by {$editor} | Submitted at

# Success message when a suggestion is sent for staff review
suggestion-submitted-staff-review-success = Your suggestion has been submitted to the server staff for review!

# Title for the suggestion review embed
#   id - A suggestion ID
suggestion-review-embed-title = Suggestion Awaiting Review (#{$id})

# Title for the suggestion edit review embed
#   id - A suggestion ID
suggestion-review-edit-embed-title = Suggestion Edit Awaiting Review (#{$id})

# Used when a header using the user's tag and ID is present
#   user - A user tag
#   id - A user ID
user-info-header = {$user} (ID: {$id})

# Used when a header using the user's tag and ID is present (codeblock version)
#   user - A user tag
#   id - A user ID
user-info-header-cb = {$user} (ID: `{$id}`)

# Header for the approve/deny field of the review embed
approve-deny-header = Approve/Deny

# Information in the review embed showing instructions on how to approve/deny
#   prefix - The server's prefix
#   id - A suggestion ID
#   channel - The suggestions channel mention
review-command-info =
  Use **{$prefix}approve {$id}** to send to {$channel}
  Use **{$prefix}deny {$id}** to deny

# Information in the review embed showing instructions on how to approve/deny
#   approve - The approve reaction
#   deny - The deny reaction
#   channel - The suggestions channel mention
review-command-info-new =
  React with {$approve} to send to {$channel}
  React with {$deny} to deny

# Header used when a suggestion has an attachment
with-attachment-header = With Attachment

# Header used for the suggestion content
suggestion-header = Suggestion

# Header used for votes in the context "Votes: 3"
suggestion-votes = Votes:

# Title in the log embed when a suggestion is submitted for review
#   user - A user tag
log-suggestion-submitted-review-title = {$user} submitted a suggestion for review

# Title in the log embed when an anonymous suggestion is submitted for review
#   user - A user tag
log-suggestion-submitted-review-title-anon = {$user} submitted an anonymous suggestion for review

# Title in the log embed when a suggestion edit is submitted for review
#   user - A user tag
#   id - The suggestion ID
log-edit-submitted-review-title = {$user} submitted a suggestion edit for review on #{$id}

# Title in the log embed when a suggestion in review is edited
#   user - A user tag
#   id - The suggestion ID
log-edit-submitted-on-approved-title = {$user} edited #{$id} (which is currently awaiting review)

# Title in the log embed when a suggestion is edited
#   user - A user tag
#   id - The suggestion ID
log-edit-title = {$user} edited #{$id}

# Title in the log embed when a suggestion edit is approved
#   user - A user tag
#   id - The suggestion ID
log-edit-approve-title = {$user} approved a suggestion edit on #{$id}

# Title in the log embed when a suggestion is submitted in autoapprove mode
#   user - A user tag
log-suggestion-submitted-autoapprove-title = {$user} submitted a suggestion

# Title in the log embed when an anonymous suggestion is submitted in autoapprove mode
#   user - A user tag
log-suggestion-submitted-autoapprove-title-anon = {$user} submitted an anonymous suggestion

# Description of the log embed when a user is shown
#   id - A suggestion ID
#   user - A user ID
log-suggestion-submitted-footer = Suggestion ID: {$id} | User ID: {$user}

# Success message when a suggestion is submitted in the autoapprove mode
#   channel - Mention of the suggestion channel
suggestion-submitted-autoapprove-success = Your suggestion has been added to the {$channel} channel!

# Response to the support command
#   link - The link to the support server
support-invite = Need help with the bot? Join our support server at {$link} 😉

# Verify acknowledgement for Developer/Global Administrator
verify-ack-developer-ga = Developer/Global Administrator

# Verify acknowledgement for Suggester Staff Team
verify-ack-global-staff = Suggester Staff Team

# Verify acknowledgement for Translator
verify-ack-translator = Translator

# Verify acknowledgement for Exempt from Cooldowns
verify-ack-global-no-cooldown = Exempt From Cooldowns

# Verify acknowledgement for Protected
verify-ack-global-protected = Protected

# Verify acknowledgement for Blocked Globally
verify-ack-global-block = Blocked Globally

# Verify acknowledgement for Server Admin
verify-ack-server-admin = Server Admin

# Verify acknowledgement for Server Staff
verify-ack-server-staff = Server Staff

# Verify acknowledgement for Blocked on this server
verify-ack-server-block = Blocked on this server

# Verify acknowledgement for users who donate to Suggester
verify-ack-donator = Donator

# Header for the global acknowledgements section of the verify command
verify-title-global-acks = Global Acknowledgements

# Header for the server acknowledgements section of the verify command
verify-title-server-acks = Server Acknowledgements

# Header for the user flags section of the verify embed
verify-flags-title = User Flags

# Shown in the verify command when a user has no acknowledgements
verify-no-acks = This user has no acknowledgements

# The footer of the verify embed showing permission level
#   level - The permission level of the user
verify-permission-level-footer = Permission Level: {$level}

# Response to the vote command
#   link - Link to the support server
#   links - Links to vote for the bot (takes up multiple lines)
vote-info =
  You can vote for Suggester on various bot lists, which is a great way to support the bot! If you're in the Suggester support server ({$link}), you can get special rewards for voting 🤩
  >>> __Links to Vote:__
  {$links}

# Warning when automatic setup is initiated
#   check - The check emoji
#   x - The X emoji
autosetup-warning =
  ⚠️ Automatic Setup Warning ⚠️
  {"**"}This setup will overwrite any previous configuration and add channels to your server.**

  If you would like to continue with automatic setup, click the {$check} reaction. If you would like to abort automatic setup, click the {$x} reaction.

# Warning when setup is initiated
#   check - The check emoji
#   x - The X emoji
setup-warning =
  ⚠️ Warning ⚠️
  {"**"}This setup will overwrite any previous server configuration.**

  If you would like to continue with setup, click the {$check} reaction. If you would like to abort setup, click the {$x} reaction.

# Message when setup is cancelled
setup-cancelled = **Setup Cancelled**

# Audit log reason for automatic setup
automatic-setup = Automatic setup

# Audit log reason for log channel webhook creation
create-log-channel = Create suggestion log channel

# Audit log reason for log channel webhook deletion
remove-log-channel = Remove old log channel

# Message sent when automatic setup is complete
#   prefix - The server's prefix
automatic-setup-complete-new =
  Automatic setup complete!
  >>> Want to use more advanced configuration elements like custom reactions, a role given on approved suggestions, and more? Try the `{$prefix}config` command

# Title for the configuration help embed
cfg-help-title = Configuration Help

# Description for navigating the config help embed
#   p - The bot prefix
cfg-help-info = Use `{$p}config help [element name]` to view help for a specific element, or use the arrow reactions to navigate through the list!

# Command title for the config help embed
cfg-help-command = Command

# Command description for the config help embed
#   prefix - undefined
#   subcommand - undefined
cfg-help-command-info = You can use `{$prefix}config {$subcommand}` to view the current value or set a new one

# Title for the list of config elements in the config help embed
cfg-list-title = List of Configuration Elements

# Error when no role is specified for configuration
cfg-no-role-specified-error = You must specify a role name, @mention, or ID!

# Error when an invalid role is specified for configuration
cfg-invalid-role-error = I could not find a role based on your input! Make sure to specify a **role name**, **role @mention**, or **role ID**.

# Error when a role has already been added as an admin role
cfg-already-admin-role-error = This role has already been added as an admin role!

# Success message when a role is added to the server admin role list
#   role - A role name
cfg-admin-role-add-success = Added **{$role}** to the list of server admin roles.

# Error when a role has not already been added as an admin role
cfg-not-admin-role-error = This role is not currently an admin role.

# Success message when a role is removed from the server admin role list
#   role - A role name
cfg-admin-role-remove-success = Removed **{$role}** from the list of server admin roles.

# Error when a role has already been added as a staff role
cfg-already-staff-role-error = This role has already been added as a staff role!

# Success message when a role is added to the server staff role list
#   role - A role name
cfg-staff-role-add-success = Added **{$role}** to the list of server staff roles.

# Error when a role has not already been added as a staff role
cfg-not-staff-role-error = This role is not currently a staff role.

# Success message when a role is removed from the server staff role list
#   role - A role name
cfg-staff-role-remove-success = Removed **{$role}** from the list of server staff roles.

# Error when a role has already been added as an allowed suggesting role
cfg-already-allowed-role-error = This role has already been given permission to submit suggestions.

# Success message when a role is added to the allowed suggesting role list
#   role - A role name
cfg-allowed-role-add-success = Members with the **{$role}** role can now submit suggestions.

# Error when a role has not already been added as an allowed suggestion role
cfg-not-allowed-role-error = This role is not currently able to submit suggestions.

# Success message when a role is removed from the allowed suggesting role list
#   role - A role name
cfg-allowed-role-remove-success = Members with the **{$role}** can no longer submit suggestions.

# Error when a role has already been added as an voting role
cfg-already-voting-role-error = This role has already been given permission to vote on suggestions.

# Success message when a role is added to the voting role list
#   role - A role name
cfg-voting-role-add-success = Members with the **{$role}** role can now vote on suggestions.

# Error when a role has not already been added as a voting role
cfg-not-voting-role-error = This role is not currently able to vote on suggestions.

# Success message when a role is removed from the voting role list
#   role - A role name
cfg-voting-role-remove-success = Members with the **{$role}** can no longer vote on suggestions.

# Error when a user specifies an invalid action for role configuration
cfg-invalid-role-param-error = Please specify `add`, `remove`, or `list`.

# Success message when the approved suggestion role is reset
cfg-reset-approved-role-success = Successfully reset the approved suggestion role.

# Error when an approved suggestion role is configured but the bot does not have the Manage Roles permission
#   bot - The bot mention
cfg-no-manage-roles-error = Please give {$bot} the **Manage Roles** permission in order for the approved suggestion role to work.

# Error when the specified approved suggestion role is already set
cfg-already-approved-role-error = This role is already set to be given when a member's suggestion is approved!

# Error when the bot cannot give members an approved role
#   role - A role name
cfg-unmanageable-role-error = I am not able to give members this role. Please ensure my highest role is __above__ the **{$role}** role and that it is not a managed role.

# Success message when the approved suggestion role is configured
#   role - A role name
cfg-approved-role-success = Members who have their suggestion approved will now receive the **{$role}** role.

# Success message when the implemented suggestion role is reset
cfg-reset-implemented-role-success = Successfully reset the implemented suggestion role.

# Error when the specified implemented suggestion role is already set
cfg-already-implemented-role-error = This role is already set to be given when a member's suggestion is marked as implemented!

# Success message when the implemented suggestion role is configured
#   role - A role name
cfg-implemented-role-success = Members who have their suggestion marked as implemented will now receive the **{$role}** role.

# Error when no channel is specified for configuration
cfg-no-channel-specified-error = You must specify a channel #mention, channel ID, or channel name.

# Error when an invalid channel is specified for configuration
cfg-invalid-channel-error = I could not find a text channel on this server based on this input! Make sure to specify a **channel #mention**, **channel ID**, or **channel name**.

# Success message when the review channel is configured
#   channel - A channel mention
cfg-review-set-success = Successfully set {$channel} as the suggestion review channel.

# Success message when the suggestions channel is configured
#   channel - A channel mention
cfg-suggestions-set-success = Successfully set {$channel} as the approved suggestions channel.

# Success message when the denied channel is configured
#   channel - A channel mention
cfg-denied-set-success = Successfully set {$channel} as the denied suggestions channel.

# Success message when the denied channel is reset
cfg-denied-reset-success = Successfully reset the denied suggestions channel.

# Error shown when a webhook cannot be created in a log channel
cfg-webhook-creation-error = A webhook could not be created in the provided channel. Please make sure that you have less than 10 webhooks in the channel and try again.

# Success message when the log channel is configured
#   channel - A channel mention
cfg-log-set-success = Successfully set {$channel} as the log channel.

# Success message when the log channel is reset
cfg-log-reset-success = Successfully reset the log channel.

# Success message when the suggestion commands channel is configured
#   channel - A channel mention
cfg-commands-add-success = Successfully added {$channel} as a suggestion commands channel.

# Success message when a suggestion commands channel is removed
#   channel - A channel mention
cfg-commands-removed-success = Successfully removed {$channel} from the list of suggestion commands channels.

# Success message when a channel is disabled
#   channel - A channel mention
cfg-disabled-chnl-add-success = The bot will no longer respond in {$channel}.

# Success message when a disabled channel is removed
#   channel - A channel mention
cfg-disabled-chnl-removed-success = The bot will now respond in {$channel}.

# Success message when the implemented suggestions archive channel is configured
#   channel - A channel mention
cfg-archive-set-success = Successfully set {$channel} as the implemented suggestions archive channel.

# Success message when the implemented suggestions archive channel is reset
cfg-archive-reset-success = Successfully reset the implemented suggestions archive channel.

# Error shown when a specified prefix is too long
cfg-prefix-too-long-error = Your prefix must be 20 characters or less.

# Error shown when a specified prefix is disallowed
cfg-prefix-disallowed-error = This prefix is disallowed, please choose a different prefix.

# Success message when the prefix is configured
#   prefix - The server prefix
cfg-prefix-set-success = Successfully set this server's prefix to **{$prefix}**

# Success message when the mode is set to review
cfg-mode-review-set-success = Successfully set the mode for this server to **review**.

# Success message when the mode is set to autoapprove
cfg-mode-autoapprove-set-success = Successfully set the mode for this server to **autoapprove**.

# Error when a user tries to set the autoapprove mode while suggestions are still awaiting review
#   prefix - The server prefix
cfg-suggestions-awaiting-review-error-q = All suggestions awaiting review must be cleared before the autoapprove mode is set. Use the `{$prefix}queue` command to see all suggestions awaiting review.

# Error shown when the specified mode is invalid.
cfg-mode-invalid-error = Please specify a valid mode. (Either `review` or `autoapprove`)

# Upvote header when emojis are listed in the config command
cfg-emoji-upvote-title = Upvote

# Middle reaction header when emojis are listed in the config command
cfg-emoji-mid-title = Shrug/No Opinion

# Downvote header when emojis are listed in the config command
cfg-emoji-downvote-title = Downvote

# Error when no emoji is specified for configuration
cfg-no-emoji-error = You must specify an emoji.

# Error when the specified emoji is not found
cfg-emoji-not-found-error = The specified emoji was not found. Make sure to specify an emoji from __this server__ or a default Discord emoji.

# Error when the specified emoji is already set for a different emoji setting
cfg-emoji-already-set-error = This emoji has already been set for a different emoji setting.

# Error shown when an emoji is already disabled
cfg-emoji-disabled-error = This emoji is already disabled.

# Success message when the upvote reaction is disabled
cfg-emoji-up-disable-success = Successfully disabled the upvote reaction.

# Success message when the shrug/no opinion reaction is disabled
cfg-emoji-mid-disable-success = Successfully disabled the shrug/no opinion reaction.

# Success message when the downvote reaction is disabled
cfg-emoji-down-disable-success = Successfully disabled the downvote reaction.

# Success message when the upvote reaction is set
#   emote - An emoji
cfg-emoji-up-set-success = Successfully set the upvote emoji for this server to {$emote}.

# Success message when the shrug/no opinion reaction is set
#   emote - An emoji
cfg-emoji-mid-set-success = Successfully set the shrug/no opinion emoji for this server to {$emote}.

# Success message when the downvote reaction is set
#   emote - An emoji
cfg-emoji-down-set-success = Successfully set the downvote emoji for this server to {$emote}.

# Message when suggestion feed reactions are enabled
cfg-feed-reactions-enabled = Suggestion feed reactions are **enabled**.

# Message when suggestion feed reactions are disabled
cfg-feed-reactions-disabled = Suggestion feed reactions are **disabled**.

# Message when suggestion feed reactions are already enabled
cfg-feed-reactions-already-enabled = Suggestion feed reactions are already enabled.

# Message when suggestion feed reactions are already disabled
cfg-feed-reactions-already-disabled = Suggestion feed reactions are already disabled.

# Error when a user does not specify a valid emoji config setting
cfg-emoji-invalid-setting-error = You must specify a valid emoji setting. (`up`, `mid`, `down`, `on`, `off`, `toggle`)

# Shown when a guild has enabled notifications
guild-notifications-enabled = Notifications are **enabled**. Members will receive a DM when an action is taken on any of their suggestions.

# Shown when a guild has disabled notifications
guild-notifications-disabled = Notifications are **disabled**. Members will not receive a DM when an action is taken on any of their suggestions.

# Shown when notifications are enabled and a guild tries to enable them
guild-notifications-already-enabled = Server notifications are already enabled.

# Shown when notifications are disabled and a guild tries to disable them
guild-notifications-already-disabled = Server notifications are already disabled.

# Shown when a guild has enabled self voting
cfg-self-vote-enabled = Members can vote on their own suggestions.

# Shown when a guild has disabled self voting
cfg-self-vote-disabled = Members cannot vote on their own suggestions.

# Shown when self voting is enabled and a guild tries to enable it
cfg-self-vote-already-enabled = Members can already vote on their own suggestions.

# Shown when self voting is disabled and a guild tries to disable it
cfg-self-vote-already-disabled = Members are already disallowed from voting on their own suggestions.

# Shown when a guild has enabled only choosing one vote option
cfg-one-vote-enabled = Members can only choose one reaction option when voting on a suggestion

# Shown when a guild has disabled only choosing one vote option
cfg-one-vote-disabled = Members can choose multiple reaction options when voting on a suggestion

# Shown when choosing one vote reaction is enabled and a guild tries to enable it
cfg-one-vote-already-enabled = Members are already limited to choosing one reaction option when voting on a suggestion.

# Shown when choosing one vote reaction is disabled and a guild tries to disable it
cfg-one-vote-already-disabled = Members can already choose multiple reaction options when voting on a suggestion.

# Shown when a guild has enabled comment timestamps
cfg-comment-time-enabled = Comment timestamps will be shown on suggestion embeds

# Shown when a guild has disabled comment timestamps
cfg-comment-time-disabled = Comment timestamps will not be shown on suggestion embeds

# Shown when comment timestamps are enabled and a guild tries to enable it
cfg-comment-time-already-enabled = Comment timestamps are already shown on suggestion embeds

# Shown when comment timestamps are disabled and a guild tries to disable it
cfg-comment-time-already-disabled = Comment timestamps are already not shown on suggestion embeds

# Shown when a guild has enabled live vote counts
cfg-live-votes-enabled = Live vote counts will be shown on suggestion embeds

# Shown when a guild has disabled live vote counts
cfg-live-votes-disabled = Live vote counts will not be shown on suggestion embeds

# Shown when live vote counts are enabled and a guild tries to enable it
cfg-live-votes-already-enabled = Live vote counts are already shown on suggestion embeds

# Shown when live vote counts are disabled and a guild tries to disable it
cfg-live-votes-already-disabled = Live vote counts are already not shown on suggestion embeds

# Shown when a guild has enabled anonymous suggestions
#   invite - The bot invite link
cfg-anonymous-enabled =
  Anonymous suggestions can be submitted via `/asuggest`. The identity of the submitting user will be visible to staff but not in the public suggestions feed.
  > If the command does not appear, the bot may need re-invited to allow use of slash commands using this link: {$invite}

# Shown when a guild has disabled anonymous suggestions
cfg-anonymous-disabled = Anonymous suggestions cannot be submitted on this server

# Shown when anonymous suggestions are enabled and a guild tries to enable it
cfg-anonymous-already-enabled = Anonymous suggestions can already be submitted on this server

# Shown when anonymous suggestions are disabled and a guild tries to disable it
cfg-anonymous-already-disabled = Anonymous suggestions are already disabled on this server

# Shown when a guild has enabled in-channel suggestions
cfg-inchannel-enabled = Suggestions can be submitted via any message the suggestions feed channel

# Shown when a guild has disabled in-channel suggestions
cfg-inchannel-disabled = Suggestions cannot be submitted via any message in the suggestions feed channel

# Shown when in-channel suggestions are enabled and a guild tries to enable them
cfg-inchannel-already-enabled = Suggestions can already be submitted via any message the suggestions feed channel

# Shown when in-channel suggestions are disabled and a guild tries to disable them
cfg-inchannel-already-disabled-new = Suggestions already cannot be submitted via any message in the suggestions feed channel

# Shown when a guild has enabled cleaning of commands
cfg-clear-commands-enabled = Auto-cleaning of commands is **enabled**.

# Shown when a guild has cleaning of commands
cfg-clear-commands-disabled = Auto-cleaning of commands is **disabled**.

# Shown when cleaning of commands is enabled and a guild tries to enable them
cfg-clear-commands-already-enabled = Auto-cleaning of commands is already enabled.

# Shown when cleaning of commands is disabled and a guild tries to disable them
cfg-clear-commands-already-disabled = Auto-cleaning of commands is already disabled.

# Error shown when the bot does not have Manage Messages and cleaning of commands is enabled
cfg-clear-commands-no-manage-messages = Auto-cleaning of commands requires the bot have the **Manage Messages** permission in this server. Please give the bot this permission and try again.

# Error if no configuration element is specified
cfg-no-params-error = Invalid configuration element specified. Please run this command with no parameters to view configuration instructions.

# Error shown when the specified suggestion ID is invalid
invalid-suggestion-id-error = Please provide a valid suggestion ID.

# Error shown when a suggestion is not approved and an action like comment/mark is used
suggestion-not-approved-error = You can only perform this action on approved suggestions.

# Error shown when a suggestion has already been marked as implemented and an action like comment/mark is used
suggestion-implemented-error = This suggestion has been marked as implemented and moved to the implemented archive channel, so no further actions can be taken on it.

# Error shown when a suggestion has been denied and is attempted to be edited
suggestion-denied-edit-error = This suggestion has been denied, and therefore cannot be edited.

# Error shown when no comment is specified for the comment command
no-comment-error = You must provide a comment!

# Error shown when a suggestion has the maximum number of comments
too-many-comments-error-new = Due to Discord embed limitations, suggestions can only have up to 15 comments.

# Error shown when a specified comment is too long
comment-too-long-error = Comments cannot be longer than 1024 characters.

# Error shown when the suggestion feed embed cannot be edited
suggestion-feed-message-not-edited-error = There was an error editing the suggestion feed message. Please check that the suggestion feed message exists and try again.

# Error shown when the suggestion feed embed cannot be deleted
suggestion-feed-message-not-fetched-error = There was an error fetching the suggestion feed message. Please check that the suggestion feed message exists and try again.

# Shown when there is a suggestion with no content
no-suggestion-content = [No Suggestion Content]

# Hyperlink title to the suggestions feed post
suggestion-feed-link = Suggestions Feed Post

# Title for an anonymous comment
comment-title-anonymous = Staff Comment

# Title for a comment
#   user - A user tag
#   id - A comment ID
comment-title = Comment from {$user} (ID {$id})

# Header for the Anonymous Comment Added embed
anonymous-comment-added-title = Anonymous Comment Added

# Header for the Comment Added embed
comment-added-title = Comment Added

# Title for the DM notification of a comment being added to a suggestion
#   server - The name of the server the command was run in
comment-added-dm-title = A comment was added to your suggestion in **{$server}**!

# Title for the DM notification of a comment being added to a suggestion when a user is following the suggestion
#   server - The name of the server the command was run in
comment-added-dm-title-follow = A comment was added to a suggestion you follow in **{$server}**!

# Title for the log embed when an anonymous comment is added
#   user - The staff member's tag
#   id - The suggestion ID
anonymous-comment-added-log = {$user} added an anonymous comment to #{$id}

# Title for the log embed when a comment is added
#   user - The staff member's tag
#   id - The suggestion ID
comment-added-log = {$user} added a comment to #{$id}

# Header used throughout the bot showing the suggestion in question
suggestion = Suggestion

# Error shown when a command only usable in the review mode is used in the autoapprove mode
mode-autoapprove-disabled-error = This command is disabled when the mode is set to autoapprove.

# Error shown when a suggestion has already been approved and the approve command is used
#   prefix - The server prefix
#   id - The suggestion ID
suggestion-already-approved-approve-error = This suggestion has already been approved! Use `{$prefix}delete {$id}` to remove it.

# Error shown when a suggestion is already denied and a user attempts to approve it
suggestion-already-denied-approve-error = This suggestion has already been denied! Previously denied suggestions cannot be approved.

# Error shown when a suggestion is already denied and a user attempts to deny it
suggestion-already-denied-denied-error = This suggestion has already been denied!

# Title for the suggestion approved embed
suggestion-approved-title = Suggestion Approved

# Title for the suggestion edit approved embed
suggestion-edit-approved-title = Suggestion Edit Approved

# Title for the suggestion edit denied embed
suggestion-edit-denied-title = Suggestion Edit Denied

# Details who approved a suggestion
#   user - A user tag
approved-by = Approved by {$user}

# Title for the DM notification of a suggestion being approved
#   server - The name of the server the command was run in
approved-dm-title = Your suggestion was approved in **{$server}**!

# Title for the DM notification of a suggestion being approved on a suggestion followed
#   server - The name of the server the command was run in
approved-dm-title-follow = A suggestion you follow was approved in **{$server}**!

# Title for the log embed when a suggestion is approved
#   user - The staff member's tag
#   id - The suggestion ID
approved-log = {$user} approved #{$id}

# Shown when a suggestion is no longer in review
suggestion-change-review-embed = A change was processed on this suggestion

# Error produced when a suggestion already has an attachment and a user attempts to add an attachment
already-attachment-error = Due to Discord embed limitations, suggestions can only have 1 attachment.

# Error shown when a user does not provide an attachment for the attach command
no-attachment-error = Please provide an attachment!

# Title of the reply embed when an attachment is added
attachment-added-header = Attachment Added

# The error message to be sent if an image is larger than 8mb (webhook max filesize)
attachment-too-big = The attached file is too big. Please upload an image under 8 MB

# Title for the log embed when an attachment is added to a suggestion
#   user - The staff member's tag
#   id - The suggestion ID
attached-log = {$user} added an attachment to #{$id}

# Footer of setup embeds showing the amount of time a user has to respond
time-setup-warning = You have 2 minutes to respond

# Header showing valid inputs for the setup command
inputs = Inputs

# Error shown when setup times out
setup-timed-out-error = Setup has timed out. Please rerun the setup command if you would like to continue.

# Error shown when reaction selection times out in the mark command
mark-timeout-error = Reaction selection timed out. Please rerun this command if you would like to continue.

# Description for the server admin setting in setup
setup-admin-roles-desc = Any member with a server admin role can use all staff commands, as well as edit bot configuration. Anyone who has the `Manage Server` permission is automatically counted as an admin regardless of server configuration.

# Description for the server staff setting in setup
setup-staff-roles-desc-nd = Any member with a server staff role can use all staff commands to manage suggestions.

# Valid inputs for setup roles
setup-roles-input = You can send a **role name**, **role ID**, or **role @mention** in this channel.

# Valid inputs for setup channels
setup-channels-input = You can send a **channel #mention**, **channel ID**, or **channel name**.

# Title for the field showing how to finish specifying roles in setup
setup-roles-done-title = Done setting up roles?

# Information about how to move on to the next setting
setup-roles-done-desc =
  Type `done` to go to the next step
  If you're not done, just specify another role!

# Shown at the start of the setup prompt
setup-begin = Starting setup... Send `cancel` at any time to exit setup.

# Description for the mode setting in setup
setup-mode-desc = This is the mode for managing suggestions, either `review` or `autoapprove`

# Header for review information in setup
setup-review-text = Review

# Description of the review mode in setup
setup-review-desc = This mode holds all suggestions for staff review, needing to be manually approved before being posted to the suggestions channel.

# Header for autoapprove information in setup
setup-autoapprove-text = Autoapprove

# Description of the autoapprove mode in setup
setup-autoapprove-desc = This mode automatically sends all suggestions to the suggestions channel, with no manual review.

# Valid inputs for mode in the setup command
setup-mode-inputs = A valid mode (either `review` or `autoapprove`)

# Description of the suggestions channel for setup
setup-suggestions-channel-desc = This is the channel where all suggestions are sent once they are approved.

# Description of the review channel for setup
setup-review-channel-desc = This is the channel where all suggestions are sent once they are suggested and awaiting staff review.

# Description of the denied channel for setup
setup-denied-channel-desc = This is the channel where all denied or deleted suggestions are sent.

# Description of the log channel for setup
setup-log-channel-desc = This is the channel where all actions on suggestions are logged.

# Information in setup about skipping setting a channel
setup-skip-channel = This channel is optional, send `skip` to skip it.

# Information about the prefix in setup
setup-prefix-desc =
  The prefix is what is used to trigger the commands. Prefixes are usually symbols, for example `$`, `?` or `.`
  A prefix of `.` would mean commands would be used like `.vote`

# Information about prefix inputs in setup
setup-prefix-input = Any text with no spaces

# Warning if the prefix includes the term suggest in setup
#   check - The check emoji
#   x - The X emoji
#   prefix - The server prefix
setup-prefix-includes-suggest = The prefix you specified includes `suggest`, which means commands will be run using `{$prefix}suggest`. React with {$check} if you would like to __keep__ this prefix, and react with {$x} to specify a new prefix.

# Header for the setup complete embed
setup-complete-header = Setup Complete!

# Content for the setup complete embed
#   prefix - The server prefix
setup-complete-desc = Suggester should now work in your server, try it out with `{$prefix}suggest`!

# Header for the Additional Configuration aspect of the setup complete embed
setup-additional-config-header = Additional Configuration

# Description for the Additional Configuration aspect of the setup complete embed
#   prefix - The server prefix
setup-additional-config-desc-nd = There are a few other configuration options such as reaction emojis, user notifications, cleaning suggestion commands, and more! Use `{$prefix}config help` for more information.

# Warning about giving the everyone role staff/admin permissions
#   check - The check emoji
#   x - The X emoji
everyone-permission-warning = Adding the everyone role to the configuration will give __all members of your server__ enhanced permissions on the bot. React with {$check} if you would like to add the everyone role, and {$x} if you would like to cancel.

# Warning about giving the everyone role staff/admin permissions
#   check - The check emoji
#   x - The X emoji
disable-inchannel-warning = This channel is your suggestions channel, so disabling this channel will also disable the in channel suggestions feature. React with {$check} if you would like to disable this channel, and {$x} if you would like to cancel.

# Shows total number of guilds and shards in the ping command
#   guilds - Total server count of the bot
#   shards - Total shard count of the bot
ping-count-content = {$guilds} servers across {$shards} shards

# Shows total number of guilds on a shard
#   guilds - Total server count of the shard
ping-count-content-shard = {$guilds} servers on this shard

# The shard shown in the footer of the ping embed
#   shard - The shard the server is on
ping-shard-footer = Shard {$shard}

# Error shown when no parameters are speciied for the block command
block-no-args-error = You must specify a user or `list` to show a list of blocked users.

# Shown when no users are blocked on a server
blocklist-empty = There are no users blocked from using the bot on this server.

# Error shown when a user attempts to block themselves
block-self-error = You cannot block yourself.

# Error shown when a user attempts to block a bot
block-user-bot-error = This user is a bot, and therefore cannot be blocked.

# Error shown when a block reason is too long
block-reason-too-long-error = Block reasons are limited to a length of 1024 characters.

# Error shown when a bean reason is too long
bean-reason-too-long-error = Bean reasons are limited to a length of 1024 characters.

# Error shown when a user attempts to block a global staff member
block-global-staff-error = Global Suggester staff members cannot be blocked.

# Error shown when a user attempts to block a server staff member
block-staff-error = Staff members cannot be blocked.

# Error shown when a user attempts to block a user who has already been blocked
already-blocked-error = This user is already blocked from using the bot on this server!

# Shown if a reason is specified for the block command
block-reason-header = Reason:

# Shown if a duration is specified for the block command
block-duration-header = Duration:

# Success message when a user is blocked in a guild
#   user - The user tag
#   id - The user ID
block-success = **{$user}** (`{$id}`) has been blocked from using the bot on this server.

# Title of the log embed when a user is blocked
#   user - The blocked user's tag
#   staff - The staff member's tag
block-log-title = {$staff} blocked {$user}

# Shows data about the user in the blocked embed
#   tag - The blocked user's tag
#   id - The blocked user's ID
#   mention - The blocked user's mention
block-user-data =
  Tag: {$tag}
  ID: {$id}
  Mention: {$mention}

# Shows the staff member ID in the block log embed
#   id - The staff member's ID
staff-member-log-footer = Staff Member ID: {$id}

# Error when the configured denied suggestions channel is not found
no-denied-channel-error = I could not find your configured denied suggestions channel! Please reconfigure or remove your set denied suggestions channel.

# Error when the configured implemented suggestions channel is not found
no-archive-channel-error = I could not find your implemented suggestions archive channel! Please reconfigure or remove your set implemented suggestions archive channel.

# Error when the deletion reason is too long
deletion-reason-too-long-error = Deletion reasons are limited to a length of 1024 characters.

# Error when the denial reason is too long
denial-reason-too-long-error = Denial reasons are limited to a length of 1024 characters.

# Title for the suggestion deleted embed
suggestion-deleted-title = Suggestion Deleted

# Details who deleted a suggestion
#   user - A user tag
deleted-by = Deleted by {$user}

# Denotes the reason in the denied/deleted embed
reason-given = Reason Given

# Title for the DM notification of a suggestion being deleted
#   server - The name of the server the command was run in
deleted-dm-title = Your suggestion was deleted in **{$server}**!

# Title for the DM notification of a suggestion being deleted on a followed suggestion
#   server - The name of the server the command was run in
deleted-dm-title-follow = A suggestion you follow was deleted in **{$server}**!

# Title for the log embed when a suggestion is deleted
#   user - The staff member's tag
#   id - The suggestion ID
deleted-log = {$user} deleted #{$id}

# Denotes the vote opinion (upvotes-downvotes) for the suggestion
vote-count-opinion = Opinion:

# Denotes the number of upvotes for the suggestion
vote-count-up = Upvotes:

# Denotes number of downvotes for the suggestion
vote-count-down = Downvotes:

# Shown if something is unknown
unknown = Unknown

# Error shown when the user does not specify or specifies an invalid comment ID
no-comment-id-specified-error = Please provide a valid comment ID.

# Error shown when a user attempts to delete a previously deleted comment
comment-already-deleted-error = This comment has already been deleted!

# Error shown when a user attempts to edit a previously deleted comment
comment-already-deleted-error-edit = This comment has been deleted!

# Error shown when a user attempts to edit a comment they did not create (or is not anonymous)
comment-not-author-error = You are not the author of this comment, so you cannot edit it!

# Error when no new content is specified for editing a comment
comment-no-edit-content-error = You must specify new content for the comment!

# Title for the log embed when a comment is deleted
#   user - The staff member's tag
#   id - The suggestion ID
#   comment - The comment ID
deleted-comment-log = {$user} deleted comment {$comment} from #{$id}

# Title for the log embed when a comment is edited
#   user - The staff member's tag
#   id - The suggestion ID
#   comment - The comment ID
edited-comment-log = {$user} edited comment {$comment} on #{$id}

# Title when a comment is deleted
comment-deleted-title = Comment Deleted

# Title when a comment is edited
comment-edited-title = Comment Edited

# Title for the suggestion denied embed
suggestion-denied-title = Suggestion Denied

# Details who denied a suggestion
#   user - A user tag
denied-by = Denied by {$user}

# Title for the DM notification of a suggestion being denied
#   server - The name of the server the command was run in
denied-dm-title = Your suggestion was denied in **{$server}**!

# Title for the DM notification of a suggestion being denied on a followed suggestion
#   server - The name of the server the command was run in
denied-dm-title-follow = A suggestion you follow was denied in **{$server}**!

# Title for the log embed when a suggestion is denied
#   user - The staff member's tag
#   id - The suggestion ID
denied-log = {$user} denied #{$id}

# Denotes the suggestion author in the info command
info-author-header = Author

# Denotes the comment count in the info command
info-comment-count-header = Comment Count

# Denotes the internal status in the info command
info-internal-status-header = Internal Status

# Denotes the public status in the info command
info-public-status-header = Public Status

# Denotes a suggestion await staff review
awaiting-review-status = Awaiting Staff Review

# Hyperlink for the queue post of a suggestion awaiting review
queue-post-link = Queue Post

# Denotes a suggestion having the implemented status
status-implemented = Implemented

# Denotes a suggestion having the in progress status
status-progress = In Progress

# Denotes a suggestion having the in consideration status
status-consideration = In Consideration

# Denotes a suggestion having the not happening status
status-no = Not Happening

# Denotes a suggestion having the default status
status-default = Default

# Note on the info command when a suggestion has been transferred to the implemented archive channel
info-implemented = This suggestion was transferred to the implemented suggestion archive channel.

# Shown when the queue is empty in the listqueue command
none-awaiting-review = There are no suggestions awaiting review!

# Header for the listqueue embed
#   min - undefined
#   max - undefined
#   total - undefined
pending-review-header-num = Suggestions Pending Review (showing {$min}-{$max} of {$total})

# Error shown when the suggestion already has the status a user is trying to mark
#   status - A status string
status-already-set-error = This suggestion already has a status of **{$status}**

# Header for the Status Edited embed
status-edited-title = Status Edited

# Hyperlink to the implemented archive channel post when a suggestion is archived
implemented-link = Implemented Archive Post

# Title for the DM notification of a status being marked on a suggestion
#   server - The name of the server the command was run in
status-mark-dm-title = The status of your suggestion in **{$server}** was edited!

# Title for the DM notification of a status being marked on a suggestion on a followed suggestion
#   server - The name of the server the command was run in
status-mark-dm-title-follow = The status of a suggestion you follow in **{$server}** was edited!

# Title for the log embed when a status is marked
#   user - The staff member's tag
#   id - The suggestion ID
status-mark-log = {$user} set a status for #{$id}

# Error shown when no suggestions are specified for a mass command
none-specified-mass-error = You must specify at least one suggestion.

# Error shown when a suggestion ID specified in a mass approve command is not a number
nan-mass-approve-error = One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers. If you're trying to specify a comment, add `-r` between the suggestion IDs and the comment.

# Error shown when a suggestion ID specified in a mass deny/delete command is not a number
nan-mass-deny-error = One or more of the suggestion IDs you've entered is not a number. Please ensure all of your IDs are numbers. If you're trying to specify a reason, add `-r` between the suggestion IDs and the reason.

# Title of the massapprove embed which shows the results of the command
#   some - The number of suggestions that were approved
#   total - The number of suggestions that were inputted
mass-approve-success-title = Approved {$some}/{$total} suggestions

# Details which suggestions could be approved in the massapprove command
#   list - The list of suggestions
mass-approve-approve-results-detailed = **Approved:** {$list}

# Details which suggestions could not be approved in the massapprove command
#   list - The list of suggestions
mass-approve-fail-results-detailed = **Could Not Approve:** {$list}

# Shows why suggestions generally are not approved in the massapprove command
mass-approve-error-details = One or more of these suggestions could not be approved. Please make sure the suggestion IDs you have provided exist and have not already been approved.

# Title of the massdelete embed which shows the results of the command
#   some - The number of suggestions that were deleted
#   total - The number of suggestions that were inputted
mass-delete-success-title = Deleted {$some}/{$total} suggestions

# Details which suggestions could be deleted in the massdelete command
#   list - The list of suggestions
mass-delete-success-results-detailed = **Deleted:** {$list}

# Details which suggestions could not be deleted in the massdelete command
#   list - The list of suggestions
mass-delete-fail-results-detailed = **Could Not Delete:** {$list}

# Shows why suggestions generally are not deleted in the massdelete command
mass-delete-error-details = One or more of these suggestions could not be deleted. Please make sure the suggestion IDs you have provided exist and have not already been deleted/denied.

# Title of the massdeny embed which shows the results of the command
#   some - The number of suggestions that were denied
#   total - The number of suggestions that were inputted
mass-deny-success-title = Denied {$some}/{$total} suggestions

# Details which suggestions could be denied in the massdeny command
#   list - The list of suggestions
mass-deny-success-results-detailed = **Denied:** {$list}

# Details which suggestions could not be denied in the massdeny command
#   list - The list of suggestions
mass-deny-fail-results-detailed = **Could Not Deny:** {$list}

# Shows why suggestions generally are not denied in the massdeny command
mass-deny-error-details = One or more of these suggestions could not be denied. Please make sure the suggestion IDs you have provided exist and have not already been approved/denied.

# Error shown when a user attempts to remove an attachment from a suggestion that has no attachment
no-attachment-remove-error = This suggestion does not have an attachment.

# Title for the Attachment Removed embed
attachment-removed-title = Attachment Removed

# Title for the log embed when an attachment is removed from a suggestion
#   user - The staff member's tag
#   id - The suggestion ID
attach-remove-log = {$user} removed the attachment from #{$id}

# Error shown when a user attempts to unblock a user who is not blocked on a server
user-not-blocked-error = This user is not blocked from using the bot on this server.

# Success message when a user is unblocked in a guild
#   user - The user tag
#   id - The user ID
unblock-success = **{$user}** (`{$id}`) has been unblocked from using the bot on this server.

# Title of the log embed when a user is unblocked
#   user - The unblocked user's tag
#   staff - The staff member's tag
unblock-log-title = {$staff} unblocked {$user}

# Message shown when a user triggers the command cooldown spam filter
#   mention - The user mention
#   support - The link to the support server
cooldown-spam-flag = {$mention} ⚠️ You have been flagged by the command spam protection filter. This is generally caused when you use a lot of commands too quickly over a period of time. Due to this, you cannot use commands temporarily until a Suggester staff member reviews your situation. If you believe this is an error, please join {$support} and contact our Support Team.

# Shown when a command is on cooldown and a user attempts to use it
#   time - The number of seconds left for the cooldown
command-cooldown = 🕑 This command is on cooldown for {$time} more second(s).

# Header for the tutorial embed
tutorial-header = Thanks for adding Suggester!

# Description for the tutorial embed
#   prefix - The bot prefix
tutorial-desc = Suggester will help you easily and efficiently manage your server's suggestions, letting you get feedback from your community while also keeping out spam/unwanted suggestions! Staff members can also perform a number of actions on suggestions including (but not limited to) adding comments and marking statuses! The bot's prefix is `{$prefix}` by default, but can be changed at any time using the `config` command.

# Header for the Let's Get Started section of the tutorial embed
tutorial-get-started-header = Let's Get Started!

# Description for the Let's Get Started section of the tutorial embed
#   prefix - The bot prefix
tutorial-get-started-description = Before users can submit suggestions, someone with the **Manage Server** permission needs to do a bit of configuration. An easy way to do this is to run `{$prefix}setup`, which will start a walkthrough for setting up the most essential elements of the bot.

# Header for the What's Next? section of the tutorial embed
tutorial-next-header = What's Next?

# Description for the What's Next? section of the tutorial embed
#   prefix - The bot prefix
#   invite - The invite to the Suggester support server
tutorial-next-description-new =
  After you run `{$prefix}setup`, users can submit suggestions and the bot will work. If you are looking for more advanced configuration options like custom suggestion feed reactions and auto-cleaning of suggestion commands, try out `{$prefix}config`.

  If you're having an issue, or just want to find out more about the bot, head over to the __Suggester support server__: {$invite}
  This embed can be shown at any time using the `{$prefix}tutorial` command.

# Header for the embed shown when the bot is missing permissions necessary for a command
#   name - The username of the bot
#   channel - The channel where permissions are missing
permissions-missing-header = This command cannot be run because some permissions are missing. {$name} needs the following permissions in the {$channel} channel:

# Denotes what elements are missing when some permissions/config elements are
missing-elements-header = Missing Elements

# Shows how to fix missing configuration elements/permissions
how-to-fix-header = How to Fix

# Shows how to fix permission issues
#   name - The username of the bot
#   channel - The channel where permissions are missing
fix-missing-permissions-info = In the channel settings for {$channel}, make sure that **{$name}** has the above permissions allowed.

# Shown when configuration elements are missing
#   prefix - The bot prefix
missing-config-header = This command cannot be run because some server configuration elements are missing. A server manager can fix this by using the `{$prefix}config` command.

# String representing the Create Instant Invite permission
permission--create-instant-invite = Create Instant Invite

# String representing the Kick Members permission
permission--kick-members = Kick Members

# String representing the Ban Members permission
permission--ban-members = Ban Members

# String representing the Administrator permission
permission--administrator = Administrator

# String representing the Manage Channels permission
permission--manage-channels = Manage Channels

# String representing the Manage Server permission
permission--manage-guild = Manage Server

# String representing the Add Reactions permission
permission--add-reactions = Add Reactions

# String representing the View Audit Log permission
permission--view-audit-log = View Audit Log

# String representing the View Channel permission
permission--view-channel = View Channel

# String representing the Send Messages permission
permission--send-messages = Send Messages

# String representing the Send TTS Messages permission
permission--send-tts-messages = Send TTS Messages

# String representing the Manage Messages permission
permission--manage-messages = Manage Messages

# String representing the Embed Links permission
permission--embed-links = Embed Links

# String representing the Attach Files permission
permission--attach-files = Attach Files

# String representing the Read Message History permission
permission--read-message-history = Read Message History

# String representing the Mention Everyone permission
permission--mention-everyone = Mention Everyone

# String representing the Use External Emojis permission
permission--use-external-emojis = Use External Emojis

# String representing the Connect permission
permission--connect = Connect

# String representing the Speak permission
permission--speak = Speak

# String representing the Mute Members permission
permission--mute-members = Mute Members

# String representing the Deafen Members permission
permission--deafen-members = Deafen Members

# String representing the Move Members permission
permission--move-members = Move Members

# String representing the Use Voice Activity permission
permission--use-vad = Use Voice Activity

# String representing the Priority Speaker permission
permission--priority-speaker = Priority Speaker

# String representing the Change Nickname permission
permission--change-nickname = Change Nickname

# String representing the Manage Nicknames permission
permission--manage-nicknames = Manage Nicknames

# String representing the Manage Roles permission
permission--manage-roles = Manage Roles

# String representing the Manage Webhooks permission
permission--manage-webhooks = Manage Webhooks

# String representing the Manage Emojis permission
permission--manage-emojis = Manage Emojis

# String representing the Stream permission
permission--stream = Stream

# String representing the View Guild Insights permission
permission--view-guild-insights = View Guild Insights

# Permission shown in the help command if only bot admins can use the command
bot-admin-permission-sentence-new = <:sdev:842489745723752469> This command is only usable by bot administrators

# Permission shown in the help command if global staff+ can use the command
global-staff-permission-sentence-new = <:sstaff:842489745812226078> This command is only usable by global Suggester staff

# Permission shown in the help command if server admins+ can use the command
server-admin-permission-sentence = <:ssadmin:740199955981140030> This command is only usable by members with the "Manage Server" permission or a configured admin role

# Permission shown in the help command if server staff+ can use the command
server-staff-permission-sentence = <:ssstaff:740199956429799515> This command is only usable by members with a configured staff role or those with admin permissions

# Permission shown in the help command if all users can use the command
all-users-permission-sentence = <:sall:740199956325072998> This command is usable by all users

# Shown in help if a user does not have permission to use a command
has-not-command-permission = <:slock:740204044450005103> You do not have permission to use this command

# Shown in help if a user has permission to use a command
has-command-permission = <:sunlock:740204044928155788> You are able to use this command

# Error when a role has already been added as a blocked role
cfg-already-blocked-role-error = This role has already been blocked from using the bot on this server.

# Success message when a role is added to the server blocked role list
#   role - A role name
cfg-blocked-role-add-success = Members with the **{$role}** role can no longer use the bot on this server.

# Error when a role has not already been added as a blocked role
cfg-not-blocked-role-error = This role is not currently a blocked role.

# Success message when a role is removed from the server blocked role list
#   role - A role name
cfg-block-role-remove-success = Members with the **{$role}** role are no longer blocked from using the bot on this server.

# Shows information about the current shard for the shard command
#   shard - undefined
shard-info = This server is on shard {$shard}.

# Success message when the mention on submitted suggestion role is reset
cfg-reset-ping-role-success = Successfully reset the suggestion submitted mention role.

# Success message when the mention on submitted approved role is reset
cfg-reset-feed-ping-role-success = Successfully reset the suggestion approved mention role.

# Error when an suggestion ping role is configured but the bot does not have the Mention Everyone permission
#   bot - The bot mention
cfg-no-mention-everyone-error = Please give {$bot} the **Mention Everyone** permission in order for the bot to be able to mention this role when a suggestion is submitted.

# Error when the specified suggestion ping role is already set
cfg-already-ping-role-error = This role is already set to be mentioned when a suggestion is submitted!

# Success message when the suggestion ping role is configured
#   role - A role name
cfg-ping-role-success = The **{$role}** role will now be mentioned when suggestions are submitted for review.

# Error when the specified suggestio  approved ping role is already set
cfg-already-feed-ping-role-error = This role is already set to be mentioned when a suggestion is approved!

# Success message when the suggestion approved ping role is configured
#   role - A role name
cfg-feed-ping-role-success = The **{$role}** role will now be mentioned when suggestions are approved.

# Title for the list of locales
locale-list-title = Available Locales

# Title for the list of incomplete locales
locale-list-incomplete-title = Incomplete Locales

# Description for the list of incomplete locales
#   support_invite - The invite to the support server
locale-list-incomplete-desc = Locales in this list have not been completely translated, some parts of the bot may still appear in English. (Help translate by joining the [Support Server]({$support_invite}))

# Indicates the selected locale
selected = Selected

# Error shown when a user specifies an invalid locale
no-locale-error = No locale was found based on that input! Run this command with no parameters to see a list of available locales.

# Success message shown when the locale is set for a user
#   name - The locale name
#   invite - The invite to the support server
user-locale-set-success = Your locale has been successfully set to **{$name}**. You can report issues with this locale and help translate it by joining the Suggester support server: {$invite}

# Success message shown when the locale is set for a server
#   name - The locale name
#   invite - The invite to the support server
guild-locale-set-success = This server's locale has been successfully set to **{$name}**. You can report issues with this locale and help translate it by joining the Suggester support server: {$invite}

# If a server admin uses the command, prompts them to configure the locale for the entire server
#   prefix - The server prefix
#   code - The locale code
locale-server-setting-prompt = If you would like to set this locale as the server default, use `{$prefix}config locale {$code}`.

# Shown in the locale list embed informing users of how they can help translate
locale-footer = Don't see your language listed here? Apply to translate it in the support server!

# If you misspell a language name, there is a small chance OwO mode will be activated.
locale-easter-egg-activated = OwO mode activated!

# Message shown when locales are reloaded
#   count - The amount of locales that were loaded
locale-refresh-success = Successfully loaded {$count} locales.

# Shows the configured color change settings
#   number - The configured number of net upvotes
#   color - The configured color for the embed to change to
cfg-color-change-info = At **{$number}** net upvote(s), the embed color will change to {$color}.

# Error shown when the number specified for the color change threshold is invalid or less than 1
cfg-color-change-invalid-number = You must specify a valid integer greater than 0.

# Error shown when the color specified for the color change is invalid
cfg-color-change-invalid-color = You must specify a valid color (ex. Hex color, CSS color name)

# Error shown when an invalid parameter is specified in upvote color change configuration
cfg-color-change-no-params = You must specify `color` or `count`

# Header for the internal configuration section of the config list embed
cfg-internal-title = Internal Configuration

# Error shown when a command is not available in DMs
command-server-only = This command is not available in DMs.

# Header for the useful links section of the help embed
help-useful-links = Useful Links

# Shows useful links on the help command
#   support_invite - The link to the support server
#   bot_invite - The link to invite the bot
help-useful-links-desc-new =
  {"["}Join our Support Server](https://discord.gg/{$support_invite})
  {"["}Documentation](https://suggester.js.org/)
  {"["}Invite Me]({$bot_invite})
  {"["}Support Suggester](https://suggester.js.org/#/supporting/info)
  {"["}Privacy Policy](https://suggester.js.org/#/legal)

# Title when protips are shown
protip-title = **Protip:**

# Protip for inviting the bot
#   bot_invite - The link to invite the bot
protip-invite = You can invite Suggester to your server [here]({$bot_invite})

# Protip for the support server
#   support_invite - The link to the support server
protip-support = If you need help with Suggester or want to suggest a new feature, join our [support server]({$support_invite})

# Protip for approving with a comment
#   prefix - The server prefix
protip-reason-approve = You can specify a comment when approving a suggestion using `{$prefix}approve <suggestion id> <comment>`

# Protip for mass approving
#   prefix - The server prefix
protip-mass-approve = You can approve multiple suggestions at once using `{$prefix}mapprove <suggestion id 1> <suggestion id 2> <suggestion id 3> -r <comment>`

# Protip for denying with a reason
#   prefix - The server prefix
protip-reason-deny = You can specify a reason when denying a suggestion using `{$prefix}deny <suggestion id> <reason>`

# Protip for mass denying
#   prefix - The server prefix
protip-mass-deny = You can deny multiple suggestions at once using `{$prefix}mdeny <suggestion id 1> <suggestion id 2> <suggestion id 3> -r <comment>`

# Protip for in-channel suggestions
#   prefix - The server prefix
protip-inchannel = You can configure Suggester to allow suggestions to be submitted via any message in the suggestions feed channel using `{$prefix}config sendinchannel on`

# Protip for emote config
#   prefix - The server prefix
protip-emotes =
  You can configure custom reaction emojis for the suggestion feed using these commands:
  `{$prefix}config emojis up <emoji>`
  `{$prefix}config emojis mid <emoji>`
  `{$prefix}config emojis down <emoji>`

  You can also disable any of the reaction emojis using `{$prefix}config emojis <up, mid, or down> disable`

# Protip for voting
#   prefix - The server prefix
#   list - Randomly selected bot list link
protip-voting =
  If you enjoy Suggester, consider helping to support us by voting on bot lists! If you have a minute, click [here]({$list}) and vote.
  If you want to help even more, you can use `{$prefix}vote` to see the full list of sites where you can vote. Thanks for your support!

# Protip for notify
#   prefix - The server prefix
protip-notify = You can use `{$prefix}notify` to enable or disable receiving DM notifications when an action is taken on one of your suggestions

# Protip for locale
#   prefix - The server prefix
#   support_invite - The link to the support server
protip-locale = You can use `{$prefix}locale` to make the bot respond to you in a different language. If your language isn't listed and/or you'd like to help translate, join our [Support Server]({$support_invite}) and ask to join the Translation Program!

# Protip for changelog
#   prefix - The server prefix
protip-changelog = You can use `{$prefix}changelog` to see the latest bot updates

# Protip for acomment
#   prefix - The server prefix
protip-acomment = You can add an anonymous comment to a suggestion using `{$prefix}acomment <suggestion ID> <comment>`. These are the same as comments, but they don't show who created them

# Protip for mark with a comment
#   prefix - The server prefix
protip-markcomment = You can add a comment to a suggestion when using the mark command using `{$prefix}mark <suggestion ID> <status> <comment>`

# Protip for block
#   prefix - The server prefix
protip-block = You can block a user from using the bot on your server using `{$prefix}block <user>`

# Protip for colorchange
#   prefix - The server prefix
protip-colorchange = You can configure the bot to change the embed color when a suggestion reaches a certain number of upvotes by using `{$prefix}config colorchange number <number of upvotes>` and `{$prefix}config colorchange color <color>`

# Protip for queue
#   prefix - The server prefix
protip-queue = You can view all suggestions currently awaiting review using the `{$prefix}queue` command

# Protip for Canary
#   support_invite - The link to the support server
protip-canary = You can join the Suggester Canary program to help test new bot features before they are released to the main bot. Join the [Support Server]({$support_invite}) for info!

# Protip for the large server program
#   support_invite - The link to the support server
protip-large-server = This server may be eligible for Suggester's **large server program**. Read more about the program [here](https://suggester.js.org/#/community-programs) and apply in the [support server]({$support_invite}) for info!

# Protip for a rick-roll
protip-rickroll =
  We're no strangers to love
  You know the rules and so do I
  A full commitment's what I'm thinking of
  You wouldn't get this from any other guy
  I just wanna tell you how I'm feeling
  Gotta make you understand
  Never gonna give you up
  Never gonna let you down
  Never gonna run around and desert you
  Never gonna make you cry
  Never gonna say goodbye
  Never gonna tell a lie and hurt you
  We've known each other for so long
  Your heart's been aching but you're too shy to say it
  Inside we both know what's been going on
  We know the game and we're gonna play it
  And if you ask me how I'm feeling
  Don't tell me you're too blind to see
  Never gonna give you up
  Never gonna let you down
  Never gonna run around and desert you
  Never gonna make you cry
  Never gonna say goodbye
  Never gonna tell a lie and hurt you
  Never gonna give you up
  Never gonna let you down
  Never gonna run around and desert you
  Never gonna make you cry
  Never gonna say goodbye

# Denotes the protips section in the verify embed
protips-title = **Protips:**

# Denotes the protips shown section in the verify embed
protips-shown-title = **Protips Shown:**

# Reason for suggestion denial for importing
imported-reason = This suggestion was denied before it was imported into Suggester.

# Success message for importing
#   count - The number of imported suggestions
imported-success = Successfully imported {$count} suggestion(s)!

# Success message for importing when some were not imported
#   count - The number of imported suggestions
imported-some-error = Successfully imported {$count} suggestion(s)! Some suggestions weren't imported, possibly because they were already imported or were above the 1024 character limit.

# Error shown when no suggestions are imported
imported-none = No suggestions were imported

# Shown when a user begins an import
#   time - The estimated time that the import will take
import-start = Beginning import... Under optimal conditions this should take {$time}.

# Title for the importing embed
import-title = Importing Suggestions

# Description for the suggestion embed
#   bots - The list of supported bots for import
#   support_invite - The link to the support server
#   check - The check emoji
#   x - The X emoji
import-desc =
  Suggester can import suggestions from your existing suggestions channel, allowing you to utilize all of Suggester's features on them!
  Suggester can import suggestions sent by users, as well as ones submitted through these bots:
  {$bots}

  The last **30** messages sent in __this channel__ will be imported. If you need to import more messages, stop this import and contact our [support team]({$support_invite}).
  To continue with this import, select {$check}. To cancel, select {$x}.

# Title for the override header of the import embed
import-override-title = Message Override

# Shows how many messages will be imported if the limit is overriden
#   num - The number of messages to import
import-override-desc = **{$num}** messages will be imported

# Error shown when the number of messages to import is invalid
import-too-many-error = You must specify an integer between 1 and 100.

# Header for the votes section of the suggestion embed
votes-title = Votes

# Error shown when no suggestions are found for the top/down command
no-suggestions-found = No suggestions that matched your query were found

# Header for the top suggestions embed
#   number - The number of suggestions shown
#   min - undefined
#   max - undefined
top-title-new-again = Top {$number} Highest Voted Suggestions (showing {$min}-{$max} of {$number})

# Header for the lowest voted suggestions embed
#   number - The number of suggestions shown
#   min - undefined
#   max - undefined
down-title-new = Top {$number} Lowest Voted Suggestions (showing {$min}-{$max} of {$number})

# Message shown when waiting for top 10 data to collect
suggestion-loading = Collecting suggestion data, this may take a moment...

# Description for the acknowledgement command
command-desc--acknowledgement = Sets a verify acknowledgement for a user

# Description for the acknowledgement command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--acknowledgement = acknowledgement [user] (new acknowledgement)

# Examples for the acknowledgement command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--acknowledgement =
  `{$p}acknowledgement`
  Shows your acknowledgement

  `{$p}acknowledgement @Brightness™`
  Shows Brightness™'s acknowledgement

  `{$p}acknowledgement @Brightness™ Test`
  Sets Brightness™'s acknowledgement to "Test"

  `{$p}acknowledgement @Brightness™ reset`
  Resets Brightness™'s acknowledgement

# Description for the search command
command-desc--search = Searches suggestions on this server

# Usage for the search command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--search = search [query]

# Examples for the search command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--search =
  `{$p}search status:approved author:327887845270487041`
  Searches for approved suggestions created by user 327887845270487041

  `{$p}search mark:"in progress" staff:702180584503508994`
  Searches for suggestions marked as "In Progress" that were approved by user 702180584503508994

  `{$p}search votes>10 time>"1 month" content!"test"`
  Searches for suggestions with more than 10 votes, more than a month old, and with a content not including "test"

# Description for the exempt command
command-desc--exempt = Allows a user to bypass the server's configured suggestion cooldown

# Usage for the exempt command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--exempt = exempt [user]

# Examples for the exempt command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--exempt =
  `{$p}exempt @Brightness™`
  Exempts Brightness™ from the configured suggestion cooldown

  `{$p}exempt 255834596766253057`
  Exempts a user with ID 255834596766253057 from the configured suggestion cooldown

# Description for the allowlist command
command-desc--allowlist = Adds a server to the allowed list

# Description for the allowlist command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--allowlist = allowlist [add/remove] [guild id]

# Examples for the allowlist command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--allowlist =
  `{$p}allowlist add 681490407862829073`
  Adds server 681490407862829073 to the allowed list

  `{$p}allowlist remove 681490407862829073`
  Removes server 681490407862829073 from the allowed list

# Description for the db command
command-desc--db = Gets or modifies a database entry

# Description for the db command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--db = db [query|modify] [collection] [query field] [query value] (modify:field) (modify:value)

# Examples for the db command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--db =
  `{$p}db query Suggestion suggestionId 1`
  Gets data for a document in the `Suggestion` collection with a `suggestionId` of `1`

  `{$p}db modify Suggestion suggestionId 1 suggester 327887845270487041`
  Sets the `suggester` value of a document in the `Suggestion` collection with a `suggestionId` of `1` to `327887845270487041`

# Description for the deploy command
command-desc--deploy = Pulls an update from git and reboots with changes

# Description for the deploy command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--deploy = deploy (branch)

# Examples for the deploy command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--deploy =
  `{$p}deploy`
  Deploys an update from the `production` branch

  `{$p}deploy staging`
  Deploys an update from the `staging` branch

# Description for the eval command
command-desc--eval = Runs JavaScript code

# Description for the eval command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--eval = eval [code]

# Examples for the eval command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--eval =
  `{$p}eval return 2+2`
  Evaluates the value of 2+2 and returns it

# Description for the flags command
command-desc--flags = Sets internal flags for a user

# Description for the flags command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--flags = flags [guild|user [id] (add|remove) (flag)

# Examples for the flags command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--flags =
  `{$p}flags user @Brightness™`
  Shows flags for Brightness™

  `{$p}flags user @Brightness™ add STAFF`
  Adds the `STAFF` flag to Brightness™

  `{$p}flags user @Brightness™ remove STAFF`
  Removes the `STAFF` flag from Brightness™

  `{$p}flags guild 635632859998060554`
  Shows flags for guild 635632859998060554

  `{$p}flags guild 635632859998060554 add PROTECTED`
  Adds the `PROTECTED` flag to guild 635632859998060554

  `{$p}flags guild 635632859998060554 remove PROTECTED`
  Removes the `PROTECTED` flag from guild 635632859998060554

# Description for the globalban command
command-desc--globalban = Excludes a user or server from using the bot globally

# Description for the globalban command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--globalban = globalban [guild|user] [id] (true|false)

# Examples for the globalban command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--globalban =
  `{$p}globalban user 327887845270487041`
  Checks block status for user 327887845270487041

  `{$p}globalban user 327887845270487041 true`
  Blocks user 327887845270487041 globally

  `{$p}globalban user 327887845270487041 false`
  Unblocks user 327887845270487041 globally

  `{$p}globalban guild 693209117220929596`
  Checks block status for guild 693209117220929596

  `{$p}globalban guild 693209117220929596 true`
  Blocks guild 327887845270487041 from using the bot

  `{$p}globalban guild 693209117220929596 false`
  Unblocks guild 327887845270487041 from using the bot

# Description for the reboot command
command-desc--reboot = Reboots the bot by exiting the process

# Description for the reboot command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--reboot = reboot (shard id)

# Examples for the reboot command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--reboot =
  `{$p}reboot`
  Reboots all shards of the bot

  `{$p}reboot 2`
  Reboots shard 2

# Description for the shell command
command-desc--shell = Runs shell code

# Description for the shell command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--shell = shell [code]

# Description for the changelog command
command-desc--changelog = Shows the latest Suggester release

# Description for the changelog command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--changelog = changelog

# Description for the help command
command-desc--help = Shows command information

# Description for the help command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--help = help (command name)

# Examples for the help command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--help =
  `{$p}help`
  Shows the list of commands

  `{$p}help suggest`
  Shows information about the "suggest" command

# Description for the invite command
command-desc--invite = Shows the link to invite the bot

# Usage for the invite command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--invite = invite

# Description for the github command
command-desc--github = Shows the link to Suggester's GitHub repository

# Usage for the github command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--github = github

# Description for the prefix command
command-desc--prefix = Shows the bot's prefix on this server

# Usage for the prefix command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--prefix = prefix

# Description for the locale command
command-desc--locale = Sets the language the bot responds to you in

# Description for the locale command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--locale = locale <locale to set>

# Examples for the locale command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--locale =
  `{$p}locale`
  Shows the list of available languages

  `{$p}locale fr`
  Sets your language to French

# Description for the notify command
command-desc--notify = Views/edits your notification settings

# Description for the notify command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--notify = notify (on|off|toggle)

# Examples for the notify command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--notify =
  `{$p}notify`
  Shows your DM notification setting

  `{$p}notify on`
  Enables DM notifications for suggestion changes

  `{$p}notify off`
  Disables DM notifications for suggestion changes

  `{$p}notify toggle`
  Toggles DM notifications for suggestion changes

# Description for the ping command
command-desc--ping = Checks bot response time and shows information

# Description for the ping command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--ping = ping

# Description for the protips command
command-desc--protips = Views/edits your protip setting

# Description for the protips command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--protips = protips (on|off|toggle)

# Examples for the protips command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--protips =
  `{$p}protips`
  Shows your protips setting

  `{$p}protips on`
  Enables showing protips

  `{$p}protips off`
  Disables showing protips

  `{$p}protips toggle`
  Toggles showing protips

# Description for the shard command
command-desc--shard = Shows the shard this server is on

# Description for the shard command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--shard = shard

# Description for the suggest command
command-desc--suggest = Submits a suggestion

# Description for the suggest command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--suggest = suggest [suggestion]

# Examples for the suggest command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--suggest =
  `{$p}suggest This is a suggestion`
  Submits a suggestion

  You can also attach images to your suggestion by uploading an image when you send the command

# Description for the support command
command-desc--support = Shows the link to the support server

# Description for the support command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--support = support

# Description for the tutorial command
command-desc--tutorial = Shows information about setting up the bot and using it

# Description for the tutorial command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--tutorial = tutorial

# Description for the verify command
command-desc--verify = Shows permissions of a user as they relate to the bot

# Description for the verify command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--verify = verify (user)

# Examples for the verify command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--verify =
  `{$p}verify`
  Shows information about you

  `{$p}verify @Brightness™`
  Shows Brightness™'s information

# Description for the vote command
command-desc--vote = Help support the bot!

# Description for the vote command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--vote = vote

# Description for the autosetup command
command-desc--autosetup = Automatically sets up channels and configures the bot

# Description for the autosetup command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--autosetup = autosetup

# Description for the config command
command-desc--config = Shows/edits server configuration

# Description for the config command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--config = config (element) (additional parameters)

# Examples for the config command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--config = Use `{{p}}config help` to view detailed instructions

# Description for the import command
command-desc--import = Imports suggestions from a channel

# Description for the import command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--import = import

# Description for the setup command
command-desc--setup = Walks you through an interactive configuration process

# Description for the setup command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--setup = setup

# Examples for the setup command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--setup = The bot will send a prompt, and you send your response in the channel. The bot will then send another prompt, and the cycle continues until your server is configured.

# Description for the acomment command
command-desc--acomment = Adds a comment to an approved suggestion anonymously

# Description for the acomment command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--acomment = acomment [suggestion id] [comment]

# Examples for the acomment command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--acomment =
  `{$p}acomment 1 This is a comment`
  Anonymously comments on suggestion #1 with "This is a comment"

# Description for the approve command
command-desc--approve = Approves a suggestion

# Description for the approve command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--approve = approve [suggestion id] (comment)

# Examples for the approve command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--approve =
  `{$p}approve 1`
  Approves suggestion #1

  `{$p}approve 1 This is a comment`
  Approves suggestion #1 and adds a comment from the approver saying "This is a comment"

# Description for the attach command
command-desc--attach = Attaches a file to an approved suggestion

# Description for the attach command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--attach = attach [suggestion id] [attachment link]

# Examples for the attach command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--attach =
  `{$p}attach 1 https://i.imgur.com/zmntNve.png`
  Attaches https://i.imgur.com/zmntNve.png to suggestion #1

  `{$p}attach 1`
  If you attach an image via Discord's native uploader, it will be added to suggestion #1

# Description for the block command
command-desc--bl = Blocks a user from using the bot in this server

# Description for the block command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--bl = block [user] (duration) (reason)

# Examples for the block command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--bl =
  `{$p}block @Brightness™`
  Blocks Brightness™ from using the bot in this server

  `{$p}block 255834596766253057 Spamming suggestions`
  Blocks a user with ID 255834596766253057 from using the bot in this server for "Spamming suggestions"

  `{$p}block @Brightness™ 1h`
  Blocks Brightness™ from using the bot in this server for 1 hour

  `{$p}block 255834596766253057 2h Spamming suggestions`
  Blocks a user with ID 255834596766253057 from using the bot in this server for 2 hours with reason "Spamming suggestions"

# Description for the comment command
command-desc--comment = Adds a comment to an approved suggestion

# Description for the comment command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--comment = comment [suggestion id] [comment]

# Examples for the comment command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--comment =
  `{$p}comment 1 This is a comment`
  Comments on suggestion #1 with "This is a comment"

# Description for the delete command
command-desc--delete = Deletes a suggestion, removing it from the suggestions feed

# Description for the delete command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--delete = delete [suggestion id] (reason)

# Examples for the delete command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--delete =
  `{$p}delete 1`
  Deletes suggestion #1

  `{$p}delete 1 This has already been suggested`
  Deletes suggestion #1 with the reason "This has already been suggested"

# Description for the deletecomment command
command-desc--deletecomment = Deletes a comment from a suggestion

# Description for the deletecomment command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--deletecomment = deletecomment [comment id]

# Examples for the deletecomment command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--deletecomment =
  `{$p}deletecomment 27_1`
  Deletes a comment with the ID `27_1`

# Description for the deny command
command-desc--deny = Denies a suggestion

# Description for the deny command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--deny = deny [suggestion id] (reason)

# Examples for the deny command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--deny =
  `{$p}deny 1`
  Denies suggestion #1

  `{$p}deny 1 This isn't something we're interested in`
  Denies suggestion #1 with the reason "This isn't something we're interested in"

# Description for the dupe command
command-desc--dupe = Denies a suggestion as a duplicate of another

# Description for the dupe command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--dupe = dupe [duplicate suggestion id] [original suggestion id]

# Examples for the dupe command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--dupe =
  `{$p}dupe 1 2`
  Denies suggestion #1 as a duplicate of suggestion #2

# Description for the info command
command-desc--info = Shows information about a suggestion

# Description for the info command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--info = info [suggestion id]

# Examples for the info command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--info =
  `{$p}info 1`
  Shows information about suggestion #1

# Description for the listqueue command
command-desc--listqueue = Shows the queue of suggestions awaiting review

# Description for the listqueue command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--listqueue = listqueue

# Description for the mark command
command-desc--markstatus = Marks a status on a suggestion

# Description for the mark command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--markstatus = mark [suggestion id] [status] (comment)

# Examples for the mark command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--markstatus =
  `{$p}mark 1 implemented`
  Marks suggestion #1 as implemented

  `{$p}mark 1 working This will be released soon!`
  Marks suggestion #1 as in progress and adds a comment saying "This will be released soon!"

  >>> **Status List:**
  <:simplementednum:822458050161147914> Implemented (`implemented`)
  <:sworkingnum:822458050374795295> In Progress (`working`)
  <:sconsider:822458050111340544> In Consideration (`considered`)
  <:sdefault1:842488332562071612> Default (`default`)
  <:snonum:822458049801355315> Not Happening (`no`)

# Description for the massapprove command
command-desc--massapprove = Approves multiple suggestions at once

# Description for the massapprove command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--massapprove = massapprove [suggestion ids] -r (comment)

# Examples for the massapprove command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--massapprove =
  `{$p}massapprove 1 2 3`
  Approves suggestions 1, 2, and 3

  `{$p}massapprove 1 2 3 -r Nice suggestion!`
  Approves suggestions 1, 2, and 3 and comments on each of them with "Nice suggestion!"

# Description for the massdelete command
command-desc--massdelete = Deletes multiple suggestions at once, removing them from the suggestions feed

# Description for the massdelete command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--massdelete = massdelete [suggestion ids] -r (reason)

# Examples for the massdelete command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--massdelete =
  `{$p}massdelete 1 2 3`
  Deletes suggestions 1, 2, and 3

  `{$p}massdelete 1 2 3 -r Cleaning up suggestions`
  Deletes suggestions 1, 2, and 3 with a reason of "Cleaning up suggestions"

# Description for the massdeny command
command-desc--massdeny = Denies multiple suggestions at once

# Description for the massdeny command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--massdeny = massdeny [suggestion ids] -r (reason)

# Examples for the massdeny command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--massdeny =
  `{$p}massdeny 1 2 3`
  Denies suggestions 1, 2, and 3

  `{$p}massdeny 1 2 3 -r This isn't something we're interested in doing`
  Denies suggestions 1, 2, and 3 with a reason of "This isn't something we're interested in doing"

# Description for the removeattachment command
command-desc--removeattachment = Removes an attachment from a suggestion

# Description for the removeattachment command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--removeattachment = removeattachment [suggestion id]

# Examples for the removeattachment command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--removeattachment =
  `{$p}removeattachment 1`
  Removes the attachment from suggestion #1

# Description for the silentdelete command
command-desc--silentdelete = Deletes a suggestion without posting it to the denied suggestions feed or DMing the suggesting user

# Description for the silentdelete command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--silentdelete = silentdelete [suggestion id] (reason)

# Examples for the silentdelete command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--silentdelete =
  `{$p}silentdelete 1`
  Silently deletes suggestion #1

  `{$p}silentdelete 1 This has already been suggested`
  Silently deletes suggestion #1 with the reason "This has already been suggested"

# Description for the silentdeny command
command-desc--silentdeny = Denies a suggestion without posting it to the denied suggestions feed or DMing the suggesting user

# Description for the silentdeny command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--silentdeny = silentdeny [suggestion id] (reason)

# Examples for the silentdeny command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--silentdeny =
  `{$p}silentdeny 1`
  Silently denies suggestion #1

  `{$p}silentdeny 1 This isn't something we're interested in`
  Silently denies suggestion #1 with the reason "This isn't something we're interested in"

# Description for the top command
command-desc--topvoted = Shows the top 10 most highly voted suggestions

# Description for the top command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--topvoted = top (time)

# Examples for the top command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--topvoted =
  `{$p}top`
  Shows the top 10 suggestions

  `{$p}top 1w`
  Shows the top 10 suggestions from the last week

# Description for the down command
command-desc--down = Shows the top 10 lowest voted suggestions

# Description for the down command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--down = down (time)

# Examples for the down command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--down =
  `{$p}down`
  Shows the top 10 lowest voted suggestions

  `{$p}down 1w`
  Shows the top 10 lowest voted suggestions from the last week

# Description for the unblock command
command-desc--unblock = Unblocks a user from using the bot in this server

# Description for the unblock command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--unblock = unblock [user]

# Examples for the unblock command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--unblock =
  `{$p}unblock @Brightness™`
  Unblocks Brightness™ from using the bot in this server

  `{$p}unblock 255834596766253057 Accidentally blocked`
  Unblocks a user with ID 255834596766253057 from using the bot in this server with reason "Accidentally blocked"

# The name of the Configuration module
module-name--configuration = Configuration

# The description for the Configuration module
module-desc--configuration = Commands for configuring the bot

# The name of the Developer module
module-name--developer = Developer

# The description for the Developer module
module-desc--developer = Commands for developers/global administrators

# The name of the Global Staff module
module-name--global-staff = Global Staff

# The description for the Global Staff module
module-desc--global-staff = Commands usable by global Suggester staff members

# The name of the Moderator module
module-name--moderator = Moderator

# The description for the Moderator module
module-desc--moderator = Commands for moderating who can submit suggestions

# The name of the Other module
module-name--other = Other

# The description for the Other module
module-desc--other = Miscellaneous commands

# The name of the Review module
module-name--review = Review

# The description for the Review module
module-desc--review = Commands for reviewing suggestions (only available when the bot is in the `review` mode)

# The name of the Suggestions module
module-name--suggestions = Suggestions

# The description for the Suggestions module
module-desc--suggestions = Commands for submitting and interacting with suggestions

# Error shown when no command can be found in the help command
unknown-command-error = No command was found based on your input!

# Error shown when no element can be found in the config help command
unknown-element-error = No configuration element was found based on your input!

# Error shown when a server that is not the current one has a config subcommand run
cfg-other-server-error = Configurations of other servers are view-only via the `list` subcommand.

# Name of the Admin Roles config element
config-name--admin = Admin Roles

# Description of the Admin Roles config element
config-desc--admin = Roles that are allowed to edit server configuration, as well as use all staff commands. (Members with the **Manage Server** permission also have access to these commands)

# Examples for the Admin Roles config element
# Make sure to keep original formatting and not translate actual inputs like `admin`
config-examples--admin =
  `{$p}config admin add Owner`
  Adds the "Owner" role as an admin role

  `{$p}config admin add @Management`
  Adds the mentioned "Management" role as an admin role

  `{$p}config admin add 658753146910408724`
  Adds a role with ID 658753146910408724 as an admin role

  `{$p}config admin remove Owner`
  Removes the "Owner" role from the list of admin roles

# Name of the Staff Roles config element
config-name--staff = Staff Roles

# Description of the Staff Roles config element
config-desc--staff = Roles that have access to suggestion management commands like `approve`, `deny`, `comment`, and `mark`.

# Examples for the Staff Roles config element
# Make sure to keep original formatting and not translate actual inputs like `staff`
config-examples--staff =
  `{$p}config staff add Staff`
  Adds the "Staff" role as a staff role

  `{$p}config staff add @Moderator`
  Adds the mentioned "Moderator" role as a staff role

  `{$p}config staff add 658753146910408724`
  Adds a role with ID 658753146910408724 as a staff role

  `{$p}config staff remove Moderator`
  Removes the "Moderator" role from the list of staff roles

# Name of the Allowed Suggesting Roles config element
config-name--allowed = Allowed Suggesting Roles

# Description of the Allowed Suggesting Roles config element
config-desc--allowed = Roles that are allowed to submit suggestions. If no roles are configured, all users can submit suggestions.

# Examples for the Allowed Suggesting Roles config element
# Make sure to keep original formatting and not translate actual inputs like `allowed`
config-examples--allowed =
  `{$p}config allowed add Trusted`
  Adds the "Trusted" role to the list of allowed roles

  `{$p}config allowed add @Cool Person`
  Adds the mentioned "Cool Person" role as an allowed role

  `{$p}config allowed add 658753146910408724`
  Adds a role with ID 658753146910408724 to the list of allowed roles

  `{$p}config allowed remove Trusted`
  Removes the "Trusted" role from the list of allowed roles

# Name of the Voting Roles config element
config-name--voting = Voting Roles

# Description of the Voting Roles config element
config-desc--voting = Roles that are allowed to vote on suggestions in the approved suggestion feed. If no roles are configured, all users can vote on suggestions.

# Examples for the Voting Roles config element
# Make sure to keep original formatting and not translate actual inputs like `voting`
config-examples--voting =
  `{$p}config voting add Trusted`
  Adds the "Trusted" role to the list of allowed voting roles

  `{$p}config voting add @Cool Person`
  Adds the mentioned "Cool Person" role as an allowed voting role

  `{$p}config voting add 658753146910408724`
  Adds a role with ID 658753146910408724 to the list of allowed voting roles

  `{$p}config voting remove Trusted`
  Removes the "Trusted" role from the list of allowed voting roles

# Name of the Blocked Roles config element
config-name--blocked = Blocked Roles

# Description of the Blocked Roles config element
config-desc--blocked = Roles that are blocked from using the bot on this server. If you want to block one specific user, use the `block` command.

# Examples for the Blocked Roles config element
# Make sure to keep original formatting and not translate actual inputs like `blocked`
config-examples--blocked =
  `{$p}config blocked add Restricted`
  Adds the "Restricted" role to the list of blocked roles

  `{$p}config blocked add @Bad Person`
  Adds the mentioned "Bad Person" role as a blocked role

  `{$p}config blocked add 658753146910408724`
  Adds a role with ID 658753146910408724 to the list of blocked roles

  `{$p}config blocked remove Annoying`
  Removes the "Annoying" role from the list of blocked roles, allowing members with that role to use the bot again

# Name of the Approved Suggestion Role config element
config-name--approverole = Approved Suggestion Role

# Description of the Approved Suggestion Role config element
config-desc--approverole = The role that is given to members that have a suggestion approved.

# Examples for the Approved Suggestion Role config element
# Make sure to keep original formatting and not translate actual inputs like `approverole`
config-examples--approverole =
  `{$p}config approverole Suggestion Submitter`
  Sets the "Suggestion Submitter" as the role given when a member has their suggestion approved

  `{$p}config approverole none`
  Resets the role given when a member has their suggestion approved, meaning no role will be given

# Name of the Suggestion Submitted Mention Role config element
config-name--reviewping = Suggestion Submitted Mention Role

# Description of the Suggestion Submitted Mention Role config element
config-desc--reviewping = The role that is mentioned when a new suggestion is submitted for review.

# Examples for the Suggestion Submitted Mention Role config element
# Make sure to keep original formatting and not translate actual inputs like `pingrole`
config-examples--reviewping =
  `{$p}config reviewping Staff`
  Sets the "Staff" role as the role mentioned when a suggestion is submitted for review

  `{$p}config reviewping none`
  Resets the role mentioned when a suggestion is submitted for review, meaning no role will be mentioned

# Name of the Suggestion Approved Mention Role config element
config-name--approveping = Suggestion Approved Mention Role

# Description of the Suggestion Approved Mention Role config element
config-desc--approveping = The role that is mentioned when a new suggestion is approved and sent to the suggestions feed.

# Examples for the Suggestion Approved Mention Role config element
# Make sure to keep original formatting and not translate actual inputs like `pingrole`
config-examples--approveping =
  `{$p}config approveping Voting Squad`
  Sets the "Voting Squad" role as the role mentioned when a suggestion is sent to the suggestions feed

  `{$p}config approveping none`
  Resets the role mentioned when a suggestion is sent to the suggestions feed, meaning no role will be mentioned

# Name of the Suggestion Review Channel config element
config-name--review = Suggestion Review Channel

# Description of the Suggestion Review Channel config element
config-desc--review = The channel where suggestions are sent once they are submitted for review.

# Examples for the Suggestion Review Channel config element
# Make sure to keep original formatting and not translate actual inputs like `review`
config-examples--review =
  `{$p}config review #suggestion-review`
  Sets the #suggestion-review channel as the channel where suggestions awaiting review are sent

# Name of the Approved Suggestions Channel config element
config-name--suggestions = Approved Suggestions Channel

# Description of the Approved Suggestions Channel config element
config-desc--suggestions = The channel where suggestions are sent once they are approved (or submitted when the mode is set to `autoapprove`).

# Examples for the Approved Suggestions Channel config element
# Make sure to keep original formatting and not translate actual inputs like `suggestions`
config-examples--suggestions =
  `{$p}config suggestions #suggestions`
  Sets the #suggestions channel as the channel where approved suggestions are sent

# Name of the Denied Suggestions Channel config element
config-name--denied = Denied Suggestions Channel

# Description of the Denied Suggestions Channel config element
config-desc--denied = The channel where suggestions are sent when they are denied or deleted.

# Examples for the Denied Suggestions Channel config element
# Make sure to keep original formatting and not translate actual inputs like `denied`
config-examples--denied =
  `{$p}config denied #denied-suggestions`
  Sets the #denied-suggestions channel as the channel where denied or deleted suggestions are sent

  `{$p}config denied none`
  Resets the denied suggestions channel, making there be none set

# Name of the Log Channel config element
config-name--log = Log Channel

# Description of the Log Channel config element
config-desc--log = The channel where suggestions submitted and actions taken on them are logged.

# Examples for the Log Channel config element
# Make sure to keep original formatting and not translate actual inputs like `log`
config-examples--log =
  `{$p}config log #suggestion-log`
  Sets the #suggestion-log channel as log channel for suggestions and actions taken on them

  `{$p}config log none`
  Resets the log channel, making there be none set

# Name of the Suggestion Commands Channels config element
config-name--commandschannels = Suggestion Commands Channels

# `{$p}config commands add #bot-commands`
# Limits using the `suggest` command to the #bot-commands channel
# 
# `{$p}config commands remove 567385190196969493`
# Removes the 567385190196969493 channel from the list of commands channels
# 
# `{$p}config commands list`
# Lists the configured commands channels
config-desc--commandschannels = This setting locks using the `suggest` command to only the configured channels. Configuring no channels will allow the command to be used in any channel.

# Examples for the Suggestion Commands Channels config element
# Make sure to keep original formatting and not translate actual inputs like `commands`
config-examples--commandschannels =
  `{$p}config commands add #bot-commands`
  Limits using the `suggest` command to the #bot-commands channel

  `{$p}config commands remove 567385190196969493`
  Removes the 567385190196969493 channel from the list of commands channels

  `{$p}config commands list`
  Lists the configured commands channels

# Name of the Implemented Suggestions Archive Channel config element
config-name--implemented = Implemented Suggestions Archive Channel

# Description of the Implemented Suggestions Archive Channel config element
config-desc--implemented = The channel where suggestions marked as "Implemented" via the `mark` command are sent. If no channel is configured, implemented suggestions will remain in the suggestions feed

# Examples for the Implemented Suggestions Archive Channel config element
# Make sure to keep original formatting and not translate actual inputs like `implemented`
config-examples--implemented =
  `{$p}config implemented #implemented-suggestions`
  Sets the #implemented-suggestions channel as the channel where implemented suggestions are sent

  `{$p}config implemented none`
  Resets the implemented suggestions archive channel, making there be none set

# Name of the Prefix config element
config-name--prefix = Prefix

# Description of the Prefix config element
config-desc--prefix = The string of characters (usually a symbol) used to invoke a bot command. For example, in `.vote` the prefix is `.`

# Examples for the Prefix config element
# Make sure to keep original formatting and not translate actual inputs like `prefix`
config-examples--prefix =
  `{$p}config prefix ?`
  Sets the bot prefix to `?`

# Name of the Mode config element
config-name--mode = Mode

# Description of the Mode config element
config-desc--mode = The mode of handling suggestions. This can be `review` (all suggestions are held for manual review by staff) or `autoapprove` (all suggestions are automatically posted to the suggestions feed)

# Examples for the Mode config element
# Make sure to keep original formatting and not translate actual inputs like `mode`
config-examples--mode =
  `{$p}config mode review`
  Sets the mode to `review`

  `{$p}config mode autoapprove`
  Sets the mode to `autoapprove`

# Name of the Suggestion Feed Reactions config element
config-name--emojis = Suggestion Feed Reactions

# Description of the Suggestion Feed Reactions config element
config-desc--emojis = Settings for managing the emojis that are added to suggestions posted to the suggestions feed

# Examples for the Suggestion Feed Reactions config element
# Make sure to keep original formatting and not translate actual inputs like `emojis`
config-examples--emojis =
  `{$p}config emojis up 👍`
  Sets the upvote emoji to 👍

  `{$p}config emojis mid 🤷`
  Sets the shrug/no opinion emoji to 🤷

  `{$p}config emojis down 👎`
  Sets the downvote emoji to 👎

  `{$p}config emojis up disable`
  Disables the upvote reaction (this can be done for any reaction, just change `up` to any of the other types)

  `{$p}config emojis disable`
  Disables all suggestion feed reactions

  `{$p}config emojis enable`
  Enables suggestion feed reactions if they are disabled

# Name of the DM Notifications config element
config-name--notify = DM Notifications

# Description of the DM Notifications config element
config-desc--notify = Settings for server notifications, whether or not users are sent a DM when an action is taken on one of their suggestions

# Examples for the DM Notifications config element
# Make sure to keep original formatting and not translate actual inputs like `notifications`
config-examples--notify =
  `{$p}config notify on`
  Enables DM notifications for suggestions in this server

  `{$p}config notify off`
  Disables DM notifications for suggestions in this server

# Name of the Clean Commands config element
config-name--clearcommands = Clean Commands

# Description of the Clean Commands config element
config-desc--clearcommands = This setting controls whether or not some commands and the response are removed after a few seconds. This is useful for keeping your channels clean!

# Examples for the Clean Commands config element
# Make sure to keep original formatting and not translate actual inputs like `cleancommands`
config-examples--clearcommands =
  `{$p}config cleancommands on`
  Enables cleaning of commands

  `{$p}config cleancommands off`
  Disables cleaning of commands

# Name of the Voting on Own Suggestions config element
config-name--selfvote = Voting on Own Suggestions

# Description of the Voting on Own Suggestions config element
config-desc--selfvote = This setting controls whether or not the user who made a suggestion can vote on their own suggestion when it has been approved.

# Examples for the Voting on Own Suggestions config element
# Make sure to keep original formatting and not translate actual inputs like `selfvote`
config-examples--selfvote =
  `{$p}config selfvote on`
  Allows suggestion authors to vote on their own suggestions

  `{$p}config selfvote off`
  Prevents suggestion authors from voting on their own suggestions

# Name of the Multiple Reaction Voting config element
config-name--onevote = Multiple Reaction Voting

# Description of the Multiple Reaction Voting config element
config-desc--onevote = This setting controls whether or not users can choose multiple voting options on a suggestion (For example, both upvote and downvote).

# Examples for the Multiple Reaction Voting config element
# Make sure to keep original formatting and not translate actual inputs like `onevote`
config-examples--onevote =
  `{$p}config onevote on`
  Allows users to choose only one option when voting

  `{$p}config onevote off`
  Allows users to choose multiple options when voting

# Name of the In-Suggestions Channel Suggestion Submission config element
config-name--inchannelsuggestions = In-Suggestions Channel Suggestion Submission

# Description of the In-Suggestions Channel Suggestion Submission config element
config-desc--inchannelsuggestions = This setting controls whether or not users can submit suggestions via sending a message in the suggestions feed channel.

# Examples for the In-Suggestions Channel Suggestion Submission config element
# Make sure to keep original formatting and not translate actual inputs like `inchannelsuggestions`
config-examples--inchannelsuggestions =
  `{$p}config inchannelsuggestions on`
  Allows users to submit suggestions via any message in the suggestions feed channel

  `{$p}config inchannelsuggestions off`
  Prevents users from submitting suggestions via any message in the suggestions feed channel

# Name of the Color Change config element
config-name--colorchange = Color Change

# Description of the Color Change config element
config-desc--colorchange = This setting controls the color of the suggestion embed changing based on the number of net upvotes. You can customize the color, and the number of net upvotes necessary to change the color!

# Examples for the Color Change config element
# Make sure to keep original formatting and not translate actual inputs like `colorchange`
config-examples--colorchange =
  `{$p}config colorchange color gold`
  Sets the color to change the embed to `gold`. This element supports hex colors, CSS colors, and more!

  `{$p}config colorchange number 5`
  Sets the number of net upvotes to change the embed color to `5`.

# Name of the Locale config element
config-name--locale = Locale

# Description of the Locale config element
config-desc--locale = The language the bot will respond in. If a user has a locale configured via the `locale` command, the bot will respond to them in their preferred language. If they don't, the bot will respond in the language configured here.

# Examples for the Locale config element
# Make sure to keep original formatting and not translate actual inputs like `locale`
config-examples--locale =
  `{$p}config locale en`
  Sets the server language to English.

# Name of the Suggestion Cooldown config element
config-name--cooldown = Suggestion Cooldown

# Description of the Suggestion Cooldown config element
config-desc--cooldown = The time users must wait between submitting suggestions

# Examples for the Suggestion Cooldown config element
# Make sure to keep original formatting and not translate actual inputs like `admin`
config-examples--cooldown =
  `{$p}config cooldown 5m`
  Sets the suggestion cooldown time to 5 minutes.

  `{$p}config cooldown 1 hour`
  Sets the suggestion cooldown time to 1 hour.

  `{$p}config cooldown 0`
  Removes the suggestion cooldown time

# Name of the Trello config element
config-name--trello = Trello

# Description of the Trello config element
config-desc--trello = Settings for the Suggester Trello integration

# Examples for the Trello config element
# Make sure to keep original formatting and not translate actual inputs like `trello`
config-examples--trello =
  `{$p}config trello board https://trello.com/b/oCArLTyk/test`
  Connects a Trello board to the bot (`@suggester_bot` must be a board member on Trello)

  `{$p}config trello board none`
  Removes the connected Trello board

  `{$p}config trello actions suggest List 1`
  Configures that submitted suggestions should be added to list **List 1**

  `{$p}config trello actions approve list List 2`
  Configures that approved suggestions (review mode only) are added to list **List 2**

  `{$p}config trello actions implemented label Finished`
  Configures that suggestions marked as implemented are given label **Finished**

  `{$p}config trello actions deny delete`
  Configures that denied suggestions are removed from the Trello board

  `{$p}config trello actions delete archive`
  Configures that deleted suggestions are archived on the Trello board

  `{$p}config trello actions working none`
  Removes any configured actions for suggestions marked as in progress

# Notification when a user upvotes a suggestion and automatically follows it (only for the first follow)
#   suggestion - The suggestion ID
#   server - The server name
#   prefix - The server prefix
autofollow-first-notif =
  You just upvoted suggestion #{$suggestion} in **{$server}**. By default, you're now following this suggestion. This means that if an update is made to the suggestion you will receive a DM. Use `{$prefix}unfollow {$suggestion}` in {$server} to unfollow the suggestion, and `{$prefix}unfollow auto` to disable automatic following.
  _You will only receive this message once_

# Shown when no parameters or specified for the follow command
follow-no-params-error = You must specify `list`, `auto` or a suggestion ID.

# Success message when you follow a suggestion
#   id - The suggestion ID
follow-success = You are now following suggestion #{$id}

# Success message when you unfollow a suggestion
#   id - The suggestion ID
unfollow-success = You are no longer following suggestion #{$id}

# Error message when you are already following a suggestion
#   id - The suggestion ID
already-following-error = You are already following suggestion #{$id}

# Error message when you are not following a suggestion
#   id - The suggestion ID
not-following-error = You are not following suggestion #{$id}

# Title for the followed suggestions embed
following-title = Followed Suggestions:

# Message shown when you are not following any suggestions
none-followed = You are not following any suggestions

# Description for the follow command
command-desc--follow = Views/edits your following settings

# Description for the follow command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--follow = follow [suggestion id|list|auto] (on|off|toggle)

# Examples for the follow command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--follow =
  `{$p}follow 123`
  Follows suggestion #123

  `{$p}follow list`
  Lists the suggestions you are following

  `{$p}follow auto on`
  Enables following suggestions when you upvote them

  `{$p}follow auto off`
  Disables following suggestions when you upvote them

  `{$p}follow auto toggle`
  Toggles following suggestions when you upvote them

# Description for the unfollow command
command-desc--unfollow = Unfollows a suggestion

# Description for the unfollow command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--unfollow = unfollow [suggestion id]

# Examples for the unfollow command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--unfollow =
  `{$p}unfollow 123`
  Unfollows suggestion #123

# Comment title for the log embed
comment-title-log = Comment

# Error message shown when a channel is already a commands channel
cfg-commands-already-added-error = This channel has already been added as a commands channel!

# Error message shown when a channel is not a commands channel
cfg-commands-not-added-error = This channel has not been added as a commands channel!

# Error message shown when a channel is already a disabled channel
cfg-disabled-chnl-already-added-error = This channel has already been disabled!

# Error message shown when a channel is not a disabled channel
cfg-disabled-chnl-not-added-error = This channel has not been added as a disabled channel!

# Error message shown when a command is already disabled
cfg-disabled-commands-already-added-error = This command has already been disabled!

# Error message shown when a command is not disabled
cfg-disabled-commands-not-added-error = This command is not currently disabled!

# Success message when a command is disabled
#   command - The command name
cfg-disabled-cmd-added = The `{$command}` command is now disabled

# Success message when a command is enabled
#   command - The command name
cfg-disabled-cmd-removed = The `{$command}` command is no longer disabled

# Describes something that is not available
unavailable = Unavailable

# Shows information about the time filter in the top command
#   time - The amount of time to filter by
top-time-info = Search limited to suggestions {$time} old or newer

# Shows the link to Suggester's GitHub repository
#   link - The link to the repository
github-repo = You can find Suggester's GitHub repository at {$link}

# Shows the link to Suggester's privacy policy and security information
#   link - The link to the information
privacy-info = You can find Suggester's privacy policy and security information at {$link}

# Shows the configured prefix
#   prefix - The configured prefix
#   id - The bot's ID for the mention
server-prefix = My prefix is `{$prefix}`, you can also just mention the bot like "<@{$id}> help"

# The reason for a duplicate suggestion in the dupe command
#   link - The link to the suggestion
#   id - The suggestion ID of the original suggestion
dupe-reason = Duplicate of suggestion [#{$id}]({$link})

# The reason for a duplicate suggestion in the dupe command when the suggestion is denied
#   id - The suggestion ID of the original suggestion
dupe-reason-denied = Duplicate of suggestion #{$id}, which has been denied.

# The reason for a duplicate suggestion in the dupe command when the suggestion is denied and there's enough space for the reason
#   id - The suggestion ID of the original suggestion
#   reason - The reason the original suggestion was denied
dupe-reason-denied-with-reason =
  Duplicate of suggestion #{$id}, which has been denied with the following reason:
  {$reason}

# The reason for a duplicate suggestion in the dupe command when the suggestion is implemented
#   id - The suggestion ID of the original suggestion
dupe-reason-implemented = Duplicate of suggestion #{$id}, which has been implemented.

# The reason for a duplicate suggestion in the dupe command when the suggestion is awaiting review
#   id - The suggestion ID of the original suggestion
dupe-reason-review = Duplicate of suggestion #{$id}, which is currently awaiting review.

# Error shown when a suggestion ID provided in the dupe command for the original suggestion is invalid
dupe-original-invalid-error = You must provide a valid suggestion ID for the original suggestion

# Shows the suggestion cooldown time in the config command
#   time - undefined
cfg-cooldown-info = The suggestion cooldown time is currently set to **{$time}**

# Shows the suggestion cooldown time in the config command when none is set
cfg-cooldown-none = There is no suggestion cooldown time set.

# Success message when the suggestion cooldown time is set
#   time - undefined
cfg-cooldown-set = The suggestion cooldown time is now **{$time}**

# Error shown when the value specified for the suggestion cooldown is invalid
cfg-cooldown-bad-value = You must specify a value that can be interpreted as a time and is greater than or equal to 0

# Error shown when a user attempts to submit a suggestion and their cooldown has not ended
#   time - undefined
custom-cooldown-flag = You must wait {$time} before submitting another suggestion

# Error shown when no user is speciied for the exempt command
exempt-no-args-error = You must specify a user to exempt

# Error shown when a user tries to exempt a bot
exempt-user-bot-error = This user is a bot, and therefore cannot submit suggestions

# Error shown when a user tries to exempt a user who is not a member of the current server
exempt-user-not-member-error = This user is not a member of this server

# Success message when a user is exempted in a guild
#   user - The user tag
#   id - The user ID
exempt-success = **{$user}** (`{$id}`) has been exempted from the suggestion cooldown. Next time they submit a suggestion they won't be affected by the configured cooldown. **This only applies to one suggestion, if they need exempted again you'll need to re-run this command.**

# Title of the log embed when a user is exempted
#   user - The exempted user's tag
#   staff - The staff member's tag
exempt-log-title = {$staff} exempted {$user} from the suggestion cooldown

# Error shown when a user has already been exempted from the suggestion cooldown
exempt-already-error = This user has already been exempted from the suggestion cooldown

# Error shown when a user attempts to edit a suggestion that is not their's
edit-not-author-error = You can only edit your own suggestions

# Error shown when no suggestion edit is pending review
no-pending-edit-error = This suggestion has no pending edit.

# Title for the DM notification of a suggestion edit being approved
#   server - The name of the server the command was run in
edit-approve-dm-title = Your suggestion edit was approved in **{$server}**!

# Title for the DM notification of a suggestion being edited on a suggestion followed
#   server - The name of the server the command was run in
edit-approve-dm-title-follow = A suggestion you follow was edited in **{$server}**!

# Title for the DM notification of a suggestion edit being denied
#   server - The name of the server the command was run in
edit-deny-dm-title = Your suggestion edit was denied in **{$server}**!

# Title in the log embed when a suggestion edit is denied
#   user - A user tag
#   id - The suggestion ID
log-edit-deny-title = {$user} denied a suggestion edit on #{$id}

# Title for the DM notification of a suggestion being admin-edited
#   server - The name of the server the command was run in
suggestion-edit-dm-title = Your suggestion was edited in **{$server}**!

# Title for the DM notification of a followed suggestion being admin-edited
#   server - The name of the server the command was run in
suggestion-edit-dm-title-follow = A suggestion you follow was edited in **{$server}**!

# Response when the user who edits is the suggester
suggestion-updated-self = Your suggestion has been updated!

# Response when the user who edits is not the suggester
suggestion-updated-not-self = The suggestion has been updated!

# Response when the suggestion has already been approved and the user edits it
suggestion-updated-review = Your suggestion edit has been submitted for review!

# Description for the privacy command
command-desc--privacy = Shows the link to Suggester's Privacy Policy

# Usage for the privacy command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--privacy = privacy

# Description for the edit command
command-desc--edit = Edits a suggestion

# Description for the edit command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--edit = edit [suggestion id] [new content]

# Examples for the edit command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--edit =
  `{$p}edit 1234 This is an edit suggestion`
  Edits suggestion #1234 to have the content of "This is an edit suggestion"

# Description for the approveedit command
command-desc--approveedit = Approves a pending suggestion edit

# Description for the approveedit command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--approveedit = approveedit [suggestion id]

# Examples for the approveedit command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--approveedit =
  `{$p}approveedit 123`
  Approves a pending edit on suggestion #123

# Description for the denyedit command
command-desc--denyedit = Denies a pending suggestion edit

# Description for the denyedit command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--denyedit = denyedit [suggestion id]

# Examples for the denyedit command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--denyedit =
  `{$p}denyedit 123`
  Denies a pending edit on suggestion #123

# Description for the shortinfo command
command-desc--sinfo = Shows information about a suggestion in a concise manner

# Usage for the shortinfo command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--sinfo = shortinfo [suggestion id]

# Examples for the shortinfo command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--sinfo =
  `{$p}shortinfo 1`
  Shows information about suggestion #1

  `{$p}shortinfo 1 -trim-suggest`
  Shows information about suggestion #1 limiting the suggestion content to 250 characters

  `{$p}shortinfo 1 -no-attach`
  Shows information about suggestion #1 without showing the added attachment

# Name of the Implemented Suggestion Role config element
config-name--implementedrole = Implemented Suggestion Role

# Description of the Implemented Suggestion Role config element
config-desc--implementedrole = The role that is given to members that have a suggestion marked as implemented.

# Examples for the Implemented Suggestion Role config element
# Make sure to keep original formatting and not translate actual inputs like `implementedrole`
config-examples--implementedrole =
  `{$p}config implementedrole Implemented Suggester`
  Sets the "Implemented Suggester" as the role given when a member has their suggestion marked as implemented

  `{$p}config implementedrole none`
  Resets the role given when a member has their suggestion marked as implemented, meaning no role will be given

# Name of the Automatic Following config element
config-name--autofollow = Automatic Following

# Description of the Automatic Following config element
config-desc--autofollow = This setting controls whether or not users will follow suggestions upon upvoting them, meaning they will receive a DM when the suggestion is updated

# Examples for the Automatic Following config element
# Make sure to keep original formatting and not translate actual inputs like `autofollow`
config-examples--autofollow =
  `{$p}config autofollow on`
  Enables auto-following for suggestions in this server

  `{$p}config autofollow off`
  Disables auto-following for suggestions in this server

# Description for the editcomment command
command-desc--editcomment = Edits a comment on a suggestion

# Usage for the editcomment command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--editcomment = editcomment [comment id] [new content]

# Examples for the editcomment command
# **Leave** `{$p}` **as-is, it is replaced in the help command.**
command-examples--editcomment =
  `{$p}editcomment 27_1 This is new content`
  Edits a comment with the ID `27_1` to read "This is new content"

# String when no reason is provided
no-reason = No reason provided

# Success message when a user is beaned
#   user - The user tag
#   id - The user ID
bean-success = Beaned **{$user}** (`{$id}`)

# DM message for a bean
#   guild - The guild name
bean-dm = **You have been beaned from {$guild}**

# Success message when a user is megabeaned
#   user - The user tag
#   id - The user ID
megabean-success = Megabeaned **{$user}** (`{$id}`)

# DM message for a megabean
#   guild - The guild name
megabean-dm = **You have been megabeaned from {$guild}**

# Success message when a user is nukebeaned
#   user - The user tag
#   id - The user ID
nukebean-success = Nukebeaned **{$user}** (`{$id}`)

# DM message for a nukebean
#   guild - The guild name
nukebean-dm = **You have been nukebeaned from {$guild}**

# Success message when a user is hypernukebeaned
#   user - The user tag
#   id - The user ID
hypernukebean-success = Hypernukebeaned **{$user}** (`{$id}`)

# DM message for a hypernukebean
#   guild - The guild name
hypernukebean-dm = **You have been hypernukebeaned from {$guild}**

# Description for the bean command
command-desc--bean = Beans a user

# Usage for the bean command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--bean = bean [user]

# Description for the megabean command
command-desc--megabean = Megabeans a user

# Usage for the megabean command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--megabean = megabean [user]

# Description for the nukebean command
command-desc--nukebean = Nukebeans a user

# Usage for the nukebean command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--nukebean = nukebean [user]

# Description for the hypernukebean command
command-desc--hypernukebean = Hypernukebeans a user

# Usage for the hypernukebean command
# **Translate the names of arguments (ex. "suggestion id"), don't translate actual arguments that are input into the bot (ex. "on", "off", "toggle")**
command-usage--hypernukebean = hypernukebean [user]

# Error shown when a user has not specified a valid Trello board link
no-board-specified-error = You must specify a valid link to a Trello board

# Error shown when a user has not specified a Trello board link the bot can access
invalid-board-specified-error = The board you specified could not be found. Make sure `@suggester_bot` has been added as a board member.

# Success message when the trello board is reset
trello-board-reset-success = Successfully reset the configured Trello board

# Success message when the Trello board is set
#   code - undefined
trello-board-set-success = Successfully set the Trello board to https://trello.com/b/{$code}

# Error when there is no Trello board set and a user tries to configure actions
no-trello-board-set-error = You must have a Trello board configured to configure actions

# Error shown when a user does not provide a valid list name for configuring Trello
#   code - undefined
no-list-name-error = You must provide the name of a list on the Trello board <https://trello.com/b/{$code}>

# Error shown when a user does not provide a valid label name for configuring Trello
#   code - undefined
no-label-name-error = You must provide the name of a label on the Trello board <https://trello.com/b/{$code}>

# Success message when the submitted suggestions list is reset
suggest-list-reset-success = Submitted suggestions will no longer be posted to the Trello board

# Success message shown when a user configures a list for submitted suggestions on Trello
#   list - undefined
suggest-list-set-success = All submitted suggestions will be sent to the **{$list}** list on Trello

# Information for the Trello card description
#   user - undefined
#   id - undefined
#   sid - undefined
suggestion-trello-info =
  Submitted by {$user} ({$id})
  Suggestion ID: {$sid}

# Shows where submitted suggestions are added on trello
#   list - undefined
trello-config-suggest = All submitted suggestions are added to list **{$list}**

# Shows where submitted suggestions are added on trello if not configured
trello-config-suggest-none = Submitted suggestions are not added to Trello

# Shown when an action specified is invalid
#   list - undefined
trello-invalid-action-error = That is an invalid action. You can configure the following actions: {$list}

# Shows that suggestions approved will be deleted
trello-action-approve-delete = Suggestions that are approved will be deleted from the Trello board

# Shows that suggestions approved will be archived
trello-action-approve-archive = Suggestions that are approved will be archived on the Trello board

# Shows that suggestions approved will be moved to a list
#   list - The list name
trello-action-approve-list = Suggestions that are approved will be moved to the **{$list}** list on the Trello board

# Shows that suggestions approved will be moved to a list
#   label - The label name
trello-action-approve-label = Suggestions that are approved will be given the **{$label}** label on the Trello board

# Shows that suggestions denied will be deleted
trello-action-deny-delete = Suggestions that are denied will be deleted from the Trello board

# Shows that suggestions denied will be archived
trello-action-deny-archive = Suggestions that are denied will be archived on the Trello board

# Shows that suggestions denied will be moved to a list
#   list - The list name
trello-action-deny-list = Suggestions that are denied will be moved to the **{$list}** list on the Trello board

# Shows that suggestions denied will be moved to a list
#   label - The label name
trello-action-deny-label = Suggestions that are denied will be given the **{$label}** label on the Trello board

# Shows that suggestions deleted will be deleted
trello-action-delete-delete = Suggestions that are deleted will be deleted from the Trello board

# Shows that suggestions deleted will be archived
trello-action-delete-archive = Suggestions that are deleted will be archived on the Trello board

# Shows that suggestions deleted will be moved to a list
#   list - The list name
trello-action-delete-list = Suggestions that are deleted will be moved to the **{$list}** list on the Trello board

# Shows that suggestions deleted will be moved to a list
#   label - The label name
trello-action-delete-label = Suggestions that are deleted will be given the **{$label}** label on the Trello board

# Shows that suggestions marked as implemented will be deleted
trello-action-implemented-delete = Suggestions that are marked as implemented will be deleted from the Trello board

# Shows that suggestions marked as implemented will be archived
trello-action-implemented-archive = Suggestions that are marked as implemented will be archived on the Trello board

# Shows that suggestions marked as implemented will be moved to a list
#   list - The list name
trello-action-implemented-list = Suggestions that are marked as implemented will be moved to the **{$list}** list on the Trello board

# Shows that suggestions marked as implemented will be moved to a list
#   label - The label name
trello-action-implemented-label = Suggestions that are marked as implemented will be given the **{$label}** label on the Trello board

# Shows that suggestions marked as in consideration will be deleted
trello-action-consider-delete = Suggestions that are marked as in consideration will be deleted from the Trello board

# Shows that suggestions marked as in consideration will be archived
trello-action-consider-archive = Suggestions that are marked as in consideration will be archived on the Trello board

# Shows that suggestions marked as in consideration will be moved to a list
#   list - The list name
trello-action-consider-list = Suggestions that are marked as in consideration will be moved to the **{$list}** list on the Trello board

# Shows that suggestions marked as in consideration will be moved to a list
#   label - The label name
trello-action-consider-label = Suggestions that are marked as in consideration will be given the **{$label}** label on the Trello board

# Shows that suggestions marked as in progress will be deleted
trello-action-progress-delete = Suggestions that are marked as in progress will be deleted from the Trello board

# Shows that suggestions marked as in progress will be archived
trello-action-progress-archive = Suggestions that are marked as in progress will be archived on the Trello board

# Shows that suggestions marked as in progress will be moved to a list
#   list - The list name
trello-action-progress-list = Suggestions that are marked as in progress will be moved to the **{$list}** list on the Trello board

# Shows that suggestions marked as in progress will be moved to a list
#   label - The label name
trello-action-progress-label = Suggestions that are marked as in progress will be given the **{$label}** label on the Trello board

# Shows that suggestions marked as not happening will be deleted
trello-action-nothappening-delete = Suggestions that are marked as not happening will be deleted from the Trello board

# Shows that suggestions marked as not happening will be archived
trello-action-nothappening-archive = Suggestions that are marked as not happening will be archived on the Trello board

# Shows that suggestions marked as not happening will be moved to a list
#   list - The list name
trello-action-nothappening-list = Suggestions that are marked as not happening will be moved to the **{$list}** list on the Trello board

# Shows that suggestions marked as not happening will be moved to a list
#   label - The label name
trello-action-nothappening-label = Suggestions that are marked as not happening will be given the **{$label}** label on the Trello board

# Shows that suggestions upvoted past the color change threshold will be deleted
trello-action-colorchange-delete = Suggestions that are upvoted past the color change threshold will be deleted from the Trello board

# Shows that suggestions upvoted past the color change threshold will be archived
trello-action-colorchange-archive = Suggestions that are upvoted past the color change threshold will be archived on the Trello board

# Shows that suggestions upvoted past the color change threshold will be moved to a list
#   list - The list name
trello-action-colorchange-list = Suggestions that are upvoted past the color change threshold will be moved to the **{$list}** list on the Trello board

# Shows that suggestions upvoted past the color change threshold will be moved to a list
#   label - The label name
trello-action-colorchange-label = Suggestions that are upvoted past the color change threshold will be given the **{$label}** label on the Trello board

# Shows that suggestions approved will not be taken action on
trello-action-approve-none = No Trello action will be taken on suggestions that are approved

# Shows that suggestions denied will not be taken action on
trello-action-deny-none = No Trello action will be taken on suggestions that are denied

# Shows that suggestions deleted will not be taken action on
trello-action-delete-none = No Trello action will be taken on suggestions that are deleted

# Shows that suggestions marked as implemented will not be taken action on
trello-action-implemented-none = No Trello action will be taken on suggestions that are marked as implemented

# Shows that suggestions marked as in consideration will not be taken action on
trello-action-consider-none = No Trello action will be taken on suggestions that are marked as in consideration

# Shows that suggestions marked as in progress will not be taken action on
trello-action-progress-none = No Trello action will be taken on suggestions that are marked as in progress

# Shows that suggestions marked as not happening will not be taken action on
trello-action-nothappening-none = No Trello action will be taken on suggestions that are marked as not happening

# Shows that suggestions upvoted past the color change threshold will not be taken action on
trello-action-colorchange-none = No Trello action will be taken on suggestions that are upvoted past the color change threshold

# Shows when no Trello actions are set
trello-no-actions-configured = No Trello actions are configured

# Shows the linked trello board, **do not translate `config trello actions` as that is a bot command**
#   code - The trello board code
#   p - The server prefix
trello-base-config =
  {"**"}Linked Trello Board:** {$code}
  Use `{$p}config trello actions` to view configured actions

# Error when a user specifies none or an invalid parameter for Trello config
cfg-trello-invalid-param = You must specify `board` or `action`

# Shows the suggestion cap in the config command
#   cap - The configured cap
cfg-cap-info = The suggestion cap is currently set to **{$cap}** suggestions

# Shows the suggestion cap in the config command when none is set
cfg-cap-none = There is no suggestion cap set.

# Success message when the suggestion cap is set
#   cap - The time the cap is set to
cfg-cap-set = The suggestion cap is now **{$cap}** suggestions

# Name of the Suggestion Cap config element
config-name--cap = Suggestion Cap

# Description of the Suggestion Cap config element
config-desc--cap = The maximum number of approved (not denied or implemented) suggestions there can be at any given time. When the cap is reached, no new suggestions can be submitted

# Examples for the Suggestion Cap config element
# Make sure to keep original formatting and not translate actual inputs like `autofollow`
config-examples--cap =
  `{$p}config cap 50`
  Sets the suggestion cap to 50

  `{$p}config cap none`
  Removes the suggestion cap

# Error shown when a server's cap limit has been reached
#   cap - The configured cap
cap-reached-error = This server has reached the configured cap of {$cap} approved suggestions. New suggestions cannot be submitted until some existing suggestions are cleared.

# The name of the category created for suggestions channels in autosetup
autosetup-category = Suggester

# The name of the channel created for approved suggestions in autosetup
# **As this is a channel name, make sure there are no spaces**
autosetup-suggestions = suggestions

# The name of the channel created for denied suggestions in autosetup
# **As this is a channel name, make sure there are no spaces**
autosetup-denied = denied-suggestions

# The name of the channel created for suggestion review in autosetup
# **As this is a channel name, make sure there are no spaces**
autosetup-review = suggestion-review

# The name of the channel created for suggestion logs in autosetup
# **As this is a channel name, make sure there are no spaces**
autosetup-log = suggestion-log

# Name of the Comment Timestamps config element
config-name--commenttimestamps = Comment Timestamps

# Description of the Comment Timestamps config element
config-desc--commenttimestamps = This setting controls whether or not timestamps are shown for comments in the suggestion embed

# Examples for the Comment Timestamps config element
# Make sure to keep original formatting and not translate actual inputs like `autofollow`
config-examples--commenttimestamps =
  `{$p}config commenttime on`
  Enables comment timestamps on suggestion embeds

  `{$p}config commenttime off`
  Disables comment timestamps on suggestion embeds

# Name of the Live Vote Count config element
config-name--votecount = Live Vote Count

# Description of the Live Vote Count config element
config-desc--votecount = This setting controls whether or not the live vote count is shown on the suggestion embed

# Examples for the Live Vote Count config element
# Make sure to keep original formatting and not translate actual inputs like `autofollow`
config-examples--votecount =
  `{$p}config votecount on`
  Enables live vote counts on suggestion embeds

  `{$p}config votecount off`
  Disables live vote counts on suggestion embeds

# Name of the Anonymous Suggestions config element
config-name--anonymous = Anonymous Suggestions

# Description of the Anonymous Suggestions config element
config-desc--anonymous = This setting controls whether or not users can submit anonymous suggestions.

# Examples for the Anonymous Suggestions config element
# Make sure to keep original formatting and not translate actual inputs like `autofollow`
config-examples--anonymous =
  `{$p}config anonymous on`
  Enables the ability to submit anonymous suggestions

  `{$p}config anonymous off`
  Disables the ability to submit anonymous suggestion

# Title for anonymous suggestions
anon-suggestion = Anonymous Suggestion

# Disclaimer for anonymous suggestions upon submission
anon-suggestion-disclaimer-submit = _This suggestion will be publicly shown as anonymous, but server staff will still be able to view your identity for moderation purposes._

# Notice for staff that the suggestion is anonymous
anon-suggestion-staff-notice = :warning: This suggestion is anonymous

# Notice shown when a user runs the regular asuggest command
anon-suggest-slash-notice =
  Anonymous suggestions are handled through **slash commands**. To use anonymous suggestions, head to the server you'd like to submit a suggestion on and type `/`. You should see a menu open that contains `/asuggest`, and selecting that will allow you to submit an anonymous suggestion.
  If you don't see the commands listed: Ask a server administrator to re-invite the bot with the link below to grant it permission to show slash commands

# Error shown when shards are still being spawned
shards-not-spawned = Shards are still being spawned

# Detailed shard information for the shard command
#   servers - The shard's server count
#   channels - The shard's channel count
#   users - The shard's user count
#   memory - The shard's memory usage
#   api - The shard's API ping
shards-detail =
  Servers: {$servers}
  Channels: {$channels}
  Users: {$users}
  Memory: {$memory} MB
  API: {$api} ms

# Error shown when a user attempts to take action on a denied suggestion
suggestion-denied-error = This action cannot be taken on denied suggestions.

# Success message when all emojis are reset
cfg-emojis-reset-all-success = All reaction emojis have been reset to their default settings

# Error shown when a user attempts to set a cooldown that is below the global cooldown
#   p - The server's prefix
#   global - The global cooldown
cfg-cooldown-value-below-global = The specified cooldown time is smaller than the global cooldown for the `{$p}suggest` command. You must set a value greater than {$global}.

# Error shown when an invalid query is provided for the search command
search-bad-query-error = Please make sure you specify a valid query

# Shown when a suggestion does not have a message link to show in search directing them to the info comand
#   p - The server's prefix
#   id - The suggestion ID
no-link-search = Use `{$p}info {$id}` for info

# Header for the search embed
#   min - undefined
#   max - undefined
#   total - undefined
search-title = Found {$total} Suggestions (showing {$min}-{$max} of {$total})

# Shown when a user attempts to use deny and the mode is set to autoapprove
#   command - The command the user should use (delete, silentdelete, or massdelete)
deny-autoapprove-delete-redirect = If you're trying to remove a suggestion, use the `{$command}` command

# Shows the list of disabled commands
#   num - The number of disabled commands
#   commands - The list of disabled commands
cfg-disabled-cmds-list =
  {$num} command(s) are disabled
  {"**"}List:** {$commands}

# Name of the Disabled Commands config element
config-name--disabledcommands = Disabled Commands

# Description of the Disabled Commands config element
config-desc--disabledcommands = This setting controls what commands are disabled on this server

# Examples for the Disabled Commands config element
# Make sure to keep original formatting and not translate actual inputs like `autofollow`
config-examples--disabledcommands =
  `{$p}config disabledcommands add shard`
  Disables the `shard` command on this server

  `{$p}config disabledcommands remove shard`
  Enables the `shard` command on this server

  `{$p}config disabledcommands list`
  Lists disabled commands

# Name of the Disabled Channels config element
config-name--disabledchannels = Disabled Channels

# Description of the Disabled Channels config element
config-desc--disabledchannels = This setting controls channels where the bot will not respond to any commands

# Examples for the Disabled Channels config element
# Make sure to keep original formatting and not translate actual inputs like `autofollow`
config-examples--disabledchannels =
  `{$p}config disabledchannels add #chat`
  Disables all commands in the #chat channel

  `{$p}config disabledchannels remove 567385190196969493`
  Removes the 567385190196969493 channel from the list of disabled channels

  `{$p}config disabledchannels list`
  Lists the configured disabled channels

# Error shown when a command cannot be disabled
cfg-disabled-cmd-error = This command cannot be disabled

# Error shown when a user is blocked and tries to use a slash command
user-blocked-slash-response = You are currently blocked from using the bot.
