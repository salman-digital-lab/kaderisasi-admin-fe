import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { QuillOptionsStatic } from "quill";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

const quillModules: QuillOptionsStatic["modules"] = {
  toolbar: {
    container: [
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ header: 1 }, { header: 2 }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ["clean"],
    ],
  },
};

const quillFormats: QuillOptionsStatic["formats"] = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "link",
  "image",
  "align",
  "color",
  "code-block",
];

const QuillEditor = ({ value, onChange, style }: QuillEditorProps) => {
  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <ReactQuill
      theme="snow"
      modules={quillModules}
      formats={quillFormats}
      value={value}
      onChange={handleChange}
      style={style}
    />
  );
};

export default QuillEditor;
