import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CommentDocument, CommentModel } from "./comments.schema";
import { Model } from "mongoose";

@Injectable()
export class CommentsRepository {
  constructor(@InjectModel('comments') private commentsModel : Model<CommentDocument>) {}
  async getCommentById(id: string): Promise<CommentModel | null> {
    return await this.commentsModel.findOne(
      {id: id},
      { _id: 0, __v: 0, postId: 0, commentatorInfo : {_id : 0, isBanned : 0}, likesInfo : {_id : 0}, postInfo : 0}
    ).lean()
  }
  async getCommentsCountByBlogOwnerId(userId : string) : Promise<number>{
    return await this.commentsModel.find({'postInfo.blogOwnerId' : userId}).count()
  }
  async deleteCommentById(id: string): Promise<boolean> {
    const result = await this.commentsModel.deleteOne({id: id})
    return result.deletedCount === 1
  }
  async updateCommentById(content: string, id: string): Promise<boolean> {
    const result = await this.commentsModel.updateOne({id: id}, {
      $set: {
        content: content
      }
    })
    return result.matchedCount === 1
  }
  async createNewComment(comment: CommentModel): Promise<CommentModel | null> {
    await this.commentsModel.insertMany(comment)
    const createdComment = await this.getCommentById(comment.id)
    if (createdComment) {
      return createdComment
    } else {
      return null
    }
  }
  async countCommentsByPostId(postId: string): Promise<number> {
    return this.commentsModel.countDocuments({postId: postId}, {_id: 0, __v: 0, postId: 0})

  }
  async changeLikesTotalCount(commentId: string, likesCount: number, dislikesCount: number): Promise<boolean> {
    const status = await this.commentsModel.updateOne({
      id: commentId,
    }, {
      $set: {
        'likesInfo.likesCount': likesCount,
        'likesInfo.dislikesCount': dislikesCount
      }
    })
    return status.matchedCount === 1
  }
  async deleteAllData() {
    const result = await this.commentsModel.deleteMany({})
    return []
  }
}