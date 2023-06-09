import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BlogModel } from "../../public/blogs/blogs.schema";
import { JwtService } from "../../../jwt.service";
import { UsersRepository } from "../../superadmin/users/users.repository";
import { BlogDto } from "../../public/blogs/blogs.dto";
import { BlogsRepository } from "../../public/blogs/blogs.repository";


export class CreateBlogBlogsCommand {
  constructor(public blog: BlogDto, public token : string) {
  }
}

@CommandHandler(CreateBlogBlogsCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogBlogsCommand>{
  constructor(private jwtService : JwtService, private usersRepository : UsersRepository, private blogsRepository : BlogsRepository) {}
  async execute (command : CreateBlogBlogsCommand) : Promise<BlogModel | null>{
    const userId = await this.jwtService.getUserIdByToken(command.token)
    const user = await this.usersRepository.getFullUser(userId)
    const newBlog : BlogModel = {
      id: (+new Date()).toString(),
      name: command.blog.name,
      description: command.blog.description,
      websiteUrl: command.blog.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
      blogOwnerInfo : {
        userId: userId,
        userLogin: user.login
      },
      bannedUsers : [],
      banInfo : {
        isBanned : false,
        banDate : null
      }
    }
    return await this.blogsRepository.createBlog(newBlog);
  }
}