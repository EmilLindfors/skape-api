import {
  Resolver,
  Mutation,
  Arg,
  Int,
  Query,
  InputType,
  Field,
  UseMiddleware,
  Ctx
} from "type-graphql";
import bcrypt from "bcryptjs";
import { Service } from "typedi";
import { Repository, EntityRepository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { User } from "../entity/User";
import { MyContext, UserResponse } from "../graphql-types";
import { isAuth } from "../middleware/isAuth";

//import { Post } from "../entity/Post";

/*const invalidLoginResponse = {
  errors: [
    {
      path: "email",
      message: "invalid login"
    }
  ]
};*/

// create custom Repository class
@Service()
@EntityRepository(User)
export class UserRepository extends Repository<User> {
  public findByEmail(email: string) {
    return this.findOne({ email });
  }
}

@InputType()
class UserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;
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
    @InjectRepository(User) private readonly userRepository: UserRepository
  ) {}

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UserInput) options: UserInput
  ): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(options.password, 12);

    const existingUser = await this.userRepository.findByEmail(options.email);

    if (existingUser) {
      return {
        errors: [
          {
            path: "email",
            message: "already in use"
          }
        ]
      };
    }

    const user = await this.userRepository
      .create({
        email: options.email,
        password: hashedPassword
      })
      .save();

    return { user };
  }

  @Mutation(() => User)
  async login(
    @Arg("options", () => UserInput) options: UserInput,
    @Ctx() ctx: MyContext
  ): Promise<User | undefined> {
    const user = await this.userRepository.findByEmail(options.email);
    if (!user) {
      return undefined;
    }

    const valid = await bcrypt.compare(options.password, user.password);
    if (!valid) {
      return undefined;
    }
    ctx.req.session!.save(() => {user.id});
    ctx.req.session!.userId = user.id;
    return user;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<User | undefined> {
    console.log(ctx.req.session!);
    if (!ctx.req.session!.userId) {
      return undefined;
    }

    return this.userRepository.findOne(ctx.req.session!.userId);
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: MyContext): Promise<Boolean> {
    return new Promise((res, rej) =>
      ctx.req.session!.destroy(err => {
        if (err) {
          console.log(err);
          return rej(false);
        }

        ctx.res.clearCookie("qid");
        return res(true);
      })
    );
  }

  @Mutation(() => User)
  @UseMiddleware(isAuth)
  async createUser(
    @Arg("options", () => UserInput) options: UserInput
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(options.password, 12);
    const recipe = this.userRepository.create({
      email: options.email,
      password: hashedPassword,
      firstName: options.firstName,
      lastName: options.lastName
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
  @Query(() => User, { nullable: true })
  user(@Arg("userId", () => Int) id: number) {
    return this.userRepository.findOne(id);
  }
  @Query(() => User, { nullable: true })
  userByEmail(@Arg("email", () => String) email: string) {
    return this.userRepository.findByEmail(email);
  }
}
