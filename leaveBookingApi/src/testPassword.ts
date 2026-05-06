import 'dotenv/config'; // Loads environment variables from .env
import { PasswordHandler } from './helpers/PasswordHandler'; // Adjust path as needed
const TEST_PASSWORD = 'password123';
//Generate hash and salt
const { hashedPassword, salt } = PasswordHandler.hashPassword(TEST_PASSWORD);
console.log('Hashed Password:', hashedPassword);
console.log('Salt:', salt);
console.log(
  'Correct Password Verified:',
  PasswordHandler.verifyPassword(TEST_PASSWORD, hashedPassword, salt),
);
console.log(
  'Wrong Password Verified:',
  PasswordHandler.verifyPassword('Some other password', hashedPassword, salt),
);
