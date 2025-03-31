import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { formatMessageTime } from "../lib/utils";
import { ArrowLeft, Send, Image, Users, X } from "lucide-react";
import toast from "react-hot-toast";

const GroupChatContainer = ({ group, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    const fetchGroupMessages = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/messages/group/${group._id}`);
        setMessages(res.data);
      } catch (error) {
        toast.error("Error loading group messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupMessages();
    
    // Subscribe to group messages socket events
    const socket = authUser.socket;
    if (socket) {
      socket.on("newGroupMessage", (newMessage) => {
        if (newMessage.groupId === group._id) {
          setMessages(prev => [...prev, newMessage]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("newGroupMessage");
      }
    };
  }, [group._id, authUser.socket]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await axiosInstance.post(`/messages/send-group/${group._id}`, {
        text: text.trim()
      });
      
      setMessages(prev => [...prev, res.data]);
      setText("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Group Chat Header */}
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="btn btn-sm btn-ghost btn-circle">
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            <div>
              <h3 className="font-medium">{group.name}</h3>
              <div className="flex items-center gap-1 text-xs text-base-content/70">
                <Users className="w-3 h-3" />
                <span>{group.members?.length || 0} members</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowMembers(true)} 
            className="btn btn-sm btn-ghost"
          >
            <Users className="w-4 h-4 mr-1" />
            Members
          </button>
        </div>
      </div>

      {/* Group Chat Messages */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-base-content/60 py-8">
              No messages yet. Be the first to send a message!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`chat ${message.sender?._id === authUser._id || message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                ref={messages.indexOf(message) === messages.length - 1 ? messageEndRef : null}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        message.sender?.profilePic || 
                        (message.sender?._id === authUser._id ? authUser.profilePic : "/avatar.png")
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <span className="font-medium text-xs mr-2">
                    {message.sender?.fullName || "Unknown User"}
                  </span>
                  <time className="text-xs opacity-50">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble">
                  {message.text}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Group Message Input */}
      <div className="p-4 w-full border-t border-base-300">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-circle"
            disabled={!text.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Group Members</h3>
              <button 
                className="btn btn-sm btn-circle"
                onClick={() => setShowMembers(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {group.members?.length > 0 ? (
                <ul className="divide-y divide-base-300">
                  {group.members.map(member => (
                    <li key={member._id} className="py-3 flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full">
                          <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-xs text-base-content/70">{member.role}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-base-content/60">
                  No members found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatContainer;
