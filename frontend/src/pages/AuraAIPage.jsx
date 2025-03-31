import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import api from "../lib/axios";
import { IKContext, IKUpload } from "imagekitio-react";
import { Loader2, ChevronLeft, Send, Image, X } from "lucide-react";
import toast from "react-hot-toast";

// Get ImageKit configuration from environment variables
const urlEndpoint = import.meta.env.VITE_IMAGE_KIT_ENDPOINT;
const publicKey = import.meta.env.VITE_IMAGE_KIT_PUBLIC_KEY;

const AuraAIPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  
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

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get("/chats");
        setChats(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error("Failed to load chat history");
        setChats([]);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchChatMessages = async () => {
        setIsLoading(true);
        try {
          const response = await api.get(`/chats/${id}`);
          setSelectedChat(response.data.chat);
          setMessages(Array.isArray(response.data.messages) ? response.data.messages : []);
        } catch (error) {
          toast.error("Failed to load chat messages");
          navigate("/aura-ai");
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchChatMessages();
    } else {
      setSelectedChat(null);
      setMessages([]);
    }
  }, [id, navigate]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if ((!inputMessage.trim() && !uploadedImageUrl) || isSending) return;
    
    setIsSending(true);
    const newMessage = {
      text: inputMessage.trim(),
      image: uploadedImageUrl || null,
    };
    
    try {
      if (!selectedChat) {
        // Create a new chat
        const chatRes = await api.post("/chats", { title: inputMessage.substring(0, 30) });
        const messageRes = await api.post(`/chats/${chatRes.data._id}/messages`, newMessage);
        
        setSelectedChat(chatRes.data);
        setMessages([messageRes.data]);
        navigate(`/aura-ai/chats/${chatRes.data._id}`);
      } else {
        // Add to existing chat
        const messageRes = await api.post(`/chats/${selectedChat._id}/messages`, newMessage);
        setMessages(prevMessages => Array.isArray(prevMessages) ? [...prevMessages, messageRes.data] : [messageRes.data]);
        
        // AI response is handled by the backend
      }
      
      // Reset states
      setInputMessage("");
      setImagePreview(null);
      setUploadedImageUrl(null);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

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
                  onClick={() => setShowNewChat(true)}
                >
                  New Chat
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2">
                {Array.isArray(chats) && chats.length > 0 ? (
                  chats.map(chat => (
                    <button
                      key={chat._id}
                      onClick={() => navigate(`/aura-ai/chats/${chat._id}`)}
                      className={`w-full p-3 text-left rounded-lg mb-2 
                        ${selectedChat?._id === chat._id ? 'bg-primary/20' : 'hover:bg-base-300'}`}
                    >
                      <p className="font-medium truncate">{chat.title}</p>
                      <p className="text-xs text-base-content/60">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))
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
                {selectedChat ? (
                  <>
                    <button 
                      className="btn btn-sm btn-ghost btn-circle mr-3"
                      onClick={() => navigate('/aura-ai')}
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <div>
                      <h2 className="font-medium">{selectedChat.title}</h2>
                      <p className="text-xs text-base-content/60">
                        {new Date(selectedChat.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <h2 className="font-medium">New Conversation with Aura AI</h2>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : !selectedChat && (!Array.isArray(chats) || chats.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                      <img src="frontend/public/bot.png" alt="AI Assistant" className="size-16" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Welcome to Aura AI</h3>
                    <p className="text-base-content/70 max-w-md">
                      Your AI health assistant. Ask me anything about health, wellness, or medical questions.
                    </p>
                  </div>
                ) : Array.isArray(messages) && messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div 
                      key={message._id || index}
                      className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
                      ref={index === messages.length - 1 ? messagesEndRef : null}
                    >
                      <div 
                        className={`max-w-[80%] p-4 rounded-xl ${
                          message.isAI 
                            ? 'bg-base-200 text-base-content' 
                            : 'bg-primary text-primary-content'
                        }`}
                      >
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Attached"
                            className="max-h-40 rounded-lg object-cover mb-2"
                          />
                        )}
                        <p>{message.text}</p>
                        <p className="text-[10px] opacity-70 mt-1 text-right">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-base-content/60 py-10">
                    No messages yet. Send one to start the conversation!
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
                        disabled={isUploading || isSending}
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
                      disabled={isSending}
                    />
                    
                    <button
                      type="submit"
                      className="btn btn-circle btn-primary"
                      disabled={(!inputMessage.trim() && !uploadedImageUrl) || isSending || isUploading}
                    >
                      {isSending ? (
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
