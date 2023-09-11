import {EmbedBuilder} from '.';
import {GitHubReleaseData} from '..';

export class ChangelogEmbed extends EmbedBuilder {
  constructor({name, html_url, created_at}: GitHubReleaseData, body: string) {
    super();

    super
      .setTitleLocalized('changelog-embed-header', {version: name})
      .setDescription(body)
      .setURL(html_url)
      .setTimestamp(created_at)
      // .setColor(color) // TODO:
      .setFooterLocalized({
        text: 'changelog-released-footer',
      });
  }
}
