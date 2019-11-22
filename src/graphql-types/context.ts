import { Request, Response } from "express";

export interface Context {
  req: Request;
  res: Response;
}

export interface MyContext {
  req: Request;
  res: Response;
  payload?: { userId: string };
}