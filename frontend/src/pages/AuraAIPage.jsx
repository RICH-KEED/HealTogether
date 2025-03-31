import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useAuraAIStore } from "../store/useAuraAIStore";
import api from "../lib/axios";
import { IKContext, IKUpload } from "imagekitio-react";
import { Loader2, ChevronLeft, Send, Image, X, PlusCircle, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import NoChatSelected from "../components/NoChatSelected";

// Get ImageKit configuration from environment variables
const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGE_KIT_PUBLIC_KEY;

const AuraAIPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  
  // Use the Aura AI store
  const {
    currentChat,
    setCurrentChat,
    chats,
    getUserChats,
    history,
    sendMessage,
    createNewChat,
    loading,
    clearCurrentChat
  } = useAuraAIStore();
  
  // Component state
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Image upload states
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  
  const ikUploadRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ImageKit authenticator function
  const authenticator = async () => {
    try {
      const response = await api.get("/upload");
      return response.data;
    } catch (error) {
      console.error("Authentication request failed:", error);
      toast.error("Failed to authenticate image upload");
      throw error;
    }
  };

  // Fetch user chats once on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      // Check if we need to initialize chats
      const { hasInitialized } = useAuraAIStore.getState();
      
      if (!hasInitialized) {
        console.log("Initializing chats");
        await getUserChats();
      }
      
      if (!isMounted) return;
    };
    
    fetchInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Handle URL chat ID changes
  useEffect(() => {
    if (!id) {
      clearCurrentChat();
      return;
    }
    
    const { chats } = useAuraAIStore.getState();
    if (!chats || !Array.isArray(chats) || chats.length === 0) {
      // Wait for chats to be loaded
      return;
    }
    
    console.log("Looking for chat with ID:", id);
    console.log("Available chats:", chats);
    
    // Find the chat by checking both _id and as string representation
    const chat = chats.find(c => 
      c._id === id || 
      c._id?.toString() === id ||
      (typeof c === 'string' ? c === id : false)
    );
    
    if (chat) {
      console.log("Found matching chat:", chat);
      setCurrentChat(chat);
    } else {
      console.log("No matching chat found, navigating back");
      navigate("/aura-ai");
    }
  }, [id, chats, clearCurrentChat, navigate, setCurrentChat]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // Image upload handlers
  const handleUploadError = (err) => {
    console.error("Upload error:", err);
    toast.error("Image upload failed");
    setIsUploading(false);
    setImagePreview(null);
  };

  const handleUploadSuccess = (res) => {
    console.log("Upload success:", res);
    setUploadedImageUrl(res.url);
    setIsUploading(false);
    toast.success("Image uploaded successfully");
  };

  const handleUploadStart = (evt) => {
    const file = evt.target.files[0];
    if (!file) return;
    
    // Check file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const cancelImageUpload = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
  };

  // Enhanced message sending with image support
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if ((!inputMessage.trim() && !uploadedImageUrl) || isTyping) return;
    
    try {
      if (currentChat) {
        console.log("Sending message to existing chat:", currentChat._id);
        setIsTyping(true); // Show typing indicator
        
        // Send message with optional image in existing chat
        await sendMessage(inputMessage, currentChat._id, uploadedImageUrl);
        
        setIsTyping(false); // Hide typing indicator
      } else {
        console.log("Creating new chat with message:", inputMessage);
        
        // Create new chat
        const chatId = await createNewChat(inputMessage, uploadedImageUrl);
        
        console.log("New chat created:", chatId);
        if (chatId) {
          navigate(`/aura-ai/chats/${chatId}`);
        }
      }
      
      // Reset states
      setInputMessage("");
      setImagePreview(null);
      setUploadedImageUrl(null);
    } catch (error) {
      setIsTyping(false);
      toast.error("Failed to send message");
      console.error("Message send error:", error);
    }
  };
  
  const handleNewChat = () => {
    clearCurrentChat();
    navigate("/aura-ai");
  };
  
  // Function to render messages with more defensive coding
  const renderMessage = (msg, index) => {
    if (!msg) return null;
    
    // Safely determine if this is a user message
    const isUser = msg.role === "user" || msg.senderId === authUser?._id;
    
    // Safely extract text from various possible formats
    let messageText = "";
    if (typeof msg.text === "string") {
      messageText = msg.text;
    } else if (msg.parts && Array.isArray(msg.parts) && msg.parts[0]) {
      messageText = msg.parts[0].text || "";
    }
    
    // Safely extract image
    let messageImage = null;
    if (msg.image) {
      messageImage = msg.image;
    } else if (msg.parts && Array.isArray(msg.parts) && msg.parts[0]) {
      messageImage = msg.parts[0].img || null;
    }
    
    // Get a display time
    const displayTime = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 
      new Date().toLocaleTimeString();
    
    return (
      <div 
        key={msg._id || index} 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        ref={index === history.length - 1 ? messagesEndRef : null}
      >
        <div 
          className={`max-w-[80%] p-4 rounded-xl ${
            isUser 
              ? 'bg-primary text-primary-content' 
              : 'bg-base-200 text-base-content'
          }`}
        >
          {messageImage && (
            <img
              src={messageImage}
              alt="Attached"
              className="max-h-40 rounded-lg object-cover mb-2"
            />
          )}
          
          <div className="whitespace-pre-wrap">
            {messageText}
          </div>
          
          <p className="text-[10px] opacity-70 mt-1 text-right">
            {displayTime}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Sidebar with chat history */}
            <div className="w-64 border-r border-base-300 bg-base-200 flex flex-col">
              <div className="p-4 border-b border-base-300 flex justify-between items-center">
                <h3 className="font-medium">My AI Chats</h3>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={handleNewChat}
                >
                  <PlusCircle className="size-4 mr-1" />
                  New Chat
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2">
                {Array.isArray(chats) && chats.length > 0 ? (
                  chats.map(chat => {
                    // Handle both object and string formats
                    const chatId = typeof chat === 'object' ? chat._id : chat;
                    const chatTitle = typeof chat === 'object' ? chat.title : "Chat";
                    const chatDate = typeof chat === 'object' ? chat.updatedAt : null;
                    
                    return (
                      <button
                        key={chatId}
                        onClick={() => navigate(`/aura-ai/chats/${chatId}`)}
                        className={`w-full p-3 text-left rounded-lg mb-2 
                          ${currentChat?._id === chatId ? 'bg-primary/20' : 'hover:bg-base-300'}`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircle className="size-4 flex-shrink-0" />
                          <p className="font-medium truncate">{chatTitle}</p>
                        </div>
                        {chatDate && (
                          <p className="text-xs text-base-content/60 mt-1">
                            {new Date(chatDate).toLocaleDateString()}
                          </p>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center p-4 text-base-content/60">
                    No conversation history yet
                  </div>
                )}
              </div>
            </div>
            
            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="p-4 border-b border-base-300 flex items-center">
                {currentChat ? (
                  <>
                    <button 
                      className="btn btn-sm btn-ghost btn-circle mr-3"
                      onClick={() => navigate('/aura-ai')}
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <div>
                      <h2 className="font-medium">{currentChat.title}</h2>
                      <p className="text-xs text-base-content/60">
                        {new Date(currentChat.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <h2 className="font-medium">New Conversation with Aura AI</h2>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading && !history.length ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : !currentChat ? (
                  <NoChatSelected
                    title="Welcome to Aura AI"
                    description="Your AI health assistant. Ask me anything about health, wellness, or medical questions."
                  />
                ) : (
                  <>
                    {Array.isArray(history) && history.length > 0 ? (
                      history.map((message, index) => renderMessage(message, index))
                    ) : (
                      <div className="text-center text-base-content/60 py-10">
                        No messages yet. Send one to start the conversation!
                      </div>
                    )}
                  </>
                )}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-base-200 text-base-content rounded-xl p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className="loading loading-dots loading-sm"></span>
                        <span className="text-sm opacity-70">Aura is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-base-300">
                <form onSubmit={handleSendMessage} className="flex flex-col">
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="mb-3 relative">
                      <div className="relative inline-block max-w-xs">
                        <img 
                          src={imagePreview} 
                          alt="Upload preview" 
                          className="h-32 rounded-lg object-cover"
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                            <Loader2 className="size-8 animate-spin text-white" />
                          </div>
                        )}
                        <button 
                          type="button"
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full"
                          onClick={cancelImageUpload}
                          disabled={isUploading}
                        >
                          <X className="size-4 text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {/* ImageKit upload */}
                    <IKContext
                      urlEndpoint={urlEndpoint}
                      publicKey={publicKey}
                      authenticator={authenticator}
                    >
                      <IKUpload
                        fileName={`health_${authUser._id}_${Date.now()}`}
                        onError={handleUploadError}
                        onSuccess={handleUploadSuccess}
                        onUploadStart={handleUploadStart}
                        useUniqueFileName={true}
                        style={{ display: "none" }}
                        ref={ikUploadRef}
                      />
                      
                      <button
                        type="button"
                        className="btn btn-circle btn-ghost"
                        onClick={() => ikUploadRef.current?.click()}
                        disabled={isUploading || isTyping}
                      >
                        <Image className="size-5" />
                      </button>
                    </IKContext>
                    
                    <input
                      type="text"
                      className="input input-bordered flex-1"
                      placeholder="Type your message here..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={isTyping}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (inputMessage.trim() || uploadedImageUrl) {
                            handleSendMessage(e);
                          }
                        }
                      }}
                    />
                    
                    <button
                      type="submit"
                      className="btn btn-circle btn-primary"
                      disabled={(!inputMessage.trim() && !uploadedImageUrl) || isTyping || isUploading}
                    >
                      {isTyping ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Send className="size-5" />
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuraAIPage;
