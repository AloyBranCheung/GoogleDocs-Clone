import "./global.css";
import TextEditor from "./components/texteditor/TextEditor";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={`/documents/${uuidv4()}`} replace={false} />}
        />
        <Route path="/documents/:id" element={<TextEditor />} />
      </Routes>
    </BrowserRouter>
  );
}
