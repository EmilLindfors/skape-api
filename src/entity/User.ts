import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BaseEntity
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column("boolean", { default: false })
  confirmed: boolean;
  
  @Column("int", { default: 0 })
  tokenVersion: number;

  @Field()
  @Column("text", { unique: true })
  email: string;

  @Column()
  password: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatarUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  calendarUrl: string;

  @Field(() => User, { nullable: true })
  @OneToMany(  () => Post,
  post => post.author, { nullable: true })
  posts: Post[];

}
