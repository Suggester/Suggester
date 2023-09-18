import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIChatInputApplicationCommandGuildInteraction,
  APIGuildInteraction,
  APIMessageComponentGuildInteraction,
  APIStringSelectComponent,
  APIUser,
  ApplicationCommandOptionType,
  ComponentType,
  MessageFlags,
  Routes,
} from 'discord-api-types/v10';

import {
  Suggestion,
  SuggestionApprovalStatus,
  SuggestionDisplayStatus,
  SuggestionFeed,
} from '@suggester/database';
import {Localizer, MessageNames} from '@suggester/i18n';
import {
  ApprovedDeniedSuggestionReviewQueueEmbed,
  Context,
  SubCommand,
  code,
  maskedLink,
} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../util/commandComponents';
import {updateFeedMessage} from '../attach';
import {updateQueueMessages} from './approveDeny';

// TODO: can I object.values SuggestionDisplayStatus for this
const suggestionStatuses = [
  SuggestionDisplayStatus.Default,
  SuggestionDisplayStatus.Considering,
  SuggestionDisplayStatus.InProgress,
  SuggestionDisplayStatus.Implemented,
  SuggestionDisplayStatus.NotHappening,
];

const options = [
  {
    name: 'suggestion',
    description: 'The ID of the suggestion to delete',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  {
    name: 'status',
    description: 'The new status',
    type: ApplicationCommandOptionType.String,
    required: true,
    choices: [
      {name: 'Default', value: SuggestionDisplayStatus.Default},
      {name: 'Considering', value: SuggestionDisplayStatus.Considering},
      {name: 'In Progress', value: SuggestionDisplayStatus.InProgress},
      {name: 'Implemented', value: SuggestionDisplayStatus.Implemented},
      {name: 'Not Happening', value: SuggestionDisplayStatus.NotHappening},
    ],
  },

  // TODO: figure out how this should work.
  // should it go in "Staff Comment" or its own field?
  {
    name: 'reason',
    description: 'The reason for changing the stauts',
    type: ApplicationCommandOptionType.String,
    required: false,
  },
  feedNameAutocomplete,
] as const;

const doAction = async <T extends APIGuildInteraction>(
  ctx: Context<T, typeof options>,
  _feed: string | number | undefined,
  sID: number,
  status: SuggestionDisplayStatus
) => {
  const l = ctx.getLocalizer();

  // FIXME: this is so bad but idk a better way to have it work for both command and select
  const feed = await (typeof _feed === 'number'
    ? ctx.db.getFeedByID(_feed)
    : ctx.db.getFeedByNameOrDefault(_feed));

  if (!feed) {
    const msg = l.user('unknown-feed', {
      cmd: ctx.framework.mentionCmd('review mark'),
    });

    await ctx.send({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const suggestion = await ctx.db.getFullSuggestionByPublicID(feed.id, sID);
  if (!suggestion) {
    await ctx.send({
      content: l.user('unknown-suggestion'),
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  if (suggestion.approvalStatus !== SuggestionApprovalStatus.Approved) {
    await ctx.send({
      content: l.user('err_not-approved'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (suggestion.displayStatus === status) {
    await ctx.send({
      content: `:white_check_mark: This suggestion already has status \`${suggestion.displayStatus}\``,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await ctx.db.updateSuggestion(suggestion.id, {
    displayStatus: status as SuggestionDisplayStatus,
  });

  const author = (await ctx.framework.rest.get(
    Routes.user(suggestion.authorID)
  )) as APIUser;

  suggestion.displayStatus = status;

  const newReviewEmbed = new ApprovedDeniedSuggestionReviewQueueEmbed(
    l,
    suggestion,
    author,
    // FIXME: this changes the user in the embed to the wrong user
    ctx.interaction.member.user
  );

  updateFeedMessage(ctx, suggestion, feed);

  updateQueueMessages(
    l,
    ctx.framework.rest,
    suggestion,
    feed,
    newReviewEmbed,
    true
  );

  ctx.send({
    content: l.user('mark-success', {
      status: l.user('display-status', {status}),
      suggestion: maskedLink(
        code(suggestion.publicID),
        `https://discord.com/channels/${suggestion.feedChannelID}/${suggestion.feedMessageID}`
      ),
    }),
  });
};

export class ReviewMarkCommand extends SubCommand {
  name: MessageNames = 'cmd-review-mark.name';
  description: MessageNames = 'cmd-review-mark.desc';

  options = options;

  selectIDs = ['mark:'];

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
    const {feed, status, suggestion} = ctx.getFlatOptions();
    await doAction(ctx, feed, suggestion, status as SuggestionDisplayStatus);
  }

  async select(
    ctx: Context<APIMessageComponentGuildInteraction, typeof options>
  ): Promise<void> {
    const [, _feedID, _suggestionID] = ctx.getSelectID().split(':');
    const feedID = parseInt(_feedID);
    const suggestionID = parseInt(_suggestionID);

    const status = ctx.getSelectValues()[0] as SuggestionDisplayStatus;

    await doAction(
      ctx,
      feedID,
      suggestionID,
      status as SuggestionDisplayStatus
    );
  }

  async autocomplete(
    ctx: Context<
      APIApplicationCommandAutocompleteGuildInteraction,
      typeof options
    >
  ): Promise<void> {
    const opt = ctx.getFocusedOption();
    if (
      opt?.name === 'feed' &&
      opt?.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.autocompleteFeeds(opt.value);
      await ctx.sendAutocomplete(suggestions);
    }
  }
}

export const markSelectMenu = (
  l: Localizer,
  feed: SuggestionFeed,
  suggestion: Suggestion
): APIStringSelectComponent => ({
  // TODO: emoji
  type: ComponentType.StringSelect,
  custom_id: `mark:${feed.id}:${suggestion.id}`,
  max_values: 1,
  min_values: 1,
  disabled: false,
  placeholder: l.user('mark-select.placeholder'),
  options: suggestionStatuses.map(s => ({
    label: l.user('display-status', {status: s}),
    value: s,
    default: suggestion.displayStatus === s,
  })),
});
