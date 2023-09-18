import {APIUser} from 'discord-api-types/v10';

import {
  Suggestion,
  SuggestionApprovalStatus,
  SuggestionDisplayStatus,
} from '@suggester/database';
import {Localizer} from '@suggester/i18n';

import {EmbedBuilder} from '.';
import {formatAvatarURL, tag} from '../md';

const COLORS = {
  approved: 0x2ecc71,
  denied: 0xe74c3c,
} as const;

export class BaseReviewQueueEmbed extends EmbedBuilder {
  constructor(l: Localizer, suggestion: Suggestion, author: APIUser) {
    super();

    super.setAuthor({
      name: l.guild('review-embed.header', {
        user: `${author.username}#${author.discriminator}`,
        id: author.id,
      }),
      icon_url: formatAvatarURL(author),
    });

    super.setDescription(suggestion.body);
    super.setTimestamp(suggestion.createdAt);
    // super.setColor(); // TODO: what color?

    const footerMsg = [
      l.guild('suggestion-embed.suggestion-id', {id: suggestion.publicID}),
      l.guild('suggestion-embed.submitted-at'),
    ].join(' | ');

    super.setFooter({
      text: footerMsg,
    });

    if (suggestion.isAnonymous) {
      super.addField({
        name: '_ _',
        value: l.guild('review-embed.anon-staff-notice'),
      });
    }

    if (suggestion.attachmentURL) {
      super.addField({
        name: l.guild('review-embed.attachment-header'),
        value: suggestion.attachmentURL,
      });
      super.setImage({
        url: suggestion.attachmentURL,
      });
    }
  }
}

export class NewSuggestionReviewQueueEmbed extends BaseReviewQueueEmbed {
  constructor(l: Localizer, suggestion: Suggestion, author: APIUser) {
    super(l, suggestion, author);

    super.setTitle(
      l.guild('review-embed.title-new', {id: suggestion.publicID})
    );
  }
}

export class ApprovedDeniedSuggestionReviewQueueEmbed extends BaseReviewQueueEmbed {
  constructor(
    // status: Exclude<SuggestionApprovalStatus, 'InQueue'>,
    l: Localizer,
    suggestion: Suggestion,
    author: APIUser,
    denier: APIUser
  ) {
    super(l, suggestion, author);

    // const action = status.toLowerCase() as 'approved' | 'denied';
    const action = suggestion.approvalStatus.toLowerCase() as
      | 'approved'
      | 'denied';

    super.setTitle(
      l.guild(`review-embed.title-${action}`, {id: suggestion.publicID})
    );

    if (suggestion.denialReason) {
      super.addField({
        name: l.guild('review-embed.reason-given'),
        value: suggestion.denialReason,
      });
    }

    const footerText = [
      l.guild(`review-embed.${action}-by`, {
        user: tag(denier),
      }),
      l.guild('suggestion-embed.suggestion-id', {
        id: suggestion.publicID,
      }),
    ].join(' | ');

    super.setFooter({
      text: footerText,
      icon_url: formatAvatarURL(denier),
    });

    super.setColor(COLORS[action]);

    if (suggestion.displayStatus !== SuggestionDisplayStatus.Default) {
      super.addField({
        name: l.guild('suggestion-embed.public-status'),
        value: l.guild('display-status', {status: suggestion.displayStatus}),
      });
    }
  }
}

// export class DeniedSuggestionReviewQueueEmbed extends BaseReviewQueueEmbed {
//   constructor(
//     l: Localizer,
//     suggestion: Suggestion,
//     author: APIUser,
//     denier: APIUser
//   ) {
//     super(l, suggestion, author);

//     super.setTitle(
//       l.guild('review-embed.title-denied', {id: suggestion.publicID})
//     );

//     const footerText = [
//       l.guild('review-embed.denied-by', {
//         user: tag(denier),
//       }),
//       l.guild('suggestion-embed.suggestion-id', {
//         id: suggestion.publicID,
//       }),
//     ].join(' | ');

//     super.setFooter({
//       text: footerText,
//       icon_url: formatAvatarURL(denier),
//     });

//     super.setColor(0xe74c3c);
//   }
// }
