import {CommandModule} from 'suggester';

import {MiscModule} from '../src/cmds/misc';

const mods: CommandModule[] = [new MiscModule()];
const json = mods.map(m => m.commands.map(c => c.toJSON())).flat();
console.log(JSON.stringify(json));
