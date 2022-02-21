import {CommandModule} from 'suggester';

import {PingCommand} from './ping';

export class MiscModule extends CommandModule {
  readonly name = 'misc';
  readonly description =
    "Random other commands that don't fit into any other module";
  readonly position = 1;
  commands = [new PingCommand()];
}
