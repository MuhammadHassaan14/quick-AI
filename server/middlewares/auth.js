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
        const hasPremiumPlan = user.publicMetadata?.plan === 'premium' || 
                               user.privateMetadata?.plan === 'premium';
        if(!hasPremiumPlan && user.privateMetadata?.free_usage) {
            req.free_usage = user.privateMetadata.free_usage;
        } else if (!hasPremiumPlan) {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {free_usage: 0}
            })
            req.free_usage = 0;
        } else {
            req.free_usage = 0;//no free usage tracking required for premium users
        }
        
        req.plan = hasPremiumPlan ? 'premium' : 'free';
        req.userId = userId;
        next();
    }
    catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}