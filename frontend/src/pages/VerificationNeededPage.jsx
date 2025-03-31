import { useAuthStore } from "../store/useAuthStore";
import { Shield, Clock, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const VerificationNeededPage = () => {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
    } else if (authUser.role === "user" || authUser.status === "verified") {
      navigate("/dashboard");
    }
  }, [authUser, navigate]);

  if (!authUser || authUser.role === "user" || authUser.status === "verified") {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-base-100 rounded-xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mb-6">
            <Clock className="text-warning w-10 h-10" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold mb-3">Account Verification Required</h1>

          {/* Message */}
          <div className="text-base-content/70 mb-8">
            <p className="mb-3">
              Your {authUser.role} account is currently pending verification by our admin team.
            </p>
            <p>
              This usually takes 24-48 hours. You'll receive an email notification once your account is verified.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid gap-4 mb-8">
            <div className="bg-base-200 rounded-lg p-4 flex items-start gap-3 text-left">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Why is verification required?</h3>
                <p className="text-sm text-base-content/70 mt-1">
                  We verify all professional accounts to ensure the safety and quality of our community.
                </p>
              </div>
            </div>
            
            <div className="bg-base-200 rounded-lg p-4 flex items-start gap-3 text-left">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Verification Process</h3>
                <p className="text-sm text-base-content/70 mt-1">
                  Our team will review your credentials and professional information before approval.
                </p>
              </div>
            </div>
            
            <div className="bg-base-200 rounded-lg p-4 flex items-start gap-3 text-left">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Next Steps</h3>
                <p className="text-sm text-base-content/70 mt-1">
                  Once verified, you'll gain full access to all platform features and be able to interact with users.
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={logout}
            className="btn btn-outline w-full"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationNeededPage;
