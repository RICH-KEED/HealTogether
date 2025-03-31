import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, ArrowLeft, Search, MessageCircle, UsersRound, User } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const Sidebar = ({ onUserSelect, onGroupSelect, selectedGroup }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'groups'
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await axiosInstance.get("/messages/users");
        setUsers(res.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
        toast.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch groups
  useEffect(() => {
    if (activeTab === 'groups') {
      const fetchGroups = async () => {
        setLoadingGroups(true);
        try {
          const res = await axiosInstance.get("/messages/groups");
          setGroups(res.data || []);
        } catch (error) {
          console.error("Error fetching groups:", error);
          toast.error("Failed to load groups");
          setGroups([]);
        } finally {
          setLoadingGroups(false);
        }
      };

      fetchGroups();
    }
  }, [activeTab]);

  const filteredUsers = users && Array.isArray(users) 
    ? users.filter((user) => 
        user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredGroups = groups && Array.isArray(groups)
    ? groups.filter((group) =>
        group?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectUser = (user) => {
    if (user && user._id) {
      setSelectedUser(user);
      if (onUserSelect) onUserSelect(user);
    } else {
      toast.error("Invalid user selected");
    }
  };

  const handleSelectGroup = (group) => {
    if (group && group._id) {
      if (isUserInGroup(group)) {
        // If user is already in the group, select it directly
        if (onGroupSelect) onGroupSelect(group);
      } else {
        // If user is not in the group, navigate to the main chat page with the group ID
        navigate(`/chat?group=${group._id}`);
      }
    } else {
      toast.error("Invalid group selected");
    }
  };

  const isUserInGroup = (group) => {
    return group.members?.some(member => 
      member._id === authUser?._id || member === authUser?._id
    );
  };

  if (loading && activeTab === 'users') return <SidebarSkeleton />;

  if (error && activeTab === 'users') {
    return (
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col items-center justify-center">
        <div className="text-center p-4">
          <p className="text-error mb-3">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-sm btn-outline"
          >
            Try Again
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-6" />
            <span className="font-medium hidden lg:block">Chats</span>
          </div>
          
          <button 
            onClick={() => navigate("/dashboard")}
            className="btn btn-ghost btn-sm btn-circle hidden lg:flex"
            title="Back to Dashboard"
          >
            <ArrowLeft className="size-4" />
          </button>
        </div>
        
        <div className="relative mt-4 hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
          <input 
            type="text"
            placeholder={`Search ${activeTab === 'users' ? 'users' : 'groups'}...`}
            className="input input-sm input-bordered w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tab selector */}
        <div className="flex mt-4">
          <button 
            className={`flex-1 py-2 text-center text-sm font-medium border-b-2 ${
              activeTab === 'users' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-base-content/60 hover:text-primary hover:border-primary/30'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <span className="hidden lg:inline">Direct Messages</span>
            <User className="lg:hidden mx-auto size-5" />
          </button>
          <button 
            className={`flex-1 py-2 text-center text-sm font-medium border-b-2 ${
              activeTab === 'groups' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-base-content/60 hover:text-primary hover:border-primary/30'
            }`}
            onClick={() => setActiveTab('groups')}
          >
            <span className="hidden lg:inline">Groups</span>
            <UsersRound className="lg:hidden mx-auto size-5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3 flex-1">
        {activeTab === 'users' ? (
          // Users list
          filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user)}
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
                  {user.role !== "user" && (
                    <div className="text-xs text-base-content/60 capitalize">
                      {user.role || "User"}
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
              {searchQuery ? "No users found" : "No users available"}
            </div>
          )
        ) : (
          // Groups list
          loadingGroups ? (
            <div className="flex justify-center p-4">
              <div className="loading loading-spinner"></div>
            </div>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <button
                key={group._id}
                onClick={() => handleSelectGroup(group)}
                className={`
                  w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors
                  ${selectedGroup && selectedGroup._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0 flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                  <UsersRound className="size-6 text-primary" />
                </div>

                {/* Group info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">
                      {group.name}
                    </div>
                    {isUserInGroup(group) && (
                      <div className="flex-shrink-0">
                        <span className="badge badge-sm badge-primary whitespace-nowrap">Joined</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-base-content/60 truncate">
                    {group.description}
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {group.members?.length || 0} members
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-4">
              {searchQuery ? "No groups found" : "No groups available"}
            </div>
          )
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
