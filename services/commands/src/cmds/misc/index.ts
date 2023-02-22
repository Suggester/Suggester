import {CommandModule} from '@suggester/framework';

import {ChangelogCommand} from './changelog';
import {GitHubCommand} from './github';
import {InviteCommand} from './invite';
import {PingCommand} from './ping';
import {PrivacyCommand} from './privacy';
import {SupportCommand} from './support';
import {VoteCommand} from './vote';

export class MiscModule extends CommandModule {
  readonly name = 'misc';
  readonly description =
    "Random other commands that don't fit into any other module";
  readonly position = 1;
  commands = [
    new ChangelogCommand(),
    new GitHubCommand(),
    new InviteCommand(),
    new PingCommand(),
    new PrivacyCommand(),
    new SupportCommand(),
    new VoteCommand(),
  ];
}
