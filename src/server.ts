import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';

const port = process.env.PORT || 3000;
const startServer = async ():Promise<void> => {
    try {
        await prisma.$connect
            app.listen(port, ()=>{
            console.log(`GiftMatch server running on port ${port}`);
        });
        console.log("Database connected successfully!!!");
    } catch (error) {
        console.error("Unable to connect to the database", error);
        process.exit(1);
        
    }
}

