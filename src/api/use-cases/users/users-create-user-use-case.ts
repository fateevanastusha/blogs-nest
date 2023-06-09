import { UserModel } from "../../superadmin/users/users.schema";
import { UsersDto } from "../../superadmin/users/users.dto";
import { UsersRepository } from "../../superadmin/users/users.repository";
import * as bcrypt from 'bcrypt';
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BusinessService } from "../../../business.service";

export class CreateUserUsersCommand {
  constructor(public user : UsersDto) {
  }
}

@CommandHandler(CreateUserUsersCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserUsersCommand>{
  constructor( protected usersRepository : UsersRepository, protected businessService : BusinessService) {}
  async execute (command : CreateUserUsersCommand) : Promise<UserModel | null>{
    let confirmationCode : string = (+new Date()).toString()
    const hash = bcrypt.hashSync(command.user.password, 10, )
    const newUser : UserModel =  {
      id: (+new Date()).toString(),
      login: command.user.login,
      email: command.user.email,
      password : hash,
      createdAt: new Date().toISOString(),
      isConfirmed: false,
      confirmedCode: confirmationCode,
      banInfo : {
        isBanned : false,
        banReason : null,
        banDate : null
      }
    }
    await this.businessService.sendConfirmationCode(command.user.email, confirmationCode)
    return await this.usersRepository.createUser(newUser)
  }
}