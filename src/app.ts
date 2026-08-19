import express, { type Express, type Request, type Response } from 'express';
import rootRouter from './routes/root.js';
import { PrismaClient } from './generated/prisma/index.js';

const app: Express = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'GiftMatch API is running',
    });
});

app.use('/', rootRouter);

export const prismaClient = new PrismaClient({
    log: ['query']
})

export default app;