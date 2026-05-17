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
    const hashToCompare = scryptSync(
      this.getPepper() + password,
      salt,
      this.KEY_LENGTH_IN_BYTES,
    ).toString('hex');
    const match = timingSafeEqual(
      Buffer.from(hashedPassword, 'hex'),
      Buffer.from(hashToCompare, 'hex'),
    );
    return match;
  }
}
