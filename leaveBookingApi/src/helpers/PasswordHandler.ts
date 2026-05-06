//TODO: Consider a test for hashing password
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
export class PasswordHandler {
  private static readonly SALT_LENGTH_IN_BYTES = 16;
  private static readonly KEY_LENGTH_IN_BYTES = 64;
  private static readonly PEPPER = process.env.PASSWORD_PEPPER;
  static hashPassword(password: string) {
    const salt = randomBytes(this.SALT_LENGTH_IN_BYTES).toString('hex');
    const hashedPassword = scryptSync(
      this.PEPPER + password,
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
      this.PEPPER + password,
      salt,
      this.KEY_LENGTH_IN_BYTES,
    ).toString('hex');
    return timingSafeEqual(
      Buffer.from(hashedPassword, 'hex'),
      Buffer.from(hashToCompare, 'hex'),
    );
  }
}
