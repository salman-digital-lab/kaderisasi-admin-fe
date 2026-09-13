import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, List, Skeleton, Typography } from "antd";
import {
  getLinkedCourses,
  type CourseOwner,
} from "../../api/services/linked-course";
import { usePermissions } from "../../stores/authStore";
import CourseChooser, { CourseDetails } from "./CourseChooser";

export default function CourseConfiguration({
  kind,
  ownerId,
  onDirtyChange,
  onBusyChange,
  onSaved,
}: {
  kind: CourseOwner;
  ownerId: number;
  onDirtyChange: (value: boolean) => void;
  onBusyChange: (value: boolean) => void;
  onSaved?: () => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const permissions = usePermissions();
  const canManage = permissions.includes(
    kind === "activity" ? "activities.manage" : "clubs.manage",
  );
  const { data, loading, error, refresh, mutate } = useRequest(
    () => getLinkedCourses(kind, ownerId),
    { refreshDeps: [kind, ownerId] },
  );
  return (
    <section
      aria-labelledby="activity-courses-title"
      style={{ marginBlock: 24 }}
    >
      <Typography.Title id="activity-courses-title" level={4}>
        Kelas online terkait
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Pilih kelas untuk memantau progres pendaftar. Pilihan ini tidak
        membatasi pendaftaran. Progres mengikuti materi yang masih tersedia dan
        dapat berubah ketika materi diperbarui.
      </Typography.Paragraph>
      {error ? (
        <Alert
          type="error"
          title="Kelas terkait gagal dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : loading ? (
        <Skeleton active />
      ) : (
        <>
          {saved && <Alert type="success" title="Kelas terkait tersimpan" />}
          <List
            dataSource={data ?? []}
            locale={{ emptyText: "Belum ada kelas terkait." }}
            renderItem={(course) => (
              <List.Item key={course.id}>
                <CourseDetails course={course} />
              </List.Item>
            )}
          />
          {canManage && (
            <Button
              type="primary"
              onClick={() => {
                setSaved(false);
                setOpen(true);
              }}
            >
              Pilih kelas online
            </Button>
          )}
        </>
      )}
      {open && data && (
        <CourseChooser
          kind={kind}
          ownerId={ownerId}
          initial={data}
          onDirtyChange={onDirtyChange}
          onBusyChange={onBusyChange}
          onClose={() => setOpen(false)}
          onSaved={(rows) => {
            mutate(rows);
            setOpen(false);
            setSaved(true);
            onSaved?.();
          }}
        />
      )}
    </section>
  );
}
