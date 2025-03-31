import { useState, useEffect, useRef } from "react";
import NoChatSelected from "../components/NoChatSelected";
import { useAuraAIStore } from "../store/useAuraAIStore";
import { useAuthStore } from "../store/useAuthStore";
import { Loader, Send, PlusCircle, MessageCircle, Image as ImageIcon, X, Sparkles } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../lib/axios"; // Import the configured axios instance
import getGeminiResponse from "../lib/gemini";

const AuraAIPage = () => {
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
  
  const { authUser } = useAuthStore();
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null); // State for selected image
  const [imagePreview, setImagePreview] = useState(null); // State for image preview
  const [uploadingImage, setUploadingImage] = useState(false); // State for upload loading
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for hidden file input
  const params = useParams();
  const navigate = useNavigate();
  
  // Add typing indicators
  const [isTyping, setIsTyping] = useState(false);
  
  // Fetch user chats ONLY once on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      // Check if we already have chat data
      const { hasInitialized } = useAuraAIStore.getState();
      
      if (!hasInitialized) {
        console.log("Initializing chats");
        await getUserChats();
      }
      
      if (!isMounted) return;
      
      // Handle chat ID from URL only after we have chats
      if (params.id) {
        // Validate ID format
        if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
          console.error("Invalid chat ID format in URL");
          toast.error("Invalid chat ID format");
          navigate("/aura-ai");
          return;
        }
        
        const { chats } = useAuraAIStore.getState();
        const chat = chats && Array.isArray(chats) && chats.find(c => c._id === params.id);
        if (chat) {
          setCurrentChat(chat);
        } else {
          // Invalid chat ID
          navigate("/aura-ai");
        }
      }
    };
    
    fetchInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Handle URL chat ID changes without refetching all chats
  useEffect(() => {
    if (!params.id) {
      clearCurrentChat();
      return;
    }
    
    const { chats } = useAuraAIStore.getState();
    if (!chats || !Array.isArray(chats) || chats.length === 0) {
      // Wait for chats to be loaded
      return;
    }
    
    if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
      navigate("/aura-ai");
      return;
    }
    
    const chat = chats.find(c => c._id === params.id);
    if (chat) {
      setCurrentChat(chat);
    } else {
      navigate("/aura-ai");
    }
  }, [params.id]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // Function to handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
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
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImage(file);
    setImagePreview(previewUrl);
  };
  
  // Function to remove selected image
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Function to upload image to ImageKit
  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      // Remove /api prefix as it's already in baseURL
      const authResponse = await axios.get('/upload');
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('publicKey', authResponse.data.publicKey);
      formData.append('signature', authResponse.data.signature);
      formData.append('expire', authResponse.data.expire);
      formData.append('token', authResponse.data.token);
      formData.append('fileName', `aura_${Date.now()}`);
      formData.append('folder', '/aura-ai');
      formData.append('useUniqueFileName', 'true');
      
      // Use standard Axios for external API calls
      const standardAxios = window.axios || axios.create();
      
      const uploadResponse = await standardAxios.post(
        'https://upload.imagekit.io/api/v1/files/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: false
        }
      );
      
      console.log("Image uploaded successfully:", uploadResponse.data.url);
      return uploadResponse.data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Enhanced message sending with image support
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !image) return;
    
    try {
      let imageUrl = null;
      
      // Upload image if present
      if (image) {
        imageUrl = await uploadImage(image);
        console.log("Image uploaded:", imageUrl);
        removeImage(); // Clear image after upload
      }
      
      // Store original input for later use
      const originalInput = input;
      
      if (currentChat) {
        console.log("Sending message to existing chat:", currentChat._id);
        setIsTyping(true); // Show typing indicator
        // Send message with optional image in existing chat
        await sendMessage(input, currentChat._id, imageUrl);
        setIsTyping(false); // Hide typing indicator
        
        // You could optionally get a local AI response for immediate feedback
        // const aiResponse = await getGeminiResponse(originalInput);
        // console.log("Local AI response:", aiResponse);
      } else {
        console.log("Creating new chat with message:", input);
        // Create new chat
        const chatId = await createNewChat(input, imageUrl);
        console.log("New chat created:", chatId);
        if (chatId) {
          navigate(`/aura-ai/chats/${chatId}`);
        }
      }
      setInput("");
    } catch (error) {
      setIsTyping(false);
      toast.error("Failed to send message");
      console.error("Message send error:", error);
    }
  };

  // Enhanced message renderer with image support
  const renderMessage = (msg, index) => {
    const isUser = msg.role === "user";
    
    return (
      <div 
        key={index} 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div 
          className={`max-w-[75%] rounded-lg p-3 ${
            isUser ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'
          }`}
        >
          {/* Display image if present */}
          {msg.parts && msg.parts[0] && msg.parts[0].img && (
            <div className="mb-2">
              <img 
                src={msg.parts[0].img} 
                alt="Shared image"
                className="rounded-lg max-h-60 object-cover"
              />
            </div>
          )}
          
          {/* Display text */}
          <div className="whitespace-pre-wrap">
            {msg.parts && msg.parts[0] && msg.parts[0].text}
          </div>
        </div>
      </div>
    );
  };

  const handleNewChat = () => {
    clearCurrentChat();
    navigate("/aura-ai");
  };

  return (
    <div className="flex flex-col h-screen pt-16"> {/* Changed this line */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with chat history */}
        <div className="w-64 bg-base-200 border-r border-base-300 overflow-y-auto hidden md:block p-4">
          <div className="mb-4">
            <button 
              onClick={handleNewChat}
              className="btn btn-primary w-full gap-2"
            >
              <PlusCircle size={16} />
              New Chat
            </button>
          </div>
          
          <div className="space-y-2">
            {/* Add check to ensure chats is an array before mapping */}
            {Array.isArray(chats) && chats.map(chat => (
              <Link
                key={chat._id}
                to={`/aura-ai/chats/${chat._id}`}
                className={`flex items-center p-2 rounded-lg hover:bg-base-300 transition-colors ${
                  currentChat && currentChat._id === chat._id ? 'bg-base-300' : ''
                }`}
              >
                <MessageCircle size={16} className="mr-2" />
                <span className="text-sm truncate flex-1">{chat.title}</span>
              </Link>
            ))}
            
            {chats && Array.isArray(chats) && chats.length === 0 && (
              <div className="text-center text-base-content/60 text-sm p-4">
                No chat history yet
              </div>
            )}
          </div>
        </div>
        
        {/* Main chat area */}
        <div className="flex-1 overflow-auto flex flex-col">
          {!currentChat ? (
            <NoChatSelected 
              title="Welcome to Aura AI"
              description="Your personal AI assistant that helps with mental wellness. Start a conversation by sending a message below."
            />
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="p-4 bg-base-200 border-b border-base-300">
                <h2 className="text-xl font-bold">
                  {currentChat.title || "Chat with Aura"}
                </h2>
              </div>
              
              <div className="flex-1 p-4 overflow-auto">
                {/* Chat messages - display in chronological order */}
                <div className="flex flex-col">
                  {Array.isArray(history) && history.map((message, index) => renderMessage(message, index))}
                  
                  {loading && (
                    <div className="flex justify-center my-4">
                      <Loader className="animate-spin" />
                    </div>
                  )}
                  
                  {/* Add typing indicator to chat window */}
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-base-200 text-base-content rounded-lg p-3">
                        <div className="flex gap-1 items-center">
                          <span className="loading loading-dots loading-sm"></span>
                          <span className="text-xs opacity-70">Aura is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={chatEndRef} />
              </div>
            </div>
          )}
          
          {/* Enhanced Input area with image preview */}
          <form onSubmit={handleSendMessage} className="border-t border-base-300 p-4 bg-base-100">
            {/* Image preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-20 w-auto rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-base-300 rounded-full p-1"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {/* Make sure the input field is not disabled by default */}
            <div className="flex items-center gap-2">
              {/* Image upload button */}
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-circle btn-sm"
                disabled={loading || uploadingImage}
                title="Add image"
              >
                <ImageIcon size={18} />
              </button>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {/* Fix the text input to ensure it's not disabled and handles input properly */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aura anything..."
                className="input input-bordered flex-1"
                disabled={false} // Explicitly set to false to ensure input is always enabled
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() || image) {
                      handleSendMessage(e);
                    }
                  }
                }}
              />
              
              {/* Send button with improved loading state */}
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || uploadingImage || (!input.trim() && !image)}
              >
                {loading || uploadingImage ? (
                  <Sparkles className="size-4 animate-pulse" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuraAIPage;
