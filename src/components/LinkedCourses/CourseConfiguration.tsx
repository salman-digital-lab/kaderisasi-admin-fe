import { useState, type ReactElement } from "react";
import { useRequest } from "ahooks";
import { Alert, App, Button, Card, List, Skeleton, Typography } from "antd";
import { SettingOutlined } from "@ant-design/icons";
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
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const permissions = usePermissions();
  const canManage = permissions.includes(
    kind === "activity" ? "activities.manage" : "clubs.manage",
  );
  const { data, loading, error, refresh, mutate } = useRequest(
    () => getLinkedCourses(kind, ownerId),
    { refreshDeps: [kind, ownerId] },
  );
  return (
    <Card
      title="Kelas terkait"
      extra={
        canManage &&
        data && (
          <Button icon={<SettingOutlined />} onClick={() => setOpen(true)}>
            Pilih kelas online
          </Button>
        )
      }
    >
      <Typography.Paragraph type="secondary">
        Kelas dipakai untuk memantau progres belajar peserta dan tidak membatasi
        pendaftaran.
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
        <List
          dataSource={data ?? []}
          locale={{
            emptyText: canManage
              ? "Belum ada kelas terkait. Pilih kelas online untuk mulai memantau progres."
              : "Belum ada kelas terkait.",
          }}
          renderItem={(course) => (
            <List.Item key={course.id}>
              <CourseDetails course={course} />
            </List.Item>
          )}
        />
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
            message.success("Kelas terkait tersimpan");
            onSaved?.();
          }}
        />
      )}
    </Card>
  );
}
