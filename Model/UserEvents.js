import mongoose from "mongoose";
import Events from "./Events.js";

const userEventSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Events,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: "0s" }, // TTL index with 0 seconds, expiration controlled by field value
  },
});

export default mongoose.model("UserEvents", userEventSchema);
