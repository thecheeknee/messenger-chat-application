const { model, Schema } = require('mongoose');

const messageSchema = new Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    receiverId: {
      type: String,
      required: true,
    },
    message: {
      text: {
        type: String,
        default: '',
      },
      options: {
        type: Object,
        default: {},
      },
      responseType: {
        type: String,
        default: '',
      },
    },
  },
  { timestamps: true }
);

module.exports = model('message', messageSchema);
