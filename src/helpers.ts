import { Column, ColumnOptions, getRepository } from "typeorm";
import { User } from "./entity/User";
import { Post } from "./entity/Post";


export async function seedDatabase() {
  const postRepository = getRepository(Post);
  const userRepository = getRepository(User);

  const defaultUser = userRepository.create({
    firstName: "First",
    lastName: "User",
  });
  await userRepository.save(defaultUser);

  const posts = postRepository.create([
    {
      title: "First Post",
      content: "First Description",
      author: defaultUser,
    },
    {
        title: "Second Post",
        content: "Second Description",
      author: defaultUser,
    },
  ]);
  await postRepository.save(posts);

  return {
    defaultUser,
  };
}


export function RelationColumn(options?: ColumnOptions) {
    return Column({ nullable: true, ...options });
  }

  export interface Context {
    user: User;
  }