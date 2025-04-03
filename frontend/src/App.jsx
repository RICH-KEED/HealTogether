import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import TherapistChatPage from "./pages/TherapistChatPage";
import VerificationNeededPage from "./pages/VerificationNeededPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuraAIPage from "./pages/AuraAIPage";
import DiaryPage from "./pages/DiaryPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const ProtectedRoute = ({ element, condition, redirectTo }) => {
  if (condition) {
    return element;
  }
  return <Navigate to={redirectTo} replace />;
};

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Check if user needs verification - only non-user roles with pending status
  const needsVerification = authUser && 
    authUser.role !== "user" && 
    authUser.status === "pending";

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route 
          path="/" 
          element={
            authUser ? (
              needsVerification ? (
                <Navigate to="/verification-needed" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute 
              element={<DashboardPage />}
              condition={authUser && !needsVerification}
              redirectTo={authUser && needsVerification ? "/verification-needed" : "/login"}
            />
          }
        />
        
        <Route
          path="/chat"
          element={
            <ProtectedRoute 
              element={<HomePage />}
              condition={authUser && !needsVerification}
              redirectTo={authUser && needsVerification ? "/verification-needed" : "/login"}
            />
          }
        />
        
        <Route
          path="/therapist-chat"
          element={
            <ProtectedRoute 
              element={<TherapistChatPage />}
              condition={authUser && !needsVerification}
              redirectTo={authUser && needsVerification ? "/verification-needed" : "/login"}
            />
          }
        />

        <Route
          path="/aura-ai"
          element={
            <ProtectedRoute 
              element={<AuraAIPage />}
              condition={authUser && !needsVerification}
              redirectTo={authUser && needsVerification ? "/verification-needed" : "/login"}
            />
          }
        />

        <Route
          path="/aura-ai/chats/:id"
          element={
            <ProtectedRoute 
              element={<AuraAIPage />}
              condition={authUser && !needsVerification}
              redirectTo={authUser && needsVerification ? "/verification-needed" : "/login"}
            />
          }
        />
        
        <Route 
          path="/signup" 
          element={!authUser ? <SignUpPage /> : <Navigate to="/dashboard" replace />} 
        />
        
        <Route 
          path="/login" 
          element={!authUser ? <LoginPage /> : <Navigate to="/dashboard" replace />}
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute 
              element={<SettingsPage />}
              condition={authUser}
              redirectTo="/login"
            />
          }
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute 
              element={<ProfilePage />}
              condition={authUser}
              redirectTo="/login"
            />
          } 
        />
        
        <Route 
          path="/verification-needed" 
          element={
            <ProtectedRoute 
              element={<VerificationNeededPage />}
              condition={authUser && needsVerification}
              redirectTo="/"
            />
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute 
              element={<AdminDashboardPage />}
              condition={authUser && authUser.role === "admin"}
              redirectTo="/"
            />
          }
        />
        
        <Route 
          path="/diary" 
          element={
            <ProtectedRoute 
              element={<DiaryPage />}
              condition={authUser}
              redirectTo="/login"
            />
          }
        />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;
