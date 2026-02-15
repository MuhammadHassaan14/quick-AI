import { GoogleGenAI } from "@google/genai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import {v2 as cloudinary} from 'cloudinary';
import { PDFParse } from 'pdf-parse';
import { CanvasFactory } from 'pdf-parse/worker';

const AI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    vertexai: false
});

export const generateArticle = async (req, res) => {
    try{
        const userId = req.userId;
        const {prompt} = req.body;
        const plan = req.plan;
        const usage = req.usage;

        if(plan !== 'premium' && usage.article >= 2){
            return res.json({success: false, message: 'Free article limit reached (2/month). Please upgrade to premium.'});
        }
        const response = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        const content = response.text;
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`;
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                publicMetadata:{
                    usage: { ...usage, article: usage.article + 1 }
                }
            })
        }
        res.json({success: true, content})
    }   
    catch(error){
        console.log(error.message)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
}

export const generateBlogTitle = async (req, res) => {
    try{
        const userId = req.userId;
        const {prompt} = req.body;
        // Blog Titles are unlimited for free tier
        
        const response = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        
        const content = response.text;
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;
        
        // No usage increment needed for unlimited feature
        
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
        const usage = req.usage;

        if (!prompt) {
            return res.json({success: false, message: 'Prompt is required.'});
        }

        if(plan !== 'premium' && usage.image >= 3){
            return res.json({success: false, message: 'Free image generation limit reached (3/month). Please upgrade to premium.'});
        }

        const safetyCheck = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze the following image generation prompt for any adult content (NSFW), illegal activities, extreme violence, or highly inappropriate material. If the prompt is safe and appropriate for a general audience, respond with ONLY the word "SAFE". If it contains or requests restricted content, respond with ONLY the word "UNSAFE".
            
            Prompt: ${prompt}`,
        });

        const safetyResult = safetyCheck.text.trim().toUpperCase();
        
        if (safetyResult.includes("UNSAFE")) {
            return res.json({
                success: false,
                message: "This prompt contains content that is not allowed. Please provide a safer prompt."
            });
        }

        console.log("Generating image...");
        console.log("Prompt:", prompt);
        const cfResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            }
        );

        if(!cfResponse.ok){
            const errText = await cfResponse.text();
            console.error("Cloudflare AI error:", errText);
            return res.status(500).json({success: false, message: "Failed to generate image. Please try again."});
        }

        const imageBuffer = Buffer.from(await cfResponse.arrayBuffer());
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        console.log("Image generated, uploading to Cloudinary...");
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: 'ai-generated-images',
            resource_type: 'image'
        });
        const secure_url = uploadResult.secure_url;
        console.log("Image uploaded successfully:", secure_url);
        await sql `INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;
        
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                publicMetadata:{
                    usage: { ...usage, image: usage.image + 1 }
                }
            })
        }

        res.json({success: true, content: secure_url})
    }
    catch(error){
        console.error("Image generation error:", error.message);
        let userMessage = "Failed to generate image. Please try again.";

        if(error.message.includes('api_secret')){
            userMessage = "Server configuration error. Image upload failed.";
        }
        res.status(500).json({success: false, message: userMessage})
    }
}

export const removeImageBackground = async (req, res) => {
    try{
        const userId = req.userId;
        const image = req.file;
        if (!image) {
            return res.status(400).json({ success: false, message: 'No image file provided.' });
        }
        const plan = req.plan;
        const usage = req.usage;

        if(plan !== 'premium' && usage.image_edit >= 2){
            return res.json({success: false, message: 'Free image editing limit reached (2/month). Please upgrade to premium.'});
        }
        
        const {secure_url} = await cloudinary.uploader.upload(`data:${image.mimetype};base64,${image.buffer.toString('base64')}`, {
            transformation: [
                {
                    effect: 'background_removal',
                    background_removal: 'remove_the_background'
                }
            ]
        })
        
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;
        
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                publicMetadata:{
                    usage: { ...usage, image_edit: usage.image_edit + 1 }
                }
            })
        }

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

        if (!object) {
            return res.status(400).json({ success: false, message: 'Object name to remove is required.' });
        }

        if (!image) {
            return res.status(400).json({ success: false, message: 'No image file provided.' });
        }

        const safetyCheck = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze the following object removal instruction for any inappropriate, adult, or offensive content. Respond with ONLY "SAFE" if it is appropriate, or "UNSAFE" if it is not.
            
            Instruction: ${object}`,
        });

        const safetyResult = safetyCheck.text.trim().toUpperCase();

        if (safetyResult.includes("UNSAFE")) {
            return res.json({
                success: false,
                message: "This instruction contains content that is not allowed. Please provide a safer instruction."
            });
        }

        const plan = req.plan;
        const usage = req.usage;

        if(plan !== 'premium' && usage.image_edit >= 2){
            return res.json({success: false, message: 'Free image editing limit reached (2/month). Please upgrade to premium.'});
        }

        const {public_id} = await cloudinary.uploader.upload(`data:${image.mimetype};base64,${image.buffer.toString('base64')}`)
        const imageUrl = cloudinary.url(public_id, {
            transformation: [{effect: `gen_remove:${object}`}],
            resource_type: 'image'
        })
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;
        
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                publicMetadata:{
                    usage: { ...usage, image_edit: usage.image_edit + 1 }
                }
            })
        }

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
        const usage = req.usage;

        if(plan !== 'premium' && usage.resume >= 1){
            return res.json({success: false, message: 'Free resume review limit reached (1/month). Please upgrade to premium.'});
        }

        if(!resume){
            return res.json({success: false, message: "No file uploaded."});
        }
        if(resume.size > 5 * 1024 * 1024){
            return res.json({success: false, message: "Resume file size exceeds allowed size (5MB)."})
        }
        
        const parser = new PDFParse({ data: resume.buffer, CanvasFactory: CanvasFactory });
        const result = await parser.getText();
        const fullText = result.text;
        await parser.destroy(); 
        
        if(!fullText.trim()){
            return res.json({success: false, message: "Could not extract text from PDF. Make sure it's a text-based PDF."});
        }
        const promptText = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${fullText}`
        
        const response = await AI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: promptText,
        });
        
        const content = response.text;
        await sql `INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;
        
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                publicMetadata:{
                    usage: { ...usage, resume: usage.resume + 1 }
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