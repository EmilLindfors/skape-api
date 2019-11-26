import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    BaseEntity
  } from "typeorm";
  import { Field, ID, ObjectType } from "type-graphql";
  import { User } from "./User";
  import { RelationColumn } from "../helpers";

  "Description for the type"
  @ObjectType()
  @Entity()
  export class Todo extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number;

    @Column("boolean", { default: false })
    completed: boolean;

    @Field({ nullable: true })
    @Column({ nullable: true })
    text: string;
  
    @Field({ nullable: true })
    @Column({ nullable: true })
    category: string;
  

    @Field(() => User)
    @ManyToOne(() => User)
    todoAuthor: User;
    @RelationColumn()
    authorId: number;
  
  }
  