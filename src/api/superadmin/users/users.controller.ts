import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { BanUserDto, UsersDto } from "./users.dto";
import { UserModel } from "./users.schema";
import { AuthGuard } from "../../../auth.guard";
import { CommandBus } from "@nestjs/cqrs";
import { CreateUserUsersCommand } from "../../use-cases/users/users-create-user-use-case";
import { DeleteUserUsersCommand } from "../../use-cases/users/users-delete-user-use-case";

@UseGuards(AuthGuard)
@Controller('sa/users')
export class UsersController{
  constructor(protected usersService : UsersService,
              protected commandBus : CommandBus) {}
  @Get()
  async getUsers(@Query('pageSize', new DefaultValuePipe(10)) pageSize : number,
                 @Query('pageNumber', new DefaultValuePipe(1)) pageNumber : number,
                 @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy : string,
                 @Query('sortDirection', new DefaultValuePipe('desc')) sortDirection : "asc" | "desc",
                 @Query('searchLoginTerm', new DefaultValuePipe('')) searchLoginTerm : string,
                 @Query('searchEmailTerm', new DefaultValuePipe('')) searchEmailTerm : string,
                 @Query('banStatus', new DefaultValuePipe('all')) banStatus : "banned" | "all" | "notBanned"
  ){
    let isBanned
    if (banStatus === "banned") isBanned = true
    if (banStatus === "notBanned") isBanned = false
    if(banStatus === "all") isBanned = undefined
    return await this.usersService.getUsers({
      pageSize : pageSize,
      pageNumber : pageNumber,
      sortBy : sortBy,
      sortDirection : sortDirection,
      searchLoginTerm : searchLoginTerm,
      searchEmailTerm : searchEmailTerm,
      banStatus : isBanned
    })
  }
  @Post()
  async createUser(@Body() user : UsersDto){
    return await this.commandBus.execute(
      new CreateUserUsersCommand(user)
    )
  }
  @HttpCode(204)
  @Put('/:id/ban')
  async banUser(@Param('id') userId : string,
                @Body() banInfo : BanUserDto){
    const status : boolean = await this.usersService.banUser(userId, banInfo)
    if(!status) throw new NotFoundException()
    return
  }
  @HttpCode(204)
  @Delete(':id')
  async deleteUser(@Param('id') userId : string){
    const status : boolean = await this.commandBus.execute(
      new DeleteUserUsersCommand(userId)
    )
    if (!status) throw new NotFoundException()
    return
  }
}