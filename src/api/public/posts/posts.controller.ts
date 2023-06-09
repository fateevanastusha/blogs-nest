import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query, Req,
  UseGuards
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { CommentsDto } from "./posts.dto";
import { PostModel } from "./posts.schema";
import { Request } from "express";
import { CheckIfUserExist } from "../../../auth.guard";
import { LikesDto } from "../../../likes/likes.dto";
import { CommandBus } from "@nestjs/cqrs";
import { CreateCommentCommentsCommand } from "../../use-cases/comments/comments-create-comment-use-case";

@Controller('posts')
export class PostsController{
  constructor(protected postsService : PostsService,
              protected commandBus : CommandBus) {}
  @Get()
  async getPosts(@Query('pageSize', new DefaultValuePipe(10)) pageSize : number,
                 @Query('pageNumber', new DefaultValuePipe(1)) pageNumber : number,
                 @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy : string,
                 @Query('sortDirection', new DefaultValuePipe('desc')) sortDirection : "asc" | "desc",
                 @Req() req: any
                 ){
    if (!req.headers.authorization){
      return await this.postsService.getPosts({
        pageSize : pageSize,
        pageNumber : pageNumber,
        sortBy : sortBy,
        sortDirection : sortDirection,
      })
    } else {
      const token = req.headers.authorization!.split(" ")[1]
      return await this.postsService.getPostsWithUser({
        pageSize : pageSize,
        pageNumber : pageNumber,
        sortBy : sortBy,
        sortDirection : sortDirection,
      }, token)
    }
  }
  @Get(':id')
  async getPost(@Param('id') postId : string,
                @Req() req: Request){
    const post : PostModel | null =  await this.postsService.getPostWithUser(postId, req.headers.authorization)
    if (!post) throw new NotFoundException()
    //mapping for likes

    return post
  }
  @Get(':id/comments')
  async getComments(@Param('id') postId : string,
                    @Query('pageSize', new DefaultValuePipe(10)) pageSize : number,
                    @Query('pageNumber', new DefaultValuePipe(1)) pageNumber : number,
                    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy : string,
                    @Query('sortDirection', new DefaultValuePipe('desc')) sortDirection : "asc" | "desc",
                    @Req() req: any){
    return await this.postsService.getComments({
      pageSize : pageSize,
      pageNumber : pageNumber,
      sortBy : sortBy,
      sortDirection : sortDirection,
    }, req.headers.authorization, postId)
  }
  @UseGuards(CheckIfUserExist)
  @Post(':postId/comments')
  async postComment(@Param('postId') postId : string,
                    @Body() comment : CommentsDto,
                    @Req() req: any){
    const token = req.headers.authorization!.split(" ")[1]
    return await this.commandBus.execute(new CreateCommentCommentsCommand(postId, comment.content, token))
  }
  @UseGuards(CheckIfUserExist)
  @HttpCode(204)
  @Put(':id/like-status')
  async setLike(@Param('id') postId : string,
                @Body() like : LikesDto,
                @Req() req: any){
    const status : boolean = await this.postsService.changeLikeStatus(like.likeStatus, postId, req.headers.authorization)
    if (!status) throw new NotFoundException()
    return
  }

}