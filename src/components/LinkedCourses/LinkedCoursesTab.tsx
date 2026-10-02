import { useState, type ReactElement } from "react";
import { Flex } from "antd";
import UnsavedChangesGuard from "../common/UnsavedChangesGuard";
import CourseConfiguration from "./CourseConfiguration";
import CourseProgressTable from "./CourseProgressTable";
import { usePermissions } from "../../stores/authStore";
import type { CourseOwner } from "../../api/services/linked-course";
export default function LinkedCoursesTab({
  kind,
  ownerId,
}: {
  kind: CourseOwner;
  ownerId: number;
}): ReactElement {
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const permissions = usePermissions();
  const permission =
    kind === "activity" ? "activity_registrations" : "club_registrations";
  return (
    <Flex vertical gap={16}>
      <UnsavedChangesGuard dirty={dirty || busy} includeSearchChanges />
      <CourseConfiguration
        kind={kind}
        ownerId={ownerId}
        onDirtyChange={setDirty}
        onBusyChange={setBusy}
        onSaved={() => setRevision((value) => value + 1)}
      />
      {permissions.includes(permission + ".read") && (
        <CourseProgressTable
          key={revision}
          kind={kind}
          ownerId={ownerId}
          revision={revision}
          canExport={permissions.includes(permission + ".export")}
        />
      )}
    </Flex>
  );
}
