import {EmbedBuilder} from '..';

export class LogEmbed extends EmbedBuilder {
  constructor() {
    super();

    this.setFooterLocalized({
      text: 'log-embed.footer',
    });
  }
}
