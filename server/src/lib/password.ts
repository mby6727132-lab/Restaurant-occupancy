import bcrypt from 'bcryptjs';

// Cost 12 in real environments; a low cost only for the automated tests to keep them fast.
const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
