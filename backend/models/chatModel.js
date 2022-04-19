const { model, Schema } = require('mongoose');

const chatSchema = new Schema(
  {
    agent: {
      type: String,
      required: true,
    },
    customer: {
      type: String,
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
  },
  { timestamps: true }
);

module.exports = model('chat', chatSchema);
