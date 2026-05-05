import { User } from '../entity/User';
import { Role } from './Roles';
import { instanceToPlain } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryFailedError, Repository, DeepPartial } from 'typeorm';
import { mock } from 'jest-mock-extended';
describe('User Entity', () => {
  //required for @Column({ select:false }) and @Column({ unique: true }) tests
  let mockUserRepository: jest.Mocked<Repository<User>>;
  let user: User;
  let role: Role;

  beforeEach(() => {
    //before each test reset the following:
    mockUserRepository = mock<Repository<User>>();
    role = new Role();
    role.id = 1;
    role.name = 'admin';
    user = new User();
    user.userId = 1;
    user.email = 'test@email.com';
    user.password = 'a'.repeat(10);
    user.role = role;
  });

  it('A password that is not a string is considered invalid', async () => {
    user.password = 1234 as any; //this password is not a string
    const errors = await validate(user);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });
  it('A password less than 10 characters is considered invalid', async () => {
    user.password = 'a'.repeat(9); //only 9 chars
    const errors = await validate(user);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });
  it('A password containing only whitespace is invalid', async () => {
    user.password = ' '; // 10 spaces
    const errors = await validate(user);
    expect(errors.length).toBe(1);
    const constraints = errors[0].constraints;
    expect(constraints).toHaveProperty('matches');
    expect(constraints?.matches).toBe('Password cannot be empty or whitespace');
  });
  it('A poorly formed email is considered invalid', async () => {
    user.email = 'not a valid email address';
    const errors = await validate(user);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });
  //   it('A user with no role is considered invalid', async () => {
  //     user.role = null;
  //     const errors = await validate(invalidUser);
  //     expect(errors.length).toBe(1);
  //     expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  //   });
  //   TODO: Try check with someone whether you should keep not null or just test it here
  //   TODO: Test if email address is unique or not
  it('A user with valid details will be accepted', async () => {
    const errors = await validate(user);
    expect(errors.length).toBe(0);
  });
  it('Users will not include a password from a get request', async () => {
    //Note this is an async function
    const user = new User();
    //Mock TypeORM's behaviour of excluding the password from a response
    mockUserRepository.findOne.mockResolvedValue({
      userId: user.userId,
      email: user.email,
      role: { id: role.id, name: role.name },
    } as User);
    const retrievedUser = await mockUserRepository.findOne({
      where: { userId: user.userId },
    });
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser).toHaveProperty('userId', user.userId);
    expect(retrievedUser).toHaveProperty('email', user.email);
    expect(retrievedUser).toHaveProperty('role', {
      id: role.id,
      name: role.name,
    });
    //Password is excluded
    expect(retrievedUser).not.toHaveProperty('password');
  });
  it('A new user with a duplicate email address cannot be inserted/saved', async () => {
    mockUserRepository.save.mockImplementationOnce(
      ////first call to save will succeed
      (user: DeepPartial<User>) => Promise.resolve(user as User),
    );
    //Mock the error for a duplicate
    mockUserRepository.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT INTO user',
        [],
        //#1062 - Duplicate entry 'email@email.com' for key 'email'
        new Error(`#1062 - Duplicate entry '${user.email}' for key 'email'`),
      ),
    );
    //Save a user's details – no issues expected
    await expect(mockUserRepository.save(user)).resolves.toEqual(user);
    //Create another user with the same details (including email address)
    const userWithDuplicateEmailAddress = Object.assign(new User(), user);
    //Act and assert saving another user’s details that have the same email address
    await expect(
      mockUserRepository.save(userWithDuplicateEmailAddress),
    ).rejects.toThrow(QueryFailedError);
  });
});
