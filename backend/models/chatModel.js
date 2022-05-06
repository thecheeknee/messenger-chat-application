const { model, Schema } = require('mongoose');

const chatSchema = new Schema(
  {
    agentId: {
      type: String,
      required: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    resolution: {
      type: String,
      required: false,
    },
    rating: {
      type: String,
      required: false,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: false,
    },
    chatEndedBy: {
      type: String,
      required: false,
      default: 'agent',
    },
  },
  { timestamps: true }
);

module.exports = model('chat', chatSchema);
