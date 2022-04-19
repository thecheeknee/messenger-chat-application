const { model, Schema } = require('mongoose');

const chatSchema = new Schema(
  {
    agent: {
      type: Object,
      required: true,
    },
    customer: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    resolution: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    chatEndedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model('chat', chatSchema);
