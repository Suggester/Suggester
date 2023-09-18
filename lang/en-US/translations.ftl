### ---- ERRORS -----
err_bot-unusable = {-emojis_error} This bot cannot be used in this server.
err_bot-not-public = {-emojis_error} This bot cannot be invited to another server
err_generic = {-emojis_error} Something went wrong.
err_not-approved = You can only perform this action on approved suggestions.

unknown-feed = {-emojis_error} Could not find that feed. Double check your spelling and try again, or create a new feed by running {$cmd}.

unknown-suggestion = {-emojis_error} I was unable to find that suggestion

### ----- UTIL -----
pagination-page-count = Page {$current}/{$total}

feed-mode = {$mode ->
        [REVIEW] Review
        *[AUTOAPPROVE] Automatic Approval
    }

display-status = {$status ->
        *[Default] Default
        [Considering] Considering
        [InProgress] In Progress
        [Implemented] Implemented
        [NotHappening] Not Happening
    }

### ----- COMMAND RESPONSES -----

## /ping
cmd-ping =
    .name = ping
    .desc = Checks bot response time and shows information
ping-original = {-emojis_ping-pong} Pong!
ping-edited = {-emojis_ping-pong} Pong! Message sent in `{$ms}ms`

## /github
cmd-github =
    .name = github
    .desc = Shows the link to Suggester's GitHub repository
github-repo = You can find Suggester's GitHub repository at {$link}

## /invite
cmd-invite =
    .name = invite
    .desc = Shows the link to invite the bot
invite-bot = You can invite {$name} to your server with this link: {$link}
invite-restricted = This bot cannot be invited publicly. You can invite the public version with this link: {$link}

## /privacy
cmd-privacy =
    .name = privacy
    .desc = Shows the link to Suggester's Privacy Policy
privacy-info = You can find Suggester's privacy policy and security information at {$link}

## /support
cmd-support =
    .name = support
    .desc = Shows the link to the support server
support-invite = Need help with the bot? Join our support server at {$link} 😉

## /suggest
cmd-suggest =
    .name = suggest
    .desc = Submits a suggestion

suggestion-embed =
    .title = Suggestion from {$user}
    .title-anon = Anonymous Suggestion

    .edited-by = Edited by {$editor}
    .suggestion-id = ID: {$id}
    .submitted-at = Submitted at

    .public-status = Public Status

    .command-header = Comment from {$user}
    .command-header-anon = Staff Comment

    .votes-header = Votes
    .votes-opinion = Opinion: {$opinion}
    .votes-up = Upvotes: {$upvotes} {$percentage}
    .votes-down = Downvotes: {$downvotes} {$percentage}

