# HyperNova AI 🚀

HyperNova is a powerful, full-stack AI-driven platform that empowers users to generate high-quality content, create stunning images, and optimize their professional profiles using state-of-the-art AI models.

## ✨ Features

-   **📝 AI Content Creation**: Generate long-form articles and catchy blog titles powered by Google Gemini.
-   **🎨 AI Image Generation**: Create unique images from text prompts using Cloudflare's Stable Diffusion.
-   **🖼️ Advanced Image Editing**: 
    -   **Background Removal**: Seamlessly remove backgrounds using Cloudinary's AI.
    -   **Object Removal**: Erase unwanted objects from images with generative AI.
-   **📄 Resume Reviewer**: Upload PDF resumes to get instant, actionable feedback and score improvements.
-   **👥 Community Hub**: Share your AI creations with the world, explore others' work, and like your favorite pieces.
-   **💳 Usage Management**: Tiered access system (Free vs. Premium) with automated usage tracking via Clerk.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React 19 (Vite)
-   **Styling**: Tailwind CSS 4
-   **Authentication**: Clerk (React SDK)
-   **State/Routing**: React Router 7, Axios
-   **Icons**: Lucide React

### Backend
-   **Environment**: Node.js (Express)
-   **AI Models**: Google Gemini AI, Cloudflare AI (Stable Diffusion XL)
-   **Database**: Neon (Serverless PostgreSQL)
-   **Image Storage/Processing**: Cloudinary
-   **Authentication**: Clerk (Express SDK)
-   **File Handling**: Multer, PDF-Parse

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   Clerk Account
-   Cloudinary Account
-   Neon DB (PostgreSQL) Account
-   Google Gemini API Key
-   Cloudflare API Token

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/hypernova-ai.git
    cd hypernova-ai
    ```

2.  **Setup Backend:**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory and add the following:
    ```env
    PORT=3000
    DATABASE_URL=your_neon_db_url
    CLERK_SECRET_KEY=your_clerk_secret_key
    CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    GEMINI_API_KEY=your_google_gemini_key
    CLOUDFLARE_ACCOUNT_ID=your_cloudflare_id
    CLOUDFLARE_API_TOKEN=your_cloudflare_token
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_key
    CLOUDINARY_API_SECRET=your_cloudinary_secret
    ```
    Run the server:
    ```bash
    npm run server
    ```

3.  **Setup Frontend:**
    ```bash
    cd ../user
    npm install
    ```
    Create a `.env` file in the `user` directory and add:
    ```env
    VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    VITE_BASE_URL=http://localhost:3000
    ```
    Run the frontend:
    ```bash
    npm run dev
    ```

## 📁 Project Structure

```text
HyperNova/
├── server/             # Express Backend
│   ├── configs/        # Database, Cloudinary, Multer configs
│   ├── controllers/    # AI and User logic
│   ├── routes/         # API endpoints
│   └── middlewares/    # Auth and Plan validation
├── user/               # React Frontend (Vite)
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Feature-specific pages
│   │   └── assets/     # Static images and icons
└── README.md
```

## 📜 License
This project is licensed under the [ISC License](server/package.json).
