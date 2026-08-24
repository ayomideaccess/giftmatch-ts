import express, { type Express, type Request, type Response } from 'express';
import rootRouter from './routes/root.js';
import { PrismaClient } from './generated/prisma/index.js';
import prismaClient from './config/prisma.js';

const app: Express = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'GiftMatch API is running',
    });
});

app.use('/', rootRouter);


export default app;