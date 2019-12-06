import {
    Resolver,
    Mutation,
    Arg,
    Int,
    Query,
    InputType,
    Field,
    FieldResolver,
    Root,
    //UseMiddleware,
    //Ctx
  } from "type-graphql";
  import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
  import { Post } from "../entity/Post";
  import { User } from "../entity/User";
  //import { MyContext } from "../graphql-types/context";
  //import {isAuth} from "../middleware/isAuthenticated"
  
  @InputType()
  class PostInput {
    @Field()
    title: string;

    @Field(() => String, { nullable: true })
    coverImg?: string;
  
    @Field()
    content: string;

    @Field(() => Int, { nullable: true })
    userId?: number;
  }
  
  @InputType()
  class PostUpdateInput {
    @Field(() => String, { nullable: true })
    title?: string;
  
    @Field(() => String, { nullable: true })
    content?: string;

    @Field(() => String, { nullable: true })
    coverImg?: string;
  }
  
  @Resolver(() => Post)
  export class PostResolver {
    constructor(
      @InjectRepository(Post) private readonly postRepository: Repository<Post>,
      @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) {}

    @Query(() => Post, { nullable: true })
    post(@Arg("postId", () => Int) postId: number) {
      return this.postRepository.findOne(postId);
    }
  
    @Query(() => [Post])
    posts(): Promise<Post[]> {
      return this.postRepository.find();
    }
  /** This mutation will create a post and assign an author to said post that is either specified in the mutation or brought from context or defaults to user 1*/
    @Mutation(() => Post)
    //@UseMiddleware(isAuth)
    async createPost(
      @Arg("options") options: PostInput,
      //@Ctx() { payload }: MyContext,
    ): Promise<Post> {
      //console.log(payload)
      const recipe = this.postRepository.create({
        title: options.title,
        content: options.content,
        coverImg: options.coverImg,
        authorId: options.userId ? options.userId : 1,
      });
      return await this.postRepository.save(recipe);
    }
  
    @Mutation(() => Boolean)
    async updatePost(
      @Arg("id", () => Int) id: number,
      @Arg("input", () => PostUpdateInput) input: PostUpdateInput
    ) {
      await Post.update({ id }, input);
      return true;
    }
  
    @Mutation(() => Boolean)
    async deletePost(@Arg("id", () => Int) id: number) {
      await this.postRepository.delete({ id });
      return true;
    }

    @FieldResolver()
    async author(@Root() post: Post): Promise<User> {
      return (await this.userRepository.findOne(post.authorId, { cache: 1000 }))!;
    }
  
  }