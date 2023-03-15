import {APIUser} from 'discord-api-types/v10';

import {
  Suggestion,
  SuggestionComment,
  SuggestionDisplayStatus,
  SuggestionFeed,
  SuggestionVote,
  SuggestionVoteKind,
} from '@suggester/database';
import {Localizer, MessageNames} from '@suggester/i18n';

import {EmbedBuilder} from '.';
import {TimestampStyle, code, formatAvatarURL, timestamp, user} from '../md';

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
    suggestion: Suggestion,
    comments: SuggestionComment[],
    votes: SuggestionVote[],
    author: APIUser,
    editor?: APIUser
  ) {
    super();

    const {upvotes, mids, downvotes} = votes.reduce(
      (a, c) => {
        switch (c.kind) {
          case SuggestionVoteKind.Upvote: {
            a.upvotes.push(c);
            break;
          }

          case SuggestionVoteKind.Mid: {
            a.mids.push(c);
            break;
          }

          case SuggestionVoteKind.Downvote: {
            a.downvotes.push(c);
            break;
          }
        }

        return a;
      },
      {upvotes: [], mids: [], downvotes: []} as {
        upvotes: SuggestionVote[];
        mids: SuggestionVote[];
        downvotes: SuggestionVote[];
      }
    );

    const netVotes = upvotes.length - downvotes.length;

    super.setDescription(suggestion.body).setTimestamp(suggestion.createdAt);

    // -- author --
    const authorName = suggestion.isAnonymous
      ? l.guild('suggestion-embed.title-anon')
      : l.guild('suggestion-embed.title', {
          user: `${author.username}#${author.discriminator}`,
        });

    super.setAuthor({
      name: authorName,
      icon_url: formatAvatarURL(author),
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

    if (comments.length) {
      for (const comment of comments) {
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

    if (feed.showVoteCount && votes.length) {
      const upPercentage =
        Math.floor((upvotes.length / votes.length) * 100) + '%';
      const downPercentage =
        Math.floor((downvotes.length / votes.length) * 100) + '%';
      const opinion = netVotes >= 0 ? `+${netVotes}` : netVotes;

      const headerMsg = l.guild('suggestion-embed.votes-header');

      const val = [
        l.guild('suggestion-embed.votes-opinion', {opinion}),
        l.guild('suggestion-embed.votes-up', {
          upvotes: upvotes.length,
          percentage: code(upPercentage),
        }),
        l.guild('suggestion-embed.votes-down', {
          downvotes: downvotes.length,
          percentage: code(downPercentage),
        }),
      ].join('\n');

      super.addField({
        name: headerMsg,
        value: val,
      });
    }

    // TODO: figure out how attachments should work -- should we use S3?
  }
}
