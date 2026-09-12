import { useRef, useState, type ReactElement } from "react";
import { Alert, Button, Popconfirm, Typography, Upload, message } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import {
  downloadCourseDocument,
  removeCourseDocument,
  uploadCourseDocument,
} from "../../../api/services/course";
import type { CourseDocument } from "../../../types/model/course";
import {
  formatDocumentSize,
  MAX_COURSE_PDF_BYTES,
} from "../utils/course-editor";

type Operation = { kind: "upload" | "remove" | "download"; id?: number };
type Props = {
  courseId: number;
  lessonId: number;
  initialDocuments: CourseDocument[];
  canManage: boolean;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onUpdated: () => Promise<void>;
};

export default function LessonDocuments({
  courseId,
  lessonId,
  initialDocuments,
  canManage,
  disabled,
  onBusyChange,
  onUpdated,
}: Props): ReactElement {
  const [documents, setDocuments] = useState(initialDocuments);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [failure, setFailure] = useState("");
  const running = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();
  const busy = disabled || operation !== null;

  const perform = async (
    next: Operation,
    action: () => Promise<void>,
    success: string,
    errorMessage: string,
  ): Promise<void> => {
    if (running.current || disabled) return;
    running.current = true;
    setOperation(next);
    onBusyChange(true);
    setFailure("");
    try {
      await action();
      if (success) messageApi.success(success);
      if (next.kind !== "download") await onUpdated();
    } catch {
      setFailure(errorMessage);
    } finally {
      running.current = false;
      setOperation(null);
      onBusyChange(false);
    }
  };

  return (
    <div>
      {contextHolder}
      <Typography.Paragraph type="secondary">
        PDF bersifat opsional. Unggahan dan penghapusan langsung tersimpan,
        terpisah dari perubahan judul, video, dan deskripsi.
      </Typography.Paragraph>
      {failure && (
        <Alert
          type="error"
          showIcon
          title={failure}
          className="course-feedback"
        />
      )}
      {documents.length ? (
        <ul className="course-document-list" aria-label="Dokumen materi">
          {documents.map((document) => (
            <li key={document.id} className="course-document">
              <div className="course-document-info">
                <Button
                  type="link"
                  disabled={busy}
                  loading={
                    operation?.kind === "download" &&
                    operation.id === document.id
                  }
                  onClick={() =>
                    void perform(
                      { kind: "download", id: document.id },
                      () =>
                        downloadCourseDocument(courseId, lessonId, document),
                      "",
                      "PDF belum dapat diunduh. Klik nama dokumen untuk mencoba lagi.",
                    )
                  }
                >
                  {document.filename}
                </Button>
                <small>PDF · {formatDocumentSize(document.size_bytes)}</small>
              </div>
              {canManage && (
                <Popconfirm
                  title="Hapus PDF dari materi?"
                  description={document.filename}
                  okText="Hapus PDF"
                  cancelText="Batal"
                  okButtonProps={{ danger: true }}
                  onConfirm={() =>
                    perform(
                      { kind: "remove", id: document.id },
                      async () => {
                        await removeCourseDocument(
                          courseId,
                          lessonId,
                          document.id,
                        );
                        setDocuments((current) =>
                          current.filter((item) => item.id !== document.id),
                        );
                      },
                      "PDF dihapus dari materi.",
                      "PDF belum berhasil dihapus. Coba hapus kembali.",
                    )
                  }
                >
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined aria-hidden />}
                    aria-label={`Hapus PDF ${document.filename}`}
                    disabled={busy}
                    loading={
                      operation?.kind === "remove" &&
                      operation.id === document.id
                    }
                  />
                </Popconfirm>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Typography.Paragraph type="secondary">
          Belum ada PDF pendamping.
        </Typography.Paragraph>
      )}
      {canManage && (
        <Upload
          accept=".pdf,application/pdf"
          showUploadList={false}
          disabled={busy}
          beforeUpload={(file) => {
            if (busy || running.current) return Upload.LIST_IGNORE;
            if (
              !file.name.toLowerCase().endsWith(".pdf") ||
              !file.size ||
              file.size > MAX_COURSE_PDF_BYTES
            ) {
              setFailure(
                "Pilih file PDF yang tidak kosong, maksimal 20 MB per file.",
              );
              return Upload.LIST_IGNORE;
            }
            void perform(
              { kind: "upload" },
              async () => {
                const document = await uploadCourseDocument(
                  courseId,
                  lessonId,
                  file,
                );
                setDocuments((current) => [...current, document]);
              },
              "PDF berhasil diunggah.",
              "PDF belum berhasil diunggah. Pilih ulang file untuk mencoba lagi.",
            );
            return false;
          }}
        >
          <Button
            icon={<UploadOutlined aria-hidden />}
            disabled={busy}
            loading={operation?.kind === "upload"}
          >
            Unggah PDF
          </Button>
        </Upload>
      )}
      <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
        Maksimal 20 MB per file. Klik nama dokumen untuk mengunduh.
      </Typography.Paragraph>
    </div>
  );
}
