import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import Logger from './Logger';
export class PasswordHandler {
  private static readonly SALT_LENGTH_IN_BYTES = 16;
  private static readonly KEY_LENGTH_IN_BYTES = 64;

  private static getPepper(): string {
    return process.env.PEPPER || '';
  }

  static hashPassword(password: string) {
    const salt = randomBytes(this.SALT_LENGTH_IN_BYTES).toString('hex');
    const hashedPassword = scryptSync(
      this.getPepper() + password,
      salt,
      this.KEY_LENGTH_IN_BYTES,
    ).toString('hex');
    return { hashedPassword, salt };
  }
  static verifyPassword(
    password: string,
    hashedPassword: string,
    salt: string,
  ): boolean {
    if (
      !hashedPassword ||
      !salt ||
      !/^[0-9a-f]+$/i.test(hashedPassword) ||
      !/^[0-9a-f]+$/i.test(salt)
    ) {
      return false;
    }

    const hashToCompare = scryptSync(
      this.getPepper() + password,
      salt,
      this.KEY_LENGTH_IN_BYTES,
    ).toString('hex');

    const storedHash = Buffer.from(hashedPassword, 'hex');
    const generatedHash = Buffer.from(hashToCompare, 'hex');
    if (storedHash.length !== generatedHash.length) {
      return false;
    }

    const match = timingSafeEqual(storedHash, generatedHash);
    return match;
  }
}
