import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import toast from "react-hot-toast";
import { Brain, Heart, School, UserPlus, Users, MessageCircle } from "lucide-react";

const HomePage = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { authUser } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showGroups, setShowGroups] = useState(true); // Start with groups view
  const location = useLocation();
  const navigate = useNavigate();

  // Handle query parameters for direct group access
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const groupId = queryParams.get('group');
    
    if (groupId) {
      const fetchGroupDetails = async () => {
        try {
          // First check if user is already a member
          const response = await axiosInstance.get("/messages/groups");
          const userGroup = response.data.find(g => g._id === groupId);
          
          if (userGroup && isUserInGroup(userGroup)) {
            // Already a member, just select the group
            setSelectedGroup(userGroup);
            setShowGroups(false);
          } else {
            // Not a member, try to join
            try {
              const joinResponse = await axiosInstance.post(`/messages/join-group/${groupId}`);
              setSelectedGroup(joinResponse.data);
              setShowGroups(false);
              toast.success(`Joined ${joinResponse.data.name}`);
            } catch (joinError) {
              toast.error("Failed to join group");
            }
          }
          
          // Clean up the URL to remove the query parameter
          navigate("/chat", { replace: true });
        } catch (error) {
          toast.error("Failed to open group chat");
          console.error("Error opening group chat:", error);
        }
      };
      
      fetchGroupDetails();
    }
  }, [location.search, navigate, authUser]);

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const res = await axiosInstance.get("/messages/groups");
        setGroups(res.data);
      } catch (error) {
        toast.error("Failed to load groups");
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // Add this effect to clear selected user when showing groups
  useEffect(() => {
    if (showGroups && selectedUser) {
      setSelectedUser(null);
    }
  }, [showGroups, selectedUser, setSelectedUser]);

  // Add effect to exit groups view when user is selected
  useEffect(() => {
    if (selectedUser) {
      setShowGroups(false);
      setSelectedGroup(null);
    }
  }, [selectedUser]);

  const getGroupIcon = (type) => {
    switch(type) {
      case "mental": return <Brain className="w-5 h-5 text-blue-500" />;
      case "relationship": return <Heart className="w-5 h-5 text-red-500" />;
      case "academic": return <School className="w-5 h-5 text-green-500" />;
      default: return <MessageCircle className="w-5 h-5 text-purple-500" />;
    }
  };

  const handleJoinGroup = async (groupId) => {
    setIsJoining(true);
    try {
      const response = await axiosInstance.post(`/messages/join-group/${groupId}`);
      
      // Update the groups list with the updated group that includes the user as a member
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group._id === groupId ? response.data : group
        )
      );
      
      // Select the group for chat
      setSelectedGroup(response.data);
      setSelectedUser(null); // Clear any selected direct message
      setShowGroups(false); // Switch from group listing to chat
      toast.success(`Joined ${response.data.name}`);
    } catch (error) {
      toast.error("Failed to join group");
    } finally {
      setIsJoining(false);
    }
  };

  const isUserInGroup = (group) => {
    return group.members?.some(member => 
      member._id === authUser?._id || member === authUser?._id
    );
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setShowGroups(true);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setShowGroups(false);
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar 
              onUserSelect={() => setShowGroups(false)} 
              onGroupSelect={handleGroupSelect}
              selectedGroup={selectedGroup}
            />

            {!selectedUser && !selectedGroup ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-base-300">
                  <h2 className="text-lg font-medium">Community Support Groups</h2>
                </div>
                
                <div className="p-6 bg-base-100 flex-1 overflow-y-auto">
                  {isLoadingGroups ? (
                    <div className="flex justify-center p-4">
                      <div className="loading loading-spinner"></div>
                    </div>
                  ) : groups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groups.map(group => {
                        const userIsInGroup = isUserInGroup(group);
                        
                        return (
                          <div 
                            key={group._id}
                            className="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {getGroupIcon(group.type)}
                              <h3 className="font-medium">{group.name}</h3>
                            </div>
                            <p className="text-sm text-base-content/70 mb-3">{group.description}</p>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-xs flex items-center gap-1">
                                <Users size={12} />
                                {group.members?.length || 0} members
                              </span>
                              {userIsInGroup ? (
                                <button 
                                  className="btn btn-sm btn-primary" 
                                  onClick={() => handleGroupSelect(group)}
                                >
                                  Open Chat
                                </button>
                              ) : (
                                <button 
                                  className="btn btn-sm btn-outline btn-primary" 
                                  onClick={() => handleJoinGroup(group._id)}
                                  disabled={isJoining}
                                >
                                  {isJoining ? (
                                    <span className="loading loading-spinner loading-xs mr-1"></span>
                                  ) : (
                                    <UserPlus size={14} className="mr-1" />
                                  )}
                                  Join
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-base-content/60">
                      No support groups available
                    </div>
                  )}
                </div>
              </div>
            ) : selectedGroup ? (
              <GroupChatContainer 
                group={selectedGroup} 
                onBack={handleBackToGroups} 
              />
            ) : (
              <ChatContainer />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
