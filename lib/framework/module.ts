import {Command} from '..';

export abstract class CommandModule {
  abstract name: string;
  abstract description: string;
  abstract position: number;
  abstract commands: Command[];
}
