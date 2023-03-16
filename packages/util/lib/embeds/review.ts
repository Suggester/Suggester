import {APIUser} from 'discord-api-types/v10';

import {Suggestion} from '@suggester/database';
import {Localizer} from '@suggester/i18n';

import {EmbedBuilder} from '.';
import {formatAvatarURL, tag} from '../md';

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

export class ApprovedSuggestionReviewQueueEmbed extends BaseReviewQueueEmbed {
  constructor(
    l: Localizer,
    suggestion: Suggestion,
    author: APIUser,
    denier: APIUser
  ) {
    super(l, suggestion, author);

    super.setTitle(
      l.guild('review-embed.title-approved', {id: suggestion.publicID})
    );

    const footerText = [
      l.guild('review-embed.approved-by', {
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

    super.setColor(0x2ecc71);
  }
}
export class DeniedSuggestionReviewQueueEmbed extends BaseReviewQueueEmbed {
  constructor(
    l: Localizer,
    suggestion: Suggestion,
    author: APIUser,
    denier: APIUser
  ) {
    super(l, suggestion, author);

    super.setTitle(
      l.guild('review-embed.title-denied', {id: suggestion.publicID})
    );

    const footerText = [
      l.guild('review-embed.denied-by', {
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

    super.setColor(0xe74c3c);
  }
}
