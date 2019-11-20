import "reflect-metadata";
import * as TypeORM from "typeorm";
import { Container } from "typedi";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
//import { HelloWorldResolver } from "./resolvers/HelloWorldResolver";
import { PostResolver } from "./resolvers/PostResolver";
import { UserResolver } from "./resolvers/UserResolver";
import {Context, seedDatabase} from "./helpers"

// register 3rd party IOC container
TypeORM.useContainer(Container);

(async () => {
  const app = express();

  const options = await TypeORM.getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  await TypeORM.createConnection({ ...options, name: "default" });

    // seed database with some data
   const { defaultUser } = await seedDatabase();


  const context: Context = { user:  defaultUser};

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, PostResolver],
      container: Container,
    }),
   context
  });

  apolloServer.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
})();
