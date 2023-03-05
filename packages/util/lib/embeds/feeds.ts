import {SuggestionFeed} from '@suggester/database';

import {EmbedBuilder} from '.';

const formatBoolYesNo = (b?: boolean | null) => (b ? 'Yes' : 'No');
const formatChannel = (c?: string | null) => (c ? `<#${c}>` : 'None');
const formatRole = (r?: string | null) => (r ? `<@&${r}>` : 'None');
const formatEmoji = (e?: string | null) =>
  e ? (e.length < 15 ? e : `<:emoji:${e}>`) : 'Button disabled';
const formatStr = (s?: string | null) => s || 'None';

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
  constructor(feed: SuggestionFeed) {
    super(feed);

    super.setDescriptionLocalized('feed-info-embed-overview.description', {
      isDefault: formatBoolYesNo(feed.isDefault),
      mode: feed.mode,
      logChannel: formatChannel(feed.logChannelID),
      feedChannel: formatChannel(feed.feedChannelID),
      reviewChannel: formatChannel(feed.reviewChannelID),
    });
  }
}

export class FeedInfoRolesEmbed extends BaseFeedInfoEmbed {
  constructor(feed: SuggestionFeed) {
    super(feed);

    super.setDescriptionLocalized('feed-info-embed-roles.description', {
      reviewPingRole: formatRole(feed.reviewPingRole),
      feedPingRole: formatRole(feed.feedPingRole),
      approvedRole: formatRole(feed.approvedRole),
      implementedRole: formatRole(feed.implementedRole),
    });
  }
}

export class FeedInfoChannelsEmbed extends BaseFeedInfoEmbed {
  constructor(feed: SuggestionFeed) {
    super(feed);

    super.setDescriptionLocalized('feed-info-embed-channels.description', {
      feedChannel: formatChannel(feed.feedChannelID),
      reviewChannel: formatChannel(feed.reviewChannelID),
      logChannel: formatChannel(feed.logChannelID),
      deniedChannel: formatChannel(feed.deniedChannelID),
      implementedChannel: formatChannel(feed.implementedChannelID),
    });
  }
}

export class FeedInfoOtherEmbed extends BaseFeedInfoEmbed {
  constructor(feed: SuggestionFeed) {
    super(feed);

    super.setDescriptionLocalized('feed-info-embed-other.description', {
      mode: feed.mode,
      selfVote: formatBoolYesNo(feed.allowSelfVote),
      showVoteCount: formatBoolYesNo(feed.showVoteCount),
      commandAliasName: formatStr(feed.commandAliasName),
      suggestionCap: feed.suggestionCap ? feed.suggestionCap : 'Unlimited',
      // TODO: suggestionCooldown: feed.submitCooldown,
      anonAllowed: formatBoolYesNo(feed.allowAnonymous),

      upvoteEmoji: formatEmoji(feed.upvoteEmoji),
      midEmoji: formatEmoji(feed.midEmoji),
      downvoteEmoji: formatEmoji(feed.downvoteEmoji),

      colorChangeEnabled: formatBoolYesNo(feed.colorChangeEnabled),
      colorChangeThreshold: feed.colorChangeThreshold,
      colorChangeColor: `#${feed.colorChangeColor.toString(16).toUpperCase()}`, // hex code

      notifyAuthor: formatBoolYesNo(feed.notifyAuthor),
      autoSubscribe: formatBoolYesNo(feed.autoSubscribe),
    });
  }
}
