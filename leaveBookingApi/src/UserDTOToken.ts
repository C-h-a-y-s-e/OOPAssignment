import { Role } from './entity/Roles';
export class UserDTOToken {
  constructor(
    private email: string,
    private role: Role,
  ) {}
}
