import {Command, SubCommandGroup} from 'suggester';

import {TestSubCommandA} from './a';
import {TestSubCommandB} from './b';

export class TestCommand extends Command {
  name = 'test';
  description = 'test';
  subCommands = [new TestCommandGroup()];
}

class TestCommandGroup extends SubCommandGroup {
  name = 'test_group';
  description = 'im a group';
  subCommands = [new TestSubCommandB(), new TestSubCommandA()];
}
