import {
    Resolver,
    Mutation,
    Arg,
    Int,
    Query,
    InputType,
    Field
  } from "type-graphql";
  import { Post } from "../entity/Post";
  
  @InputType()
  class PostInput {
    @Field()
    title: string;
  
    @Field()
    content: string;
  }
  
  @InputType()
  class PostUpdateInput {
    @Field(() => String, { nullable: true })
    title?: string;
  
    @Field(() => String, { nullable: true })
    content?: string;
  }
  
  @Resolver()
  export class PostResolver {
    @Mutation(() => Post)
    async createPost(@Arg("options", () => PostInput) options: PostInput) {
      const post = await Post.create(options).save();
      return post;
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
      await Post.delete({ id });
      return true;
    }
  
    @Query(() => [Post])
    Posts() {
      return Post.find();
    }
  }