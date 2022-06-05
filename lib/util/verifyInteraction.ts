import {verify} from '@noble/ed25519';
import {APIInteraction} from 'discord-api-types/v10';

export async function verifyInteraction(
  pubkey: string,
  payload: APIInteraction,
  timestamp: string,
  sig: string
) {
  const msg = Buffer.concat([
    Buffer.from(timestamp, 'utf8'),
    Buffer.from(JSON.stringify(payload), 'utf8'),
  ]);

  return verify(sig, msg, pubkey);
}
