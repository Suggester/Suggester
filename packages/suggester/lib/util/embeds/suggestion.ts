import {APIEmbed, APIUser} from 'discord-api-types/v10';

import {Localizer, MessageNames} from '@suggester/i18n';

import {EmbedBuilder} from '.';
import {
  Suggestion,
  SuggestionAttachment,
  SuggestionComment,
  SuggestionDisplayStatus,
  SuggestionFeed,
  SuggestionVoteKind,
} from '@suggester/database';
import {TimestampStyle, formatAvatarURL, timestamp, user} from '../md';

// TODO: add to config maybe?

const COLORS: {[key in SuggestionDisplayStatus]: number} = {
  [SuggestionDisplayStatus.Default]: 0x5865f2,
  [SuggestionDisplayStatus.InProgress]: 0xe67e22,
  [SuggestionDisplayStatus.Considering]: 0x53d0e1,
  [SuggestionDisplayStatus.NotHappening]: 0x979c9f,
  [SuggestionDisplayStatus.Implemented]: 0x2ecc71,
};

export class SuggestionEmbed extends EmbedBuilder {
  constructor(
    l: Localizer,
    feed: SuggestionFeed,
    suggestion: Suggestion & {
      comments: SuggestionComment[];
    },
    {
      Upvote: upvotes = 0,
      Downvote: downvotes = 0,
    }: {[key in SuggestionVoteKind]?: number},
    author: APIUser,
    editor?: APIUser
  ) {
    super();
    const netVotes = upvotes - downvotes;

    super
      .setURL('https://suggester.js.org')
      .setDescription(suggestion.body)
      .setTimestamp(suggestion.createdAt);

    // -- author --
    const authorName = suggestion.isAnonymous
      ? l.guild('suggestion-embed.title-anon')
      : l.guild('suggestion-embed.title', {
          user: `${author.username}#${author.discriminator}`,
        });

    super.setAuthor({
      name: authorName,
      icon_url: suggestion.isAnonymous ? undefined : formatAvatarURL(author),
    });

    // -- footer --

    const footerMsg = [
      l.guild('suggestion-embed.suggestion-id', {id: suggestion.publicID}),
      l.guild('suggestion-embed.submitted-at'),
    ];

    if (editor) {
      footerMsg.splice(
        1,
        0,
        l.guild('suggestion-embed.edited-by', {
          editor: `${editor.username}#${editor.discriminator}`,
        })
      );
    }

    super.setFooter({
      text: footerMsg.join(' | '),
    });

    // -- color and status --

    const statusColor = COLORS[suggestion.displayStatus];
    if (suggestion.displayStatus === SuggestionDisplayStatus.Default) {
      if (feed.colorChangeEnabled && netVotes >= feed.colorChangeThreshold) {
        super.setColor(feed.colorChangeColor);
      } else {
        super.setColor(COLORS[SuggestionDisplayStatus.Default]);
      }
    } else {
      super.setColor(statusColor);
      super.addField({
        name: l.guild('suggestion-embed.public-status'),
        value: l.guild(
          ('suggestion-displaystatus.' +
            suggestion.displayStatus.toLowerCase()) as MessageNames
        ),
      });
    }

    // -- comments --

    if (suggestion.comments.length) {
      for (const comment of suggestion.comments) {
        let title = comment.isAnonymous
          ? l.guild('suggestion-embed.command-header-anon')
          : l.guild('suggestion-embed.command-header', {
              user: user(comment.authorID),
            });

        if (feed.showCommentTimestamps) {
          title += ` ${timestamp(
            comment.createdAt,
            TimestampStyle.RelativeTime
          )}`;
        }

        super.addField({
          name: title,
          value: comment.body,
        });
      }
    }

    // -- votes --

    // TODO: do we still want this? I think it looks better without
    // const totalVotes = upvotes + downvotes + mids;

    // if (feed.showVoteCount && totalVotes) {
    //   const upPercentage = Math.floor((upvotes / totalVotes) * 100) + '%';
    //   const downPercentage = Math.floor((downvotes / totalVotes) * 100) + '%';
    //   const opinion = netVotes >= 0 ? `+${netVotes}` : netVotes;

    //   const headerMsg = l.guild('suggestion-embed.votes-header');

    //   const val = [
    //     l.guild('suggestion-embed.votes-opinion', {opinion}),
    //     l.guild('suggestion-embed.votes-up', {
    //       upvotes: upvotes,
    //       percentage: code(upPercentage),
    //     }),
    //     l.guild('suggestion-embed.votes-down', {
    //       downvotes: downvotes,
    //       percentage: code(downPercentage),
    //     }),
    //   ].join('\n');

    //   super.addField({
    //     name: headerMsg,
    //     value: val,
    //   });
    // }

    // TODO: figure out how attachments should work -- should we use S3?
  }

  static build(
    l: Localizer,
    feed: SuggestionFeed,
    suggestion: Suggestion & {
      comments: SuggestionComment[];
      attachments: SuggestionAttachment[];
    },
    opinion: {[key in SuggestionVoteKind]?: number},
    author: APIUser,
    editor?: APIUser
  ): APIEmbed[] {
    const embeds: APIEmbed[] = [
      new SuggestionEmbed(l, feed, suggestion, opinion, author, editor),
    ];

    if (suggestion.attachments.length === 1) {
      embeds[0].image = {
        url: suggestion.attachments[0].url,
      };
    } else {
      for (const attachment of suggestion.attachments) {
        embeds.push({
          url: 'https://suggester.js.org',
          image: {
            url: attachment.url,
          },
        });
      }
    }
    return embeds;
  }
}
