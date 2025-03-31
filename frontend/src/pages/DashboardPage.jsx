import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { 
  MessageCircle, 
  BrainCircuit, 
  Users, 
  Book, 
  ArrowRight,
  AlertTriangle,
  Bot
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  
  const handleOptionClick = (option) => {
    if (option === "community") {
      navigate("/chat");
    } else if (option === "therapist") {
      navigate("/therapist-chat");
    } else if (option === "ai") {
      navigate("/aura-ai");
    } else if (option === "diary") {
      toast.info("Personal diary feature coming soon!");
    }
  };

  // Update the title based on user role
  const getTherapistOptionTitle = () => {
    if (authUser?.role === "therapist") {
      return "Chat with Clients";
    } else if (authUser?.role === "ngo") {
      return "Chat with Referred Users";
    } else if (authUser?.role === "volunteer") {
      return "Chat with Referred Users";
    } else {
      return "Chat with Therapist";
    }
  };

  // Update the description based on user role
  const getTherapistOptionDescription = () => {
    if (authUser?.role === "therapist") {
      return "Connect with clients who signed up using your referral code";
    } else if (authUser?.role === "ngo" || authUser?.role === "volunteer") {
      return "Connect with users who signed up using your referral code";
    } else {
      return "Get professional support from verified therapists";
    }
  };

  const options = [
    {
      id: "community",
      title: "Chat with Community",
      description: "Connect with others and share experiences in group discussions",
      icon: <MessageCircle className="w-12 h-12" />,
      color: "bg-blue-100 text-blue-600",
      available: true
    },
    {
      id: "therapist",
      title: getTherapistOptionTitle(),
      description: getTherapistOptionDescription(),
      icon: <Users className="w-12 h-12" />,
      color: "bg-green-100 text-green-600",
      available: true
    },
    {
      id: "ai",
      title: "Chat with AURA AI",
      description: "Talk to our AI assistant for immediate guidance",
      icon: <BrainCircuit className="w-12 h-12" />,
      color: "bg-purple-100 text-purple-600",
      available: true  // Changed from false to true
    },
    {
      id: "diary",
      title: "Your Diary",
      description: "Keep a personal journal of your thoughts and feelings",
      icon: <Book className="w-12 h-12" />,
      color: "bg-amber-100 text-amber-600",
      available: false
    }
  ];

  return (
    <div className="min-h-screen pt-20 bg-base-200">
      <div className="container px-4 mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome, {authUser?.fullName}</h1>
          <p className="text-base-content/70">What would you like to do today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {options.map((option) => (
            <div 
              key={option.id}
              className={`
                bg-base-100 p-6 rounded-xl shadow-md
                ${option.available ? 'cursor-pointer hover:shadow-lg transform transition hover:-translate-y-1' : 'opacity-80'}
              `}
              onClick={() => option.available && handleOptionClick(option.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${option.color}`}>
                  {option.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                    {!option.available && (
                      <span className="badge bg-base-300 text-xs font-medium">Coming Soon</span>
                    )}
                  </div>
                  <p className="text-base-content/70 mb-3">{option.description}</p>
                  
                  {option.available ? (
                    <button className="btn btn-sm btn-primary mt-2 gap-1">
                      Get Started <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-2 text-sm text-base-content/60">
                      <AlertTriangle size={14} />
                      <span>This feature is coming soon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
