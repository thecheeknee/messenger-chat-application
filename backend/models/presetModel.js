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
    responseType: {
      type: String,
      required: true,
    },
    expectedResponse: {
      type: Object,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = model('preset', presetSchema);
