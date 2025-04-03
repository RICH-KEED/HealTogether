# HealTogether

![HealTogether Logo](https://ik.imagekit.io/1ypsjjrun/Screenshot%202025-03-31%20160902.png)

HealTogether is a comprehensive health community platform designed to connect individuals seeking mental and physical health support with professionals and peers in a safe, supportive environment. The platform emphasizes mental well-being, fostering a community where users can feel secure, unjudged, and empowered to overcome their challenges. By integrating AI technology, HealTogether provides personalized health insights and encourages open discussions about topics often considered taboo.

🚀 **Experience it live:** [healtogether.tech](https://healtogether.tech)

## ✨ Vision

HealTogether aims to bridge the mental barriers people face by creating a community where users feel safe and supported. The platform focuses on promoting the importance of mental well-being, encouraging individuals to talk about their struggles, and reassuring them that they are not alone. It integrates AI tools to facilitate open conversations, enabling users to express themselves without fear of judgment while gradually overcoming their challenges.

---

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
   - Build Command: `npm run install-all && cd frontend && npm install imagekitio-react && cd .. && npm run build`
   - Start Command: `NODE_ENV=production cd backend && node src/index.js`
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

---

## 🤝 Team Contribution

- **Abhineet:** Backend development, API creation, and handling.
- **Akash:** UI design and API optimization.
- **Suryansh:** Login & signup authentication implementation.
- **Riva Diwan:** Implemented features like Aura Ai,Dairy[Notes].

---

## ⚠️ Known Issues

- **Diary notes may not save.**
- **AURA AI may forget past chats.**

---

## 🔮 Future Scope
1. **Emotion Analysis Using NLP:** Implement natural language processing (NLP) techniques to analyze user emotions during chats for better support.
2. **Self-Care Area:** Introduce meditation guides, yoga practices, and mindfulness exercises.
3. **Enhanced AI Recommendations:** Provide more tailored mental health suggestions based on user behavior and history.
4. **Expanded Community Features:** Add forums, guided group therapy sessions, and partnerships with NGOs.
5. **Mobile Application:** Develop iOS and Android apps to make HealTogether accessible on mobile devices.
6. **Mental Well-being Gamification:** Introduce gamified tasks to encourage self-improvement.
7. **Therapist Matching System:** Match users with therapists based on their specific needs.

---

## 🤝 Contributing to Mental Well-being

HealTogether fosters an inclusive environment where users can:
1. Discuss sensitive topics openly without fear of judgment.
2. Seek support from peers and professionals alike.
3. Build resilience by addressing mental barriers step by step.

The platform also collaborates with therapists, NGOs, and other support organizations to provide holistic care.

---


## 📧 Contact
For any questions or feedback, please reach out to [abhineet1805@gmail.com](mailto:abhineet1805@gmail.com).
