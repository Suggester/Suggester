import {Localizer} from '@suggester/i18n';

import {EmbedBuilder} from '.';
import {SuggestionAttachment} from '@suggester/database';

export class SuggestionAttachmentEmbed extends EmbedBuilder {
  constructor(l: Localizer, attachment: SuggestionAttachment, n = 1) {
    super();

    this.setImage({
      url: attachment.url,
    });

    this.setTitle(l.user('attachment-nr', {nr: n}));

    this.setColor(0x5865f2);
  }

  static build(
    l: Localizer,
    attachments: SuggestionAttachment[]
  ): SuggestionAttachmentEmbed[] {
    const embeds = attachments.map(
      (a, i) => new SuggestionAttachmentEmbed(l, a, i + 1)
    );
    return embeds;
  }
}
