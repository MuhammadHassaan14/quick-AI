import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';

const app = express();//initialize express app
await connectCloudinary()
app.use(cors());//middleware to enable CORS
app.use(express.json());//middleware to parse json request bodies
app.use(clerkMiddleware());//middleware to integrate Clerk authentication

app.get('/', (req, res)=>res.send('Server is livee'));//basic route to test server

app.use(requireAuth());

app.use('/api/ai', aiRouter)
app.use('/api/user', userRouter)

const PORT = process.env.PORT || 3000;//set port to start backend server from environment variable or default to 3000

app.listen(PORT, ()=>console.log(`Server is running on port ${PORT}`));//start server and listen on specified port


