import type { ReactElement } from "react";
import LinkedCoursesTab from "../../../../components/LinkedCourses/LinkedCoursesTab";
export default function ActivityCoursesTab({
  activityId,
}: {
  activityId: number;
}): ReactElement {
  return <LinkedCoursesTab kind="activity" ownerId={activityId} />;
}
