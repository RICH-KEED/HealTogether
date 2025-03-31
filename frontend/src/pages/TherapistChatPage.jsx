import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";

import TherapistSidebar from "../components/TherapistSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import toast from "react-hot-toast";
import { Users, Copy } from "lucide-react";

const TherapistChatPage = () => {
  const { selectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const [therapists, setTherapists] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showReferralInfo, setShowReferralInfo] = useState(false);
  const isProfessional = authUser?.role === "therapist" || authUser?.role === "ngo" || authUser?.role === "volunteer";

  useEffect(() => {
    const fetchUsersOrTherapists = async () => {
      setIsLoadingUsers(true);
      try {
        // If current user is a professional, fetch users who used their referral code
        // If current user is a regular user, fetch all verified therapists
        let endpoint;
        
        if (isProfessional) {
          endpoint = "/messages/users";
          console.log("Fetching referred users for professional");
        } else {
          endpoint = "/messages/therapists";
          console.log("Fetching therapists for regular user");
        }
        
        const res = await axiosInstance.get(endpoint);
        console.log("Fetched users/therapists:", res.data);
        setTherapists(res.data);
      } catch (error) {
        console.error("Error fetching users/therapists:", error);
        const errorMsg = isProfessional ? "Failed to load your clients" : "Failed to load therapists";
        toast.error(errorMsg);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsersOrTherapists();
  }, [isProfessional]);

  const copyReferralCode = () => {
    if (authUser?.referralCode) {
      navigator.clipboard.writeText(authUser.referralCode);
      toast.success("Referral code copied to clipboard");
    } else if (authUser?.status !== "verified") {
      toast.error("Your account must be verified to get a referral code");
    } else {
      toast.error("Referral code not available");
    }
  };

  const getReferralCode = () => {
    if (!authUser?.referralCode && authUser?.status === "verified" && isProfessional) {
      return "Generating a new code...";
    }
    return authUser?.referralCode || "Not available";
  };

  // Change the header and description based on user role
  const getPageTitle = () => {
    if (authUser.role === "therapist") {
      return "My Clients";
    } else if (authUser.role === "ngo" || authUser.role === "volunteer") {
      return "My Referred Users";
    } else {
      return "Chat with Therapists";
    }
  };

  const getEmptyStateDescription = () => {
    if (authUser.role === "therapist") {
      return therapists.length > 0
        ? "Select a client from the sidebar to start a conversation"
        : "No clients have signed up with your referral code yet. Share your code to get started!";
    } else if (authUser.role === "ngo" || authUser.role === "volunteer") {
      return therapists.length > 0
        ? "Select a user from the sidebar to start a conversation"
        : "No users have signed up with your referral code yet. Share your code to get started!";
    } else {
      return therapists.length > 0
        ? "Select a therapist from the sidebar to start a conversation"
        : "No therapists are available at the moment. Please check back later.";
    }
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <TherapistSidebar 
              users={therapists} 
              isLoading={isLoadingUsers} 
              isProfessional={authUser.role === "therapist" || authUser.role === "ngo" || authUser.role === "volunteer"}
            />

            {!selectedUser ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-base-300 flex justify-between">
                  <h2 className="text-lg font-medium">{getPageTitle()}</h2>
                  {(authUser.role === "therapist" || authUser.role === "ngo" || authUser.role === "volunteer") && (
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => setShowReferralInfo(true)}
                    >
                      My Referral Code
                    </button>
                  )}
                </div>
                
                <NoChatSelected 
                  title={getPageTitle()}
                  description={getEmptyStateDescription()}
                />
              </div>
            ) : (
              <ChatContainer />
            )}
          </div>
        </div>
      </div>
      
      {/* Referral Code Modal - only shown for professionals */}
      {showReferralInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Your Referral Code</h3>
              <p className="text-base-content/70 mb-4">
                Share this code with your clients so they can sign up and connect with you directly.
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="bg-base-200 font-mono text-center py-3 px-6 rounded-lg text-lg min-w-[200px]">
                  {getReferralCode()}
                </div>
                <button 
                  className="btn btn-primary btn-square"
                  onClick={copyReferralCode}
                  disabled={!authUser?.referralCode}
                >
                  <Copy className="size-5" />
                </button>
              </div>
              
              {!authUser?.referralCode && authUser?.status !== "verified" && (
                <div className="alert alert-warning mb-4 text-left">
                  <p>Your account must be verified to get a referral code.</p>
                  <p className="mt-1"><strong>Current status:</strong> {authUser?.status}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-3 text-left text-sm bg-base-200 p-3 rounded-lg mb-6">
                <p><strong>How it works:</strong></p>
                <p>1. Share this code with your clients</p>
                <p>2. When they sign up as users with your code, they'll appear in your sidebar</p>
                <p>3. You'll be able to chat with them directly through this platform</p>
              </div>
              
              <div className="flex justify-center">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowReferralInfo(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistChatPage;
