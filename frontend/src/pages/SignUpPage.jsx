import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, User, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const roleOptions = [
  { id: "user", label: "User", icon: "👤", description: "Join as a regular user" },
  { id: "therapist", label: "Therapist", icon: "🧠", description: "Provide professional support" },
  { id: "ngo", label: "NGO", icon: "🏢", description: "Represent an organization" },
  { id: "volunteer", label: "Volunteer", icon: "🤝", description: "Help others in the community" },
];

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
    referralCode: "",
  });
  const [referralValid, setReferralValid] = useState(null);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const { signup, isSigningUp, validateReferralCode } = useAuthStore();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData({ ...formData, role: role });
    setCurrentStep(2);
  };

  // Validate referral code
  const checkReferralCode = async (code) => {
    if (!code) return;
    setValidatingReferral(true);
    const isValid = await validateReferralCode(code);
    setReferralValid(isValid);
    setValidatingReferral(false);
  };

  // Debounced version to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.referralCode && formData.role === "user") {
        checkReferralCode(formData.referralCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.referralCode]);

  const handleVerificationRequest = async (message) => {
    try {
      await axiosInstance.post("/auth/request-verification", { message });
      toast.success("Verification request submitted successfully");
    } catch (error) {
      toast.error("Failed to submit verification request");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For user role, validate referral code
    if (formData.role === "user" && referralValid === false) {
      toast.error("Please enter a valid referral code");
      return;
    }
    
    try {
      // Send signup request
      const result = await signup(formData);
      
      // After signup, if verification needed (for non-user roles), redirect to verification page
      if (result && result.needsVerification) {
        navigate("/verification-needed");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      // Error toast is already shown in the signup function
    }
  };

  const goBack = () => {
    setCurrentStep(1);
    setSelectedRole(null);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20
              transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Connecto</h1>
              <p className="text-base-content/60">
                {currentStep === 1 ? "Choose how you want to join" : `Join as a ${selectedRole}`}
              </p>
            </div>
          </div>

          {currentStep === 1 ? (
            /* Role Selection Step */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleOptions.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`p-4 border rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center text-center`}
                >
                  <div className="text-4xl mb-2">{role.icon}</div>
                  <h3 className="font-medium">{role.label}</h3>
                  <p className="text-sm text-base-content/60 mt-1">{role.description}</p>
                </div>
              ))}
            </div>
          ) : (
            /* Registration Form Step */
            <form onSubmit={handleSubmit} className="space-y-6">
              {formData.role === "ngo" ? (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">NGO Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full pl-10"
                      placeholder="NGO Name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full pl-10"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input input-bordered w-full pl-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-base-content/40" />
                    ) : (
                      <Eye className="h-5 w-5 text-base-content/40" />
                    )}
                  </button>
                </div>
              </div>

              {formData.role === "user" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Referral Code</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`input input-bordered w-full ${
                        referralValid === true ? "border-green-500" :
                        referralValid === false ? "border-red-500" : ""
                      }`}
                      placeholder="Enter referral code"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                      required
                    />
                    {validatingReferral && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="size-4 animate-spin" />
                      </div>
                    )}
                    {referralValid === false && !validatingReferral && (
                      <p className="text-red-500 text-xs mt-1">Invalid referral code</p>
                    )}
                    {referralValid === true && !validatingReferral && (
                      <p className="text-green-500 text-xs mt-1">Valid referral code</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  type="button" 
                  className="btn btn-outline flex-1" 
                  onClick={goBack}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1" 
                  disabled={isSigningUp}
                >
                  {isSigningUp ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Sign up"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={"Join Connecto"}
        subtitle={"Create an account to connect and chat with friends and colleagues."}
      />
    </div>
  );
};

export default SignupPage;
