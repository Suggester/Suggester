import {Command} from '..';

export type CommandModuleSubClass = new () => CommandModule;

export abstract class CommandModule {
  abstract name: string;
  abstract description: string;
  abstract position: number;
  abstract commands: Command[];
}
