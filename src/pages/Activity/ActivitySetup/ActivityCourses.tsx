import type { ReactElement } from "react";
import CourseConfiguration from "../../../components/LinkedCourses/CourseConfiguration";
export default function ActivityCourses({
  activityId,
  onDirtyChange,
  onBusyChange,
}: {
  activityId: number;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}): ReactElement {
  return (
    <CourseConfiguration
      kind="activity"
      ownerId={activityId}
      onDirtyChange={onDirtyChange}
      onBusyChange={onBusyChange}
    />
  );
}
