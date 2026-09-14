import "dotenv/config";
import express, { type Express, type Request, type Response } from 'express';
import rootRouter from './routes/root.js';
import { PrismaClient } from './generated/prisma/index.js';
import prismaClient from './config/prisma.js';
import errorHandler from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import cors from 'cors';

// uhbgjvfgcdxw

const app: Express = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "https://giftmatch-eight.vercel.app/#",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.options('*', cors());

app.get('/ping', (req: Request, res: Response) => {
    res.status(200).json({
        message:"pong"
    })
});

app.use('/', rootRouter);
app.use(errorHandler);


export default app;