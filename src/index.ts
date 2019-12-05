import "reflect-metadata";
import * as TypeORM from "typeorm";
import { Container } from "typedi";
import express from "express";
//import session from "express-session";
// @ts-ignore
import connectSqlite3 from "connect-sqlite3";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver, UserResolver, TodoResolver, UploadResolver } from "./resolvers";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import cors from "cors";
import { sendRefreshToken } from "./middleware/sendRefreshToken";
import { createAccessToken, createRefreshToken } from "./middleware/auth";
import { User } from "./entity/User";

// I like to use redis for this: https://github.com/tj/connect-redis
//const SQLiteStore = connectSqlite3(session);

// register 3rd party IOC container
TypeORM.useContainer(Container);

(async () => {
  const app = express();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true
    })
  );
  app.use(cookieParser());
  /*app.use(
    session({
      store: new SQLiteStore({
        db: "database.sqlite",
        concurrentDB: true,
      }),
      name: "qid",
      secret: process.env.SESSION_SECRET || "aslkdfjoiq12312",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
      }
    })
  );*/
  app.post("/refresh_token", async (req, res) => {
    const token = req.cookies.jid;
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: "" });
    }

    // token is valid and
    // we can send back an access token
    /** @todo fix to repository instead of user directly*/
    const user = await User.findOne({ id: payload.userId });

    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      return res.send({ ok: false, accessToken: "" });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });

  const options = await TypeORM.getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  await TypeORM.createConnection({ ...options, name: "default" });

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, PostResolver, TodoResolver, UploadResolver],
      container: Container,
      authChecker: ({ context: { req } }) => {
        return !!req.session.userId;
      }
    }),
    context: ({ req, res }) => ({ req, res })
  });

  apolloServer.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
})();
