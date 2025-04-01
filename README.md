# HealTogether

![HealTogether Logo](https://ik.imagekit.io/1ypsjjrun/Screenshot%202025-03-31%20160902.png)

HealTogether is a comprehensive health community platform that connects individuals seeking health advice with professionals and peers in a supportive environment. The platform combines real-time messaging, AI-powered health insights, and community support features.

🚀 **Experience it live:** [healtogether.tech](https://healtogether.tech)

## ✨ Features

### 🔐 Authentication System
- Secure user authentication via Clerk
- JWT token-based session management
- Role-based access (users, professionals, admins)

### 💬 Real-time Messaging
- Instant messaging between users
- Real-time notifications
- Read receipts and typing indicators
- Media sharing support

### 🤖 AI Health Assistants
- Gemini AI integration for health inquiries
- Personalized health insights
- Symptom analysis and recommendations
- Medical information verification

### 👥 Community Support
- Group discussions for specific health topics
- Anonymous posting options
- Support circles for chronic conditions
- Event organization for health awareness

### 📊 User Profiles & Health Tracking
- Comprehensive user profiles
- Health metrics tracking
- Progress visualization
- Appointment scheduling

## 🛠️ Technologies Used

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **DaisyUI** - UI components
- **Zustand** - State management
- **Socket.io-client** - Real-time communication
- **Axios** - API requests
- **React Router** - Routing
- **React Hot Toast** - Notifications
- **Google Generative AI** - AI integration

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time server
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **ImageKit & Cloudinary** - Image handling
- **Google Generative AI** - AI services

## 📋 Prerequisites

- Node.js >= 16.x
- MongoDB
- Clerk account
- ImageKit account
- Google Gemini API key
- Groq API key (optional)
- Cloudinary account

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```
   git clone https://github.com/RICH-KEED/HealTogether.git
   cd HealTogether
   ```

2. **Install dependencies**
   ```
   npm run install-all
   ```

3. **Configure environment variables**
   
   Create `.env` files in both frontend and backend directories based on the examples below:

   **Frontend (.env)**
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_IMAGE_KIT_PUBLIC_KEY=your_imagekit_public_key
   VITE_IMAGE_KIT_ENDPOINT=https://ik.imagekit.io/your_endpoint
   VITE_API_URL=http://localhost:5001
   VITE_API_BASE_URL=http://localhost:5001/api
   VITE_GEMINI_PUBLIC_KEY=your_gemini_api_key
   VITE_GROQ_API_KEY=your_groq_api_key
   ```

   **Backend (.env)**
   ```
   JWT_SECRET=your_jwt_secret_key
   MONGO_URI=your_mongodb_connection_string
   CLIENT_URL=http://localhost:5173
   PORT=5001
   GEMINI_API_KEY=your_gemini_api_key
   IMAGE_KIT_ENDPOINT=https://ik.imagekit.io/your_endpoint
   IMAGE_KIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGE_KIT_PRIVATE_KEY=your_imagekit_private_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. **Start development servers**
   ```
   npm run dev
   ```
   This will start both frontend and backend servers concurrently.

## 🏗️ Project Structure

```
HealTogether/
├── backend/               # Backend server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── db/            # Database connection
│   │   ├── lib/           # Utilities
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── index.js       # Entry point
│   │   └── server.js      # Server configuration
│   └── package.json
├── frontend/              # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── layouts/       # Page layouts
│   │   ├── lib/           # Utilities
│   │   ├── pages/         # Pages
│   │   ├── routes/        # Route components
│   │   ├── store/         # Zustand stores
│   │   ├── App.jsx        # App component
│   │   └── main.jsx       # Entry point
│   └── package.json
└── package.json           # Root package.json
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/logout` - Logout a user
- `GET /api/auth/profile` - Get user profile

### Messages
- `GET /api/messages/:id` - Get messages for a conversation
- `POST /api/messages` - Send a new message
- `DELETE /api/messages/:id` - Delete a message

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

### AI Chat
- `POST /api/chats` - Create a new AI chat
- `GET /api/chats/:id` - Get chat history
- `POST /api/gemini` - Send request to Gemini AI

### Utility
- `GET /api/upload` - Get ImageKit authentication parameters

## 🌐 Deployment

### Production Build
To create a production build:
```
npm run build
```

### Deploying to Render.com
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the following settings:
   - Build Command: `npm run install-all && npm run build`
   - Start Command: `cd backend && node src/index.js`
   - Environment Variables: Add all variables from both .env files

### Custom Domain Setup
1. Add your domain in the Render dashboard
2. Update environment variables to use your domain:
   ```
   CLIENT_URL=https://yourdomain.com
   VITE_API_URL=https://yourdomain.com
   VITE_API_BASE_URL=https://yourdomain.com/api
   ```
3. Configure DNS records as instructed by Render

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.


## 📧 Contact
For any questions or feedback, please reach out to [abhineet1805@gmail.com](mailto:abhineet1805@gmail.com).
