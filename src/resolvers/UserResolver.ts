import {
  Resolver,
  Mutation,
  Arg,
  Int,
  Query,
  InputType,
  Field,
  UseMiddleware,
  ObjectType,
  Ctx
} from "type-graphql";
import bcrypt from "bcryptjs";
import { Service } from "typedi";
import { Repository, EntityRepository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { User } from "../entity/User";
import {MyContext} from "../graphql-types/context";
import { isAuth } from "../middleware/isAuth";
import { verify } from "jsonwebtoken";
import { createRefreshToken, createAccessToken } from "../middleware/auth";
import { sendRefreshToken } from "../middleware/sendRefreshToken";

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

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
  @Field(() => User)
  user: User;
}

@Resolver(() => User)
export class UserResolver {
  constructor(
    //@InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(User) private readonly userRepository: UserRepository
  ) {}

  @Mutation(() => User)
  async register(
    @Arg("options", () => UserInput) options: UserInput
  ): Promise<User | undefined>  {
    const hashedPassword = await bcrypt.hash(options.password, 12);

    const existingUser = await this.userRepository.findByEmail(options.email);

    if (existingUser) {
      return undefined;
    }

    const user = this.userRepository
      .create({
        email: options.email,
        password: hashedPassword,
        firstName: options.firstName,
        lastName: options.lastName
      })
      return await this.userRepository.save(user);

  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("options", () => UserInput) options: UserInput,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse | undefined> {


    const user = await this.userRepository.findByEmail(options.email);

    if (!user) {
      throw new Error("could not find user");
    }

    const valid = await bcrypt.compare(options.password, user.password);

    if (!valid) {
      throw new Error("bad password");
    }

    // login successful

    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user
    };
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<User | undefined> {
    const authorization = ctx.req.headers["authorization"];

    if (!authorization) {
      return undefined;
    }

    try {
      const token = authorization.split(" ")[1];
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      return this.userRepository.findOne(payload.userId);
    } catch (err) {
      console.log(err);
      return undefined;
    }

  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, "");

    return true;
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
