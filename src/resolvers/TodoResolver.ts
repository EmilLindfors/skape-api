import {
  Resolver,
  Mutation,
  Arg,
  Int,
  Query,
  InputType,
  Field,
  FieldResolver,
  Root
  //UseMiddleware,
  //Ctx
} from "type-graphql";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Todo } from "../entity/Todo";
import { User } from "../entity/User";
//import { MyContext } from "../graphql-types/context";
//import {isAuth} from "../middleware/isAuthenticated"

@InputType()
class TodoInput {
  @Field()
  text: string;

  @Field()
  category: string;

  @Field(() => Int, { nullable: true })
  userId?: number;

  @Field()
  completed?: boolean;
}

@Resolver(() => Todo)
export class PostResolver {
  constructor(
    @InjectRepository(Todo) private readonly todoRepository: Repository<Todo>,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  @Query(() => Todo, { nullable: true })
  todo(@Arg("todoId", () => Int) todoId: number) {
    return this.todoRepository.findOne(todoId);
  }

  @Query(() => [Todo])
  todos(): Promise<Todo[]> {
    return this.todoRepository.find();
  }
  /** This mutation will create a post and assign an author to said post that is either specified in the mutation or brought from context or defaults to user 1*/
  @Mutation(() => Todo)
  //@UseMiddleware(isAuth)
  async createTodo(
    @Arg("options") options: TodoInput
    //@Ctx() { payload }: MyContext,
  ): Promise<Todo> {
    //console.log(payload)
    const todo = this.todoRepository.create({
      text: options.text,
      category: options.category,
      completed: options.completed,
      authorId: options.userId ? options.userId : 1
    });
    return await this.todoRepository.save(todo);
  }

  @Mutation(() => Boolean)
  async updateTodo(
    @Arg("id", () => Int) id: number,
    @Arg("input", () => TodoInput) input: TodoInput
  ) {
    await this.todoRepository.update({ id }, input);
    return true;
  }

  @Mutation(() => Boolean)
  async deleteTodo(@Arg("id", () => Int) id: number) {
    await this.todoRepository.delete({ id });
    return true;
  }

  @FieldResolver()
  async todoAuthor(@Root() todo: Todo): Promise<User> {
    return (await this.userRepository.findOne(todo.authorId, { cache: 1000 }))!;
  }
}
