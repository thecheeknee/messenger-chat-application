const { model, Schema } = require('mongoose');

const adminSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    value: {
      type: Object,
      required: true,
    },
    status: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: { currentTime: () => Math.floor(Date.now() / 1000) } }
);

module.exports = model('admin', adminSchema);