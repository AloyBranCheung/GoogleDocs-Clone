import React, { useCallback, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import Quill from "quill";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor() {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const { id: documentId } = useParams();

  // SocketIO setup
  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL, {
      transports: ["websocket"],
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // send to server documentId to attach user to a unique room OR if there is
  // already a document saved, will send that document back to user
  useEffect(() => {
    if (socket == null || quill == null) {
      return;
    }
    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });
    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // save document, set up a timer
  useEffect(() => {
    if (socket == null || quill == null) {
      return;
    }
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // render Quill into a div
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) {
      return;
    }
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable(); // disables text editor at start until socket returns
    q.setText("Loading..."); // displays loading text while waiting for server
    setQuill(q);
  }, []);

  // useEffect to send data to server and then close change detection
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler =
      ("text-change",
      (delta, oldDelta, source) => {
        if (source !== "user") {
          return;
        }
        socket.emit("send-changes", delta);
      });

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  // useEffect to receive data from server and then close connection
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler =
      ("text-change",
      (delta) => {
        quill.updateContents(delta);
      });

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  return <div className="container" ref={wrapperRef}></div>;
}
