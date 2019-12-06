import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  OneToMany,
  CreateDateColumn
} from "typeorm";
import { Field, ObjectType, ID } from "type-graphql";
import { User } from "./User";
import { Tag } from "./Tag";
import { RelationColumn } from "../helpers";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @CreateDateColumn({ nullable: true })
  date: Date;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  content: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  coverImg: string;

  @Field(() => [Tag], { nullable: true })
  @OneToMany(
    () => Tag,
    tag => tag.post,
    { cascade: ["insert"] }
  )
  tags: Tag[];

  @Field(() => User)
  @ManyToOne(() => User)
  author: User;
  @RelationColumn()
  authorId: number;
}
