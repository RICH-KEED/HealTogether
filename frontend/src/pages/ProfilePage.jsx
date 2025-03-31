import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, ShieldCheck, Copy, CheckCircle, Home } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const navigate = useNavigate();

  const isProfessional = authUser?.role === "therapist" || authUser?.role === "ngo" || authUser?.role === "volunteer";

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString(undefined, {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state immediately
    updateProfile({ isUpdating: true });
    
    // Set preview immediately for better UX
    setSelectedImg(URL.createObjectURL(file));

    // Check file size
    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.warning("Large image detected. Compressing before upload...");
    }

    try {
      // Create a new FileReader to read the file
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // Create an image element to use for compression
          const img = new Image();
          img.src = event.target.result;
          
          img.onload = async () => {
            try {
              // Create a canvas for compression
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              // Maintain aspect ratio but resize large images
              const MAX_SIZE = 600;
              if (width > height && width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              } else if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
              
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              
              // Get compressed image as data URL - use lower quality JPEG
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
              
              try {
                // Send the compressed image directly using the image update API
                const response = await axiosInstance.put("/auth/update-profile", 
                  { profilePic: compressedDataUrl }
                );
                
                if (response.data) {
                  // Update the auth store with the new user data
                  await updateProfile(response.data);
                  toast.success("Profile image updated successfully");
                }
              } catch (error) {
                console.error("Error updating profile:", error);
                toast.error("Failed to update profile image. Please try again.");
              } finally {
                updateProfile({ isUpdating: false });
              }
            } catch (err) {
              console.error("Error processing image:", err);
              toast.error("Error processing image. Please try another image.");
              updateProfile({ isUpdating: false });
            }
          };
        } catch (err) {
          console.error("Error loading image:", err);
          toast.error("Error loading image");
          updateProfile({ isUpdating: false });
        }
      };
      
      reader.onerror = () => {
        toast.error("Failed to read image file");
        updateProfile({ isUpdating: false });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image");
      updateProfile({ isUpdating: false });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Referral code copied to clipboard!");
  };

  const handleVerificationRequest = async () => {
    if (!verificationMessage.trim()) {
      toast.error("Please provide a verification message");
      return;
    }
    
    setIsRequestingVerification(true);
    try {
      await axiosInstance.post("/auth/request-verification", { message: verificationMessage });
      setShowVerificationModal(false);
      toast.success("Verification request submitted successfully");
      // Reload user data to get updated verificationRequest status
      await updateProfile({});
    } catch (error) {
      toast.error("Failed to submit verification request");
    } finally {
      setIsRequestingVerification(false);
    }
  };

  const canRequestVerification = authUser?.status === "unverified" && !authUser?.verificationRequest;

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        {/* Navigation button to home/dashboard */}
        <div className="flex justify-between mb-6">
          <button 
            onClick={() => navigate("/dashboard")}
            className="btn btn-ghost gap-2"
          >
            <Home size={18} />
            Back to Dashboard
          </button>
        </div>
      
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Role
              </div>
              <div className="flex items-center">
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border capitalize">
                  {authUser?.role}
                </p>
                <span className={`ml-3 badge ${
                  authUser?.status === "verified" ? "badge-success" : 
                  authUser?.status === "pending" ? "badge-warning" :
                  authUser?.status === "rejected" ? "badge-error" : "badge-ghost"
                }`}>
                  {authUser?.status}
                </span>
                
                {canRequestVerification && (
                  <button
                    onClick={() => setShowVerificationModal(true)} 
                    className="btn btn-sm btn-primary ml-3"
                  >
                    Request Verification
                  </button>
                )}
                
                {authUser?.verificationRequest && authUser?.status === "unverified" && (
                  <div className="ml-3 flex items-center text-sm text-info">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Request Pending
                  </div>
                )}
              </div>
            </div>

            {/* Show referral code for verified professionals */}
            {isProfessional && authUser?.status === "verified" && (
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your Referral Code
                </div>
                <div className="flex items-center">
                  {authUser?.referralCode ? (
                    <>
                      <p className="px-4 py-2.5 bg-base-200 rounded-lg border font-mono">
                        {authUser.referralCode}
                      </p>
                      <button 
                        onClick={() => copyToClipboard(authUser.referralCode)}
                        className="ml-2 btn btn-sm btn-square"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <p className="px-4 py-2.5 bg-base-200 rounded-lg border text-base-content/60">
                      No referral code available
                    </p>
                  )}
                </div>
                <p className="text-xs text-base-content/60">
                  Share this code with users who want to register
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{formatDate(authUser?.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Verification Request Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Request Account Verification</h3>
            
            <p className="mb-4 text-sm">
              Please explain why you need a verified account. If you're a therapist, include your credentials and specializations.
            </p>
            
            <div className="form-control mb-6">
              <textarea 
                className="textarea textarea-bordered h-32" 
                placeholder="I am requesting verification because..."
                value={verificationMessage}
                onChange={(e) => setVerificationMessage(e.target.value)}
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                className="btn btn-ghost"
                onClick={() => setShowVerificationModal(false)}
                disabled={isRequestingVerification}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleVerificationRequest}
                disabled={isRequestingVerification}
              >
                {isRequestingVerification ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
