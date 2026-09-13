import { useState, type ReactElement } from "react";
import UnsavedChangesGuard from "../../../../components/common/UnsavedChangesGuard";
import ActivityCourses from "../../ActivitySetup/ActivityCourses";

export default function ActivityCoursesTab({
  activityId,
}: {
  activityId: number;
}): ReactElement {
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <UnsavedChangesGuard dirty={dirty || busy} includeSearchChanges />
      <ActivityCourses
        activityId={activityId}
        onDirtyChange={setDirty}
        onBusyChange={setBusy}
      />
    </>
  );
}
