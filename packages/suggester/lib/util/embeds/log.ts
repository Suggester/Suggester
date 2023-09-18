import {MessageNames} from '@suggester/i18n';

import {EmbedBuilder} from '.';
import {Color} from '../../constants';
import {formatAvatarURL, tag} from '../md';
import {LogAction, LogData, LogPayload} from '../struct/logging';

const DEFAULT_LOG_EMBED_COLOR_MAP: {[key in LogAction]?: number} = {
  [LogAction.SuggestionCreated]: Color.Green,
  [LogAction.SuggestionApproved]: Color.Green,
  [LogAction.SuggestionDenied]: Color.Red,

  [LogAction.VoteAdded]: Color.Green,
  [LogAction.VoteRemoved]: Color.Red,

  [LogAction.DisplayStatusChanged]: Color.Teal,
} as const;

export class LogEmbed extends EmbedBuilder {
  constructor(data: LogData) {
    super();

    super
      .setAuthor({
        name: tag(data.user),
        icon_url: formatAvatarURL(data.user),
      })
      .setTitleLocalized(
        `log-action.${LogAction[data.action]}` as MessageNames,
        data
      )
      .setColor(DEFAULT_LOG_EMBED_COLOR_MAP[data.action] || Color.Blurple)
      .setFooterLocalized(
        {
          text: 'log-embed.footer',
        },
        {
          authorID: data.suggestion.authorID,
          suggestionID: data.suggestion.publicID,
        }
      );
  }
}

export class SuggestionLogEmbed extends LogEmbed {
  constructor(data: LogPayload<LogAction.SuggestionCreated, false>) {
    super(data);
    super.setDescription(data.suggestion.body);
  }
}

export class AttachmentAddedLogEmbed extends LogEmbed {
  constructor(data: LogPayload<LogAction.AttachmentAdded, false>) {
    super(data);

    super.setColor(Color.Blue);
    super.setImage({
      url: data.attachment.url,
    });
  }
}

export class AttachmentRemovedLogEmbed extends LogEmbed {
  constructor(data: LogPayload<LogAction.AttachmentRemoved, false>) {
    super(data);

    super.setColor(Color.Orange);
    // TODO: this is deleted from S3, is there some cached Discord image we can use instead?
    super.setImage({
      url: data.attachment.url,
    });
  }
}

// override the default log embed for a log action
export const LogEmbedMap: {[key in LogAction]?: typeof LogEmbed} = {
  [LogAction.SuggestionCreated]: SuggestionLogEmbed,
  [LogAction.SuggestionApproved]: SuggestionLogEmbed,
  [LogAction.SuggestionDenied]: SuggestionLogEmbed,

  [LogAction.AttachmentAdded]: AttachmentAddedLogEmbed,
  [LogAction.AttachmentRemoved]: AttachmentRemovedLogEmbed,
  // [LogAction.DisplayStatusChanged]: DisplayStatusChangedLogEmbed,
};

export const getLogEmbed = (action: LogAction): typeof LogEmbed =>
  LogEmbedMap[action] || LogEmbed;
