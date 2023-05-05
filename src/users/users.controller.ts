import { Body, Controller, DefaultValuePipe, Delete, Get, Param, Post, Query, Res } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersDto } from "./users.dto";
import { ErrorCodes, errorHandler } from "../helpers/errors";
import { UserModel } from "./users.schema";
import { Response } from "express";

@Controller('users')
export class UsersController{
  constructor(protected usersService : UsersService
  ) {}
  @Get()
  async getUsers(@Query('pageSize', new DefaultValuePipe(10)) pageSize : number,
                 @Query('pageNumber', new DefaultValuePipe(1)) pageNumber : number,
                 @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy : string,
                 @Query('sortDirection', new DefaultValuePipe('desc')) sortDirection : "asc" | "desc",
                 @Query('searchLoginTerm', new DefaultValuePipe('')) searchLoginTerm : string,
                 @Query('searchEmailTerm', new DefaultValuePipe('')) searchEmailTerm : string,
  ){
    console.log(pageNumber);
    return await this.usersService.getUsers({
      pageSize : pageSize,
      pageNumber : pageNumber,
      sortBy : sortBy,
      sortDirection : sortDirection,
      searchLoginTerm : searchLoginTerm,
      searchEmailTerm : searchEmailTerm
    })
  }
  @Delete(':id')
  async deleteUser(@Param('id') userId : string, @Res() res : Response){
    const status : boolean = await this.usersService.deleteUser(userId)
    if (!status) return errorHandler(ErrorCodes.NotFound)
    return res.sendStatus(204)
  }
  @Post()
  async createUser(
    @Body() user : UsersDto){
    const createdUser : UserModel | null = await this.usersService.createUser(user)
    if (!createdUser) return errorHandler(ErrorCodes.BadRequest)
    return createdUser
  }
}