import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";

import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const ChatContainer = () => {
  const { selectedUser, messages, loading, getMessages, addMessage } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const lastMessageRef = useRef(null);

  useEffect(() => {
    // Make sure selectedUser is available before fetching messages
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, getMessages]);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleNewMessage = (newMessage) => {
      // Check if the message is from the currently selected user
      if (newMessage.senderId === selectedUser._id) {
        addMessage(newMessage);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser, addMessage]);

  // Make sure we have a valid user selected
  if (!selectedUser) return null;

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b border-base-300 flex items-center gap-3">
        <div className="avatar">
          <div className="w-10 h-10 rounded-full border">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>
        <div>
          <h3 className="font-medium">{selectedUser.fullName}</h3>
          <p className="text-xs text-base-content/60">{selectedUser.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {loading ? (
          <div className="space-y-4">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        ) : messages.length > 0 ? (
          messages.map((message, index) => {
            const isFromCurrentUser = message.senderId === authUser._id;
            const isLastMessage = index === messages.length - 1;
            return (
              <div
                key={message._id}
                className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                ref={isLastMessage ? lastMessageRef : null}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    isFromCurrentUser ? "bg-primary text-primary-content" : "bg-base-300"
                  }`}
                >
                  {message.text}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="message image"
                      className="mt-2 rounded-md max-h-60 object-contain"
                    />
                  )}
                  <span
                    className={`text-[10px] block mt-1 ${
                      isFromCurrentUser ? "text-primary-content/80" : "text-base-content/70"
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-base-content/50 py-10">
            No messages yet. Send one to start the conversation!
          </div>
        )}
      </div>

      <MessageInput receiverId={selectedUser._id} />
    </div>
  );
};

export default ChatContainer;
