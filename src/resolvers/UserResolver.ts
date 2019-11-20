import {
    Resolver,
    Mutation,
    Arg,
    Int,
    Query,
    InputType,
    Field
  } from "type-graphql";
  import { User } from "../entity/User";
  
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
  
  @Resolver()
  export class UserResolver {
    @Mutation(() => User)
    async createUser(@Arg("options", () => UserInput) options: UserInput) {
      const user = await User.create(options).save();
      return user;
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
    Users() {
      return User.find();
    }
  }