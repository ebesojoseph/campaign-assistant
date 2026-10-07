import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

export const hashPassword = (plain) => bcrypt.hash(plain, env.bcryptRounds);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

let dummyHash;
/** Used to keep login timing constant when the email does not exist. */
export async function getDummyHash() {
  dummyHash ??= await hashPassword('not-a-real-password');
  return dummyHash;
}
