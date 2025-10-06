import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Button, Space, Tooltip } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import "./RichTextEditor.css";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = "",
  onChange,
  placeholder = "Tulis sesuatu...",
  minHeight = "200px",
  maxHeight = "400px",
  disabled = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL:", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`rich-text-editor ${disabled ? "rich-text-editor-disabled" : ""}`}
    >
      {!disabled && (
        <div className="rich-text-editor-toolbar">
          <Space wrap>
            <Button
              size="small"
              type={editor.isActive("bold") ? "primary" : "default"}
              icon={<BoldOutlined />}
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
            />
            <Button
              size="small"
              type={editor.isActive("italic") ? "primary" : "default"}
              icon={<ItalicOutlined />}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
            />
            <Button
              size="small"
              type={editor.isActive("underline") ? "primary" : "default"}
              icon={<UnderlineOutlined />}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              disabled={disabled}
            />
            <Button
              size="small"
              type={editor.isActive("strike") ? "primary" : "default"}
              icon={<StrikethroughOutlined />}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={disabled}
            />

            <div style={{ width: 1, height: 24, backgroundColor: "#d9d9d9" }} />

            <Button
              size="small"
              type={editor.isActive("bulletList") ? "primary" : "default"}
              icon={<UnorderedListOutlined />}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={disabled}
            />
            <Button
              size="small"
              type={editor.isActive("orderedList") ? "primary" : "default"}
              icon={<OrderedListOutlined />}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={disabled}
            />

            <div style={{ width: 1, height: 24, backgroundColor: "#d9d9d9" }} />

            <Button
              size="small"
              type={
                editor.isActive({ textAlign: "left" }) ? "primary" : "default"
              }
              icon={<AlignLeftOutlined />}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              disabled={disabled}
            />
            <Button
              size="small"
              type={
                editor.isActive({ textAlign: "center" }) ? "primary" : "default"
              }
              icon={<AlignCenterOutlined />}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              disabled={disabled}
            />
            <Button
              size="small"
              type={
                editor.isActive({ textAlign: "right" }) ? "primary" : "default"
              }
              icon={<AlignRightOutlined />}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              disabled={disabled}
            />

            <div style={{ width: 1, height: 24, backgroundColor: "#d9d9d9" }} />

            <Tooltip title="Tambah Link">
              <Button
                size="small"
                type={editor.isActive("link") ? "primary" : "default"}
                icon={<LinkOutlined />}
                onClick={setLink}
                disabled={disabled}
              />
            </Tooltip>

            <div style={{ width: 1, height: 24, backgroundColor: "#d9d9d9" }} />

            <Button
              size="small"
              icon={<UndoOutlined />}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo() || disabled}
            />
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo() || disabled}
            />
          </Space>
        </div>
      )}

      <EditorContent
        editor={editor}
        style={{
          minHeight,
          maxHeight,
        }}
      />
    </div>
  );
};

