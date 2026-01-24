import { GoogleGenAI } from "@google/genai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import axios from "axios";

const AI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    vertexai: false
});

export const generateArticle = async (req, res) => {
    try{
        const userId = req.userId;
        const {prompt} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;
        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: 'Free usage limit reached. Please upgrade to premium.'});
        }
        const response = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        const content = response.text;
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata:{
                    free_usage: free_usage + 1
                }
            })
        }
        res.json({success: true, content})
    }   
    catch(error){
        console.log(error.message)
        res.status(500).json({success: false, message: userMessage})
    }
}

export const generateBlogTitle = async (req, res) => {
    try{
        const userId = req.userId;
        const {prompt} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: 'Free usage limit reached. Please upgrade to premium.'});
        }
        const response = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        
        const content = response.text;
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;
        
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata:{
                    free_usage: free_usage + 1
                }
            })
        }
        
        res.json({success: true, content})
    }   
    catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

export const generateImage = async (req, res) => {
    try{
        const userId = req.userId;
        const {prompt, publish} = req.body;
        const plan = req.plan;
        
        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium subscriptions.'});
        }
        console.log("Generating image...");
        console.log("Prompt:", prompt);
        //using Pollinations.AI with better timeout
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${Date.now()}`;
        console.log("Fetching image from Pollinations AI...");        
        //fetching the generated image with longer timeout
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // Increased to 60 seconds
            maxRedirects: 5
        });
        console.log("Image received, uploading to Cloudinary...");
        if (!process.env.CLOUDINARY_API_SECRET) {//cloudinary configured or not
            console.error("Cloudinary API secret is missing!");
            return res.status(500).json({
                success: false, 
                message: "Server configuration error. Please contact support."
            });
        }
        //convert to base64 and upload to Cloudinary
        const base64Image = `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: 'ai-generated-images',
            resource_type: 'image'
        });
        const secure_url = uploadResult.secure_url;
        console.log("Image uploaded successfully:", secure_url);
        await sql `INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;
        res.json({success: true, content: secure_url})
    }   
    catch(error){
        console.error("Image generation error:", error.message);
        
        let userMessage = "Failed to generate image. Please try again.";
        
        if(error.message.includes('timeout')){
            userMessage = "Image generation is taking too long. Please try a simpler prompt or try again.";
        } else if(error.message.includes('api_secret')){
            userMessage = "Server configuration error. Image upload failed.";
        } else if(error.response?.status === 503){
            userMessage = "AI service is temporarily unavailable. Please try again in a moment.";
        }
        
        res.status(500).json({success: false, message: userMessage})
    }
}

export const removeImageBackground = async (req, res) => {
    try{
        const userId = req.userId;
        const image = req.file;
        const plan = req.plan;
        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium subscriptions.'});
        }
        
        const {secure_url} = await cloudinary.uploader.upload(image.path, {
            transformation: [
                {
                    effect: 'background_removal',
                    background_removal: 'remove_the_background'
                }
            ]
        })
        
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;
        res.json({success: true, content: secure_url})
    }   
    catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

export const removeImageObject = async (req, res) => {
    try{
        const userId = req.userId;
        const {object} = req.body;
        const image = req.file;
        const plan = req.plan;
        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium subscriptions.'});
        }
        const {public_id} = await cloudinary.uploader.upload(image.path)
        const imageUrl = cloudinary.url(public_id, {
            transformation: [{effect: `gen_remove:${object}`}],
            resource_type: 'image'
        })
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;
        res.json({success: true, content: imageUrl})
    }   
    catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

export const resumeReview = async (req, res) => {
    try{
        const userId = req.userId;
        const resume = req.file;
        const plan = req.plan;
        console.log("Resume review started");
        console.log("File received:", resume?.originalname);
        if(plan !== 'premium'){
            return res.json({success: false, message: 'This feature is only available for premium subscriptions.'});
        }
        if(!resume){
            return res.json({success: false, message: "No file uploaded."});
        }
        if(resume.size > 5 * 1024 * 1024){
            return res.json({success: false, message: "Resume file size exceeds allowed size (5MB)."})
        }
        console.log("Reading PDF...");
        const dataBuffer = fs.readFileSync(resume.path)
        console.log("Parsing PDF with pdfjs...");
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(dataBuffer),
            useSystemFonts: true
        });
        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        console.log(`PDF has ${numPages} pages`);
        let fullText = '';
        for (let i = 1; i <= numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        console.log("PDF parsed, text length:", fullText.length);
        if(!fullText.trim()){
            return res.json({success: false, message: "Could not extract text from PDF. Make sure it's a text-based PDF."});
        }
        const promptText = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${fullText}`
        
        const response = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: promptText,
        });
        
        const content = response.text;
        console.log("Review generated successfully");
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;
        try {
            fs.unlinkSync(resume.path);
        } catch(e) {
            console.log("Could not delete temp file:", e.message);
        }
        res.json({success: true, content})
    }   
    catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}