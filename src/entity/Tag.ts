import { ObjectType, Field } from "type-graphql";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post";
import { RelationColumn} from "../helpers"

@Entity()
@ObjectType()
export class Tag {

  @PrimaryGeneratedColumn()
  readonly id: number;

  @Field()
  @Column()
  value: string;

  @ManyToOne(() => Post)
  post: Post;
  @RelationColumn()
  postId: number;
}