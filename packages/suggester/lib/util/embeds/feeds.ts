import {
  Attrs,
  FluentPlaceholder,
  Localizer,
  MessageNames,
} from '@suggester/i18n';

import {EmbedBuilder} from '.';
import {SuggestionFeed} from '@suggester/database';
import {
  TimestampStyle,
  bold,
  channel,
  code,
  emoji,
  quote,
  role,
  timestamp,
} from '../md';

// TODO: move to config or something
const EMOJIS: Record<string, string> = {
  default: emoji('1105204955620577402'),
  mode: emoji('1105204958221062196'),
  'log-channel': emoji('1105204957612871801'),
};

const formatBoolYesNo = (b?: boolean | null) => (b ? 'Yes' : 'No');
const formatChannel = (c?: string | null) => (c ? channel(c) : 'None');
const formatRole = (r?: string | null) => (r ? role(r) : 'None');
const formatEmoji = (e?: string | null) => (e ? emoji(e) : 'Button disabled');
const formatStr = (s?: string | null) => s || 'None';

const buildFromParts = (
  l: Localizer,
  parts: {[key in keyof Attrs<'feed-info-embed'>]?: FluentPlaceholder}
): string[] =>
  Object.entries(parts).map(([k, v]) => {
    const emoji = k in EMOJIS ? EMOJIS[k] + ' ' : '';
    const key = emoji + l.guild(('feed-info-embed.' + k) as MessageNames);
    return `${bold(key)}: ${v}`;
  });

class BaseFeedInfoEmbed extends EmbedBuilder {
  constructor(feed: SuggestionFeed) {
    super();

    super
      // TODO: put this in the config or something
      .setColor(0x5865f2)
      .setTitleLocalized('feed-info-embed.title', {name: feed.name})
      .setFooterLocalized({text: 'feed-info-embed.footer'}, {id: feed.id});
  }
}

export class FeedInfoOverviewEmbed extends BaseFeedInfoEmbed {
  constructor(feed: SuggestionFeed, l: Localizer) {
    super(feed);

    const misc = buildFromParts(l, {
      default: formatBoolYesNo(feed.isDefault),
      mode: l.guild('feed-mode', {mode: feed.mode}),
      'log-channel': formatChannel(feed.logChannelID),
      'feed-channel': formatChannel(feed.feedChannelID),
      'review-channel': formatChannel(feed.reviewChannelID),
    });

    const times = buildFromParts(l, {
      created: timestamp(feed.createdAt, TimestampStyle.RelativeTime),
      'last-updated': timestamp(feed.updatedAt, TimestampStyle.RelativeTime),
    });

    const desc = [misc, '', times].flat();

    super.setDescription(desc.join('\n'));
  }
}

export class FeedInfoRolesEmbed extends BaseFeedInfoEmbed {
  constructor(feed: SuggestionFeed, l: Localizer) {
    super(feed);

    const desc = buildFromParts(l, {
      'review-ping-role': formatRole(feed.reviewPingRole),
      'feed-ping-role': formatRole(feed.feedPingRole),
      'approved-role': formatRole(feed.approvedRole),
      'implemented-role': formatRole(feed.implementedRole),
    });

    super.setDescription(desc.join('\n'));
  }
}

export class FeedInfoChannelsEmbed extends BaseFeedInfoEmbed {
  constructor(feed: SuggestionFeed, l: Localizer) {
    super(feed);

    const desc = buildFromParts(l, {
      'feed-channel': formatChannel(feed.feedChannelID),
      'review-channel': formatChannel(feed.reviewChannelID),
      'log-channel': formatChannel(feed.logChannelID),
      'denied-channel': formatChannel(feed.deniedChannelID),
      'implemented-channel': formatChannel(feed.implementedChannelID),
    });

    super.setDescription(desc.join('\n'));
  }
}

export class FeedInfoOtherEmbed extends BaseFeedInfoEmbed {
  constructor(feed: SuggestionFeed, l: Localizer) {
    super(feed);

    const other = buildFromParts(l, {
      mode: l.guild('feed-mode', {mode: feed.mode}),
      'self-vote': formatBoolYesNo(feed.allowSelfVote),
      'show-vote-count': formatBoolYesNo(feed.showVoteCount),
      'command-alias': formatStr(feed.commandAliasName),
      'suggestion-cap': feed.suggestionCap ? feed.suggestionCap : 'Unlimited',
      // TODO: suggestionCooldown: feed.submitCooldown,
      'annon-allowed': formatBoolYesNo(feed.allowAnonymous),
    });

    const voteButtons = buildFromParts(l, {
      upvote: formatEmoji(feed.upvoteEmoji),
      mid: formatEmoji(feed.midEmoji),
      downvote: formatEmoji(feed.downvoteEmoji),
    }).map(n => quote(n));

    const colorChange = buildFromParts(l, {
      'color-change-enabled': formatBoolYesNo(feed.colorChangeEnabled),
      'color-change-threshold': feed.colorChangeThreshold,
      'color-change-color': code(
        '#' + feed.colorChangeColor.toString(16).toUpperCase()
      ),
    }).map(n => quote(n));

    const notifications = buildFromParts(l, {
      'notify-author': formatBoolYesNo(feed.notifyAuthor),
      'auto-subscribe': formatBoolYesNo(feed.autoSubscribe),
    }).map(n => quote(n));

    const desc = [
      other,
      '',
      bold(l.guild('feed-info-embed.header-vote-buttons')),
      voteButtons,
      '',
      bold(l.guild('feed-info-embed.header-color-change')),
      colorChange,
      '',
      bold(l.guild('feed-info-embed.header-notifications')),
      notifications,
    ].flat();

    super.setDescription(desc.join('\n'));
  }
}
