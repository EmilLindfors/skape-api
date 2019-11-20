import {
    Resolver,
    Mutation,
    Arg,
    Int,
    Query,
    InputType,
    Field
  } from "type-graphql";
  import { Repository } from "typeorm";
  import { InjectRepository } from "typeorm-typedi-extensions";
  import { User } from "../entity/User";
  //import { Post } from "../entity/Post";
  
  @InputType()
  class UserInput {
    @Field()
    firstName: string;
  
    @Field()
    lastName: string;
  }
  
  @InputType()
  class UserUpdateInput {
    @Field(() => String, { nullable: true })
    firstName?: string;
  
    @Field(() => String, { nullable: true })
    lastName?: string;
  }
  
  @Resolver(() => User)
  export class UserResolver {
    constructor(
      //@InjectRepository(Post) private readonly postRepository: Repository<Post>,
      @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) {}

    @Mutation(() => User)
    async createUser(@Arg("options", () => UserInput) options: UserInput) : Promise<User> {
      const recipe = this.userRepository.create({
        ...options
      });
      return await this.userRepository.save(recipe);
    }

  
    @Mutation(() => Boolean)
    async updateUser(
      @Arg("id", () => Int) id: number,
      @Arg("input", () => UserUpdateInput) input: UserUpdateInput
    ) {
      await User.update({ id }, input);
      return true;
    }
  
    @Mutation(() => Boolean)
    async deleteUser(@Arg("id", () => Int) id: number) {
      await User.delete({ id });
      return true;
    }

    @Query(() => [User])
    users(): Promise<User[]> {
      return this.userRepository.find();
    }
  
  }