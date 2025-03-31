import mongoose from "mongoose";

const userChatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chats: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
    },
  ],
});

const UserChats = mongoose.model("UserChats", userChatsSchema);

export default UserChats;
