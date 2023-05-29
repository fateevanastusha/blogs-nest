import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BlogDocument, BlogModel, BlogOwnerModel } from "../../public/blogs/blogs.schema";

export class BlogsRepository{
  constructor(@InjectModel('bloggers') private blogsModel: Model<BlogDocument> ) {
  }
  async getBlogsCount(searchNameTerm: string): Promise<number>{
    return this.blogsModel.countDocuments({name: {$regex: searchNameTerm, $options : 'i'}})
  }
  async getBlog(blogId : string) : Promise<BlogModel | null>{
    return await this.blogsModel.findOne({id : blogId})
  }
  async bindUser(blogId : string, userInfo : BlogOwnerModel) : Promise <boolean>{
    const result = await this.blogsModel.updateOne({id: blogId}, { $set: { blogOwnerInfo : userInfo }})
    return result.matchedCount === 1
  }
  async deleteAllData(){
    await this.blogsModel.deleteMany({})
    return []
  }
}