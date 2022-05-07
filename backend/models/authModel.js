const { model, Schema } = require('mongoose');

const registerSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    uType: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      required: false,
      default: 'created',
    },
    verified: {
      type: Boolean,
      required: false,
      default: false,
    },
    createdAt: Number,
    updatedAt: Number,
  },
  { timestamps: { currentTime: () => Math.floor(Date.now() / 1000) } }
);

module.exports = model('user', registerSchema);
