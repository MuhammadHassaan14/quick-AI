import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
    try {
        const {userId} = req.auth();
        if (!userId) {
            return res.status(401).json({
                success: false, 
                message: "Unauthorized. Please sign in."
            });
        }
        const user = await clerkClient.users.getUser(userId);
        const hasPremiumPlan = user.publicMetadata?.plan === 'premium';
        const defaultUsage = {
            article: 0,
            image: 0,
            image_edit: 0,
            resume: 0
        };

        if(!hasPremiumPlan) {
            if (user.publicMetadata?.usage) {
                req.usage = { ...defaultUsage, ...user.publicMetadata.usage };
            } else {
                await clerkClient.users.updateUserMetadata(userId, {
                    publicMetadata: { usage: defaultUsage }
                });
                req.usage = defaultUsage;
            }
        } else {
            req.usage = defaultUsage; 
        }
        
        req.plan = hasPremiumPlan ? 'premium' : 'free';
        req.userId = userId;
        next();
    }
    catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}