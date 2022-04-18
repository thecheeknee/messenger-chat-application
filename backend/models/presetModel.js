const { model, Schema } = require('mongoose');

const presetSchema = new Schema(
  {
    tag: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model('preset', presetSchema);
