require("dotenv").config("./.env");
const http = require("http");

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/_health" && req.method === "GET") {
    res.statusCode = 200;
    res.statusMessage = "OK";
    res.end(JSON.stringify({ message: "OK" }));
  } else {
    res.statusCode = 404;
    res.status = "Not Found";
    res.end(JSON.stringify({ message: "Not found." }));
  }
});

// require SocketIO and Mongoose
const io = require("socket.io")(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});
const mongoose = require("mongoose");
const Document = require("./document");

// Connect to mongodb atlas
mongoose.connect(process.env.MONGODB_URL);

// find or create document
const findOrCreateDocument = async (id) => {
  const defaultValue = "Try typing something!";
  if (id == null) {
    return;
  }
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
};

// socketIO connection
io.on("connection", (socket) => {
  console.log("connected");
  // get-document event: the data server.js is receiving is documentId
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);

    // put socket into own room based on unique documentId so everyone can join
    // the same room
    socket.join(documentId);

    // load-document event: is for quill to setContents
    socket.emit("load-document", document.data);

    // send-changes event: broadcast data back to everyone but the sender and send changes to
    // specific room
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    // save-document event: save the document, we already have load a document
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
