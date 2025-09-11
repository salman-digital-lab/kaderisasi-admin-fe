import React, { useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import type { QuillOptions } from "quill";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

const quillModules: QuillOptions["modules"] = {
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
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  },
};

const quillFormats: QuillOptions["formats"] = [
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
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // Function to convert URLs to links
      const convertUrlsToLinks = () => {
        const text = quill.getText();
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        let match;
        
        // Store cursor position
        const range = quill.getSelection();
        
        while ((match = urlRegex.exec(text)) !== null) {
          const urlStart = match.index;
          
          // Check if this text is already a link
          const format = quill.getFormat(urlStart, match[0].length);
          if (!format.link) {
            // Format the URL as a link
            quill.formatText(urlStart, match[0].length, 'link', match[0]);
          }
        }
        
        // Restore cursor position
        if (range) {
          quill.setSelection(range);
        }
      };

      // Handle text changes to convert URLs to links
      quill.on('text-change', (_delta, _oldDelta, source) => {
        if (source === 'user') {
          // Small delay to ensure the change is complete
          setTimeout(convertUrlsToLinks, 100);
        }
      });
    }
  }, []);

  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <ReactQuill
      ref={quillRef}
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
