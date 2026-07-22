import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['client', 'admin', 'employee'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Pending', 'Resolved', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  messages: [ticketMessageSchema],
  feedbackRating: { type: Number, min: 1, max: 5 },
  feedbackComment: { type: String },
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);
