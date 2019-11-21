import "reflect-metadata";
import * as TypeORM from "typeorm";
import { Container } from "typedi";
import express from "express";
import session from "express-session";
// @ts-ignore
import connectSqlite3 from "connect-sqlite3";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/PostResolver";
import { UserResolver } from "./resolvers/UserResolver";

// I like to use redis for this: https://github.com/tj/connect-redis
const SQLiteStore = connectSqlite3(session);

// register 3rd party IOC container
TypeORM.useContainer(Container);

(async () => {
  const app = express();

  app.use(
    session({
      store: new SQLiteStore({
        db: "database.sqlite",
        concurrentDB: true,
        secret: process.env.SESSION_SECRET || "aslkdfjoiq12312",
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 1000 * 60 * 60 * 24 * 7 * 365 // 7 years
        }
      }),
      name: "qid",
      secret: process.env.SESSION_SECRET || "aslkdfjoiq12312",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365 // 7 years
      }
    })
  );

  const options = await TypeORM.getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  await TypeORM.createConnection({ ...options, name: "default" });

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, PostResolver],
      container: Container,
    }),
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
})();