review-embed =
    .header = {$user} (ID: {$id})

    .title-new = Suggestion Awaiting Review (#{$id})
    .title-approved = Suggestion Approved (#{$id})
    .title-denied = Suggestion Denied (#{$id})

    .anon-staff-notice = {-emojis_warning} This suggestion is anonymous
    .attachment-header = With Attachment

    .denied-by = Denied by {$user}
    .approved-by = Approved by {$user}

    .reason-given = Reason Given

suggest-anon-disallowed-error = {-emojis_error} Anonymous suggestions are disabled in this server

review-channel-not-set-error = {-emojis_error} This server does not have a review channel configured. Use {$cmd} to set one, and try again.

review-queue-buttons =
    .change-status = Change Status
    .approve = Approve
    .deny = Deny
    .delete = Delete

suggestion-displaystatus =
    .implemented = Implemented
    .working = Working
    .considering = Considering
    .nothappening = Not Happening
    .inprogress = In Progress

suggest-success =
    .autoapprove = :rocket: Suggestion submitted!
    .review = :rocket: Your suggestion has been submitted to the server staff for review!

    .link-button-label = View Suggestion

## /review
cmd-review =
    .name = review
    .desc = A collection of commands for managing the suggestion review queue

cmd-review-approve =
    .name = approve
    .desc = Approve a suggestion in the review queue

cmd-review-deny =
    .name = deny
    .desc = Deny a suggestion in the review queue

cmd-review-listqueue =
    .name = list-queue
    .desc = Lists the suggestions currently in the queue

cmd-review-mark =
    .name = set-status
    .desc = Change the status of a suggestion

mark-select =
    .placeholder = Suggestion Status

mark-success = {-emojis_success} Set the status of {$suggestion} to `{$status}`

review-approve-success = {-emojis_success} Approved suggestion `{$id}`
review-deny-success = {-emojis_success} Denied suggestion `{$id}`
not-in-queue-error = {-emojis_error} That suggestion has already been {$status ->
        [Approved] approved
       *[Denied] denied
    }

# ## /vote
# cmd-vote =
#     .name = vote
#     .desc = Help support the bot!
# vote-info =
#     You can vote for Suggester on various bot lists, which is a great way to support the bot! If you're in the Suggester support server (<{$link}>), you can get special rewards for voting 🤩
#     {BLOCK_QUOTE(UNDERLINE("Links to Vote:"), multiline: "true")}
#     {$links}

## /changelog
cmd-changelog =
    .name = changelog
    .desc = Shows the latest Suggester release

changelog-embed-header = Changelog: {$version}
changelog-released-footer = Changelog released at

## /feeds
cmd-feeds =
    .name = feeds
    .desc = Manage suggestion feeds

cmd-feeds-create =
    .name = create
    .desc = Create a new suggestion feed

cmd-feeds-delete =
    .name = delete
    .desc = Deletes a suggestion feed

feeds-delete-confirm-prompt = {-emojis_warning} Are you sure you want to delete the {INLINE_CODE($name)} feed? This action cannot be undone.
    .yes = Confirm
    .no = Cancel

feeds-delete-success = {-emojis_success} Deleted suggestion feed {INLINE_CODE($name)}

feeds-delete-cancel = {-emojis_success} Feed deletion cancelled

feeds-delete-unknown-feed = {-emojis_error} Could not find suggestion feed. Was it already deleted?

feed-create-success =
    {-emojis_success} Created a new feed {INLINE_CODE($name)} in {CHANNEL_MENTION($channel)}!
    {BLOCK_QUOTE("Use", $feedsEdit, "to further configure this feed.")}

feed-create-fail-generic = {-emojis_error} Failed to create suggestion feed

feed-create-fail-duplicate-name = {-emojis_error} You already have a suggestion feed named `{$name}`! Try giving it a different name.
feed-create-fail-duplicate-channel = {-emojis_error} You already have a suggestion feed in that channel

cmd-feeds-get =
    .name = get
    .desc = Shows a suggestion feed's configuration

feed-info-page-buttons =
    .overview = Overview
    .channels = Channels
    .roles = Roles
    .other = Other

feed-info-embed =
    .title = Feed Configuration for {$name}
    .footer = Internal Feed ID: {$id}

    .created = Created
    .last-updated = Last Updated

    .feed-channel = Feed Channel
    .review-channel = Review Channel
    .log-channel = Log Channel
    .denied-channel = Denied Suggestion Channel
    .implemented-channel = Implemented Suggestion Channel

    .review-ping-role = Review Ping Role
    .feed-ping-role = New Suggestion Ping Role
    .approved-role = Approved Suggestion Reward Role
    .implemented-role = Implemented Suggestion Reward Role

    .default = Default
    .mode = Mode

    .self-vote = Allow Voting on Own Suggestions
    .show-vote-count = Show Live Vote Count
    .command-alias = Suggest Command Alias
    .suggestion-cap = Suggestion Cap
    .annon-allowed = Anonymous Submissions Allowed
    .log-votes = Enable Vote Logging

    .header-vote-buttons = Vote Buttons

    .upvote = Upvote
    .mid = Mid
    .downvote = Downvote

    .header-color-change = Color Change

    .color-change-enabled = Enabled
    .color-change-threshold = Threshold
    .color-change-color = Color

    .header-notifications = Notifications

    .notify-author = Automatically Follow Own Suggestions
    .auto-subscribe = Automatically Subscribe on Interact

feed-info-button-error = {-emojis_error} Could not find any configuration for that feed. Was it deleted?

cmd-feeds-edit =
    .name = edit
    .desc = Edit a suggestion feed's configuration

cmd-feeds-edit-set =
    .name = set
    .desc = Set an option

feeds-edit-set-no-options-provided = {-emojis_error} You must specify at least one option.

feeds-edit-set-invalid-emoji = {-emojis_error} The emoji you provided for `{$opt}` is invalid. Make sure to only enclude the emoji and no other text.

feeds-edit-set-invalid-color =
    {-emojis_error} An invalid color code was provided. The color should be a hex code (6 digits, 0-9 A-F) and optionally starting with a `#`.
    > For help finding a color code, try using a color picker website like [this one](<https://htmlcolorcodes.com/color-picker>).

feeds-edit-set-success = {-emojis_success} Suggestion feed updated!

cmd-feeds-edit-unset =
    .name = unset
    .desc = Unset an option

cmd-error =
    .name = error
    .desc = Tests error stuff

## /vote
cmd-vote =
    .name = vote
    .desc = Vote on a suggestion!

cmd-vote-upvote =
    .name = upvote
    .desc = Upvote a suggestion

cmd-vote-mid =
    .name = neutral
    .desc = Shrug

cmd-vote-downvote =
    .name = downvote
    .desc = Downvote a suggestion

vote-success = {-emojis_success} Your {$kind} vote has been recorded.
vote-remove-success = {-emojis_success} {$kind} vote removed.

vote-error-type-disabled = {-emojis_error} Failed to record vote. This option is disabled.
vote-error-no-self-vote = {-emojis_error} You cannot vote on your own suggestion.
vote-error-no-feed = {-emojis_error} Cannot find that suggestion or the feed it belongs to.

## /attach
cmd-attachment =
    .name = attachments
    .desc = Manage suggestion attachments

cmd-attachment-add =
    .name = add
    .desc = Attaches a file to a suggestion

disallowed-attachment-type = {-emojis_error} You can only attach image files to suggestions!

too-many-attachments = {-emojis_error} There are already {$max} attachments on this suggestion.

only-attach-own-suggestions = {-emojis_error} You can only manage attachments on your own suggestions.

attachment-too-big = {-emojis_error} That attachment is too big!

attachment-added = {-emojis_success} Attachment added!

cmd-attachment-remove =
    .name = remove
    .desc = Removes an attachment from a suggestion

attachment-removed = {-emojis_success} Attachment removed

no-attachments = This suggestion doesn't have any attachments.

attachment-nr = Attachment #{$nr}

view-attachments-button =
    View {$nr} {$nr ->
        [one] Attachment
        *[many] Attachments
    }

## /suggestions

# TODO: better description for this
cmd-suggestions =
    .name = suggestions
    .desc = Manage your suggestions

cmd-suggestions-create =
    .name = create
    .desc = Alias for /{cmd-suggest.name} | {cmd-suggest.desc}

cmd-suggestions-delete =
    .name = delete
    .desc = Deletes a suggestion, removing it from the suggestions feed

cmd-suggestions-search =
    .name = search
    .desc = Searches suggestions on this server

cmd-suggestions-edit =
    .name = edit
    .desc = Edit a suggestion

cmd-suggestions-info =
    .name = info
    .desc = Shows information about a suggestion


### ----- OTHER RESPONSES -----

log-embed =
    .footer = Suggestion ID: {$suggestionID} | Author ID: {$authorID}

log-action =
    .SuggestionCreated = Suggestion Created
    .SuggestionApproved = Suggestion Approved
    .SuggestionDenied = Suggestion Denied

    .AttachmentAdded = Attachment Added
    .AttachmentRemoved = Attachment Removed

    .VoteAdded = {$emoji} Vote Added
    .VoteRemoved = {$emoji} Vote Removed
    .VoteChanged = {$old} Vote Changed to {$new}

    .DisplayStatusChanged = Suggestion Status Changed from `{$old}` to `{$new}`
