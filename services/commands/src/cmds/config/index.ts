import {CommandModule} from '@suggester/framework';

import {FeedsCommand} from './feeds';

export class ConfigModule extends CommandModule {
  readonly name = 'config';
  readonly description = 'Commands for configuring the bot';
  readonly position = 4;

  commands = [new FeedsCommand()];
}
