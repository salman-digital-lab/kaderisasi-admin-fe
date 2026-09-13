import type { ActivityCourse } from "../../../../types/model/activity-course";
import { COURSE_PROGRESS_LABELS } from "../../../../types/model/activity-course";
import type { ColumnConfig } from "./columns";

export function courseColumns(courses: ActivityCourse[]): ColumnConfig[] {
  return courses.map((course) => ({
    key: `course_${course.id}`,
    title: `${course.title} (#${course.id})`,
    dataIndex: "course_progress",
    visible: true,
    width: 240,
    render: (_, record) => {
      const progress = record.course_progress?.find(
        (item) => item.course_id === course.id,
      );
      if (!progress) return "Progres tidak tersedia. Muat ulang peserta.";
      return (
        <span style={{ whiteSpace: "normal" }}>
          {COURSE_PROGRESS_LABELS[progress.status]}
          {progress.status !== "unverifiable" &&
            ` · ${progress.completed_lessons}/${progress.total_lessons} materi`}
        </span>
      );
    },
  }));
}
