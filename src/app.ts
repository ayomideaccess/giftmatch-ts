import "dotenv/config";
import express, { type Express, type Request, type Response } from 'express';
import rootRouter from './routes/root.js';
import { PrismaClient } from './generated/prisma/index.js';
import prismaClient from './config/prisma.js';
import errorHandler from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";

const app: Express = express();
app.use(express.json());
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'GiftMatch API is running',
    });
});

app.get('/ping', (req: Request, res: Response) => {
    res.status(200).json({
        message:"pong"
    })
});

app.use('/', rootRouter);
app.use(errorHandler);


export default app;