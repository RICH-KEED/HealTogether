import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, ArrowLeft, Search, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const TherapistSidebar = ({ users = [], isLoading, isProfessional = true }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore(); // Added authUser from useAuthStore
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredUsers = users.filter((user) => 
    user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <SidebarSkeleton />;

  // Change icon and title based on if this is for professionals or regular users
  const getSidebarTitle = () => {
    if (!isProfessional) return "Therapists";
    if (authUser?.role === "therapist") return "My Clients";
    if (authUser?.role === "ngo") return "My Referred Users";
    if (authUser?.role === "volunteer") return "My Referred Users";
    return "My Clients";
  };

  const sidebarIcon = isProfessional ? <Users className="size-6" /> : <UserCog className="size-6" />;
  const sidebarTitle = getSidebarTitle();
  const searchPlaceholder = isProfessional ? "Search users..." : "Search therapists...";
  const emptyStateMessage = isProfessional ? "No referred users yet" : "No therapists available";

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sidebarIcon}
            <span className="font-medium hidden lg:block">{sidebarTitle}</span>
          </div>
          
          <button 
            onClick={() => navigate("/dashboard")}
            className="btn btn-ghost btn-sm btn-circle hidden lg:flex"
            title="Back to Dashboard"
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>
        
        {/* Search Bar - only visible on larger screens */}
        <div className="relative mt-4 hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
          <input 
            type="text"
            placeholder={searchPlaceholder}
            className="input input-sm input-bordered w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName || "User"}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName || "Unknown User"}</div>
                {!isProfessional && user.role !== "user" && (
                  <div className="text-xs text-base-content/60 capitalize">
                    {user.role || "Therapist"}
                  </div>
                )}
                <div className="text-sm text-zinc-400 mt-1">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center text-zinc-500 py-4">
            {searchQuery ? "No results found" : emptyStateMessage}
          </div>
        )}
      </div>
    </aside>
  );
};

export default TherapistSidebar;
