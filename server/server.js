import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import {clerkMiddleware} from '@clerk/express'
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';

const app = express();//initialize express app
await connectCloudinary()
const allowedOrigins = [
  "http://localhost:5173",
  "https://hypernova-ai-frontend.vercel.app"
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));//middleware to enable CORS
app.use(express.json());//middleware to parse json request bodies
app.use(clerkMiddleware({clockSkewInMs: 60000}));//middleware to integrate Clerk authentication

app.get('/', (req, res)=>res.send('Server is livee'));//basic route to test server

app.use('/api/ai', aiRouter)
app.use('/api/user', userRouter)

const PORT = process.env.PORT || 3000;//set port to start backend server from environment variable or default to 3000

app.listen(PORT, ()=>console.log(`Server is running on port ${PORT}`));//start server and listen on specified port


