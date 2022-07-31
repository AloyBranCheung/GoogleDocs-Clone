const { Schema, model } = require("mongoose");

const Document = {
  _id: String,
  data: Object, // whatever quill sends
};

module.exports = model("Document", Document);
