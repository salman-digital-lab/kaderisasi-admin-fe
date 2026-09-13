import type { CourseStatus } from "./course";

export type ActivityCourse = {
  id: number;
  title: string;
  status: CourseStatus;
  lesson_count: number;
};

export type CourseProgressStatus =
  | "completed"
  | "in_progress"
  | "not_started"
  | "unverifiable"
  | "empty";

export type ActivityCourseProgress = {
  course_id: number;
  status: CourseProgressStatus;
  completed_lessons: number;
  total_lessons: number;
};

export const COURSE_PROGRESS_LABELS: Record<CourseProgressStatus, string> = {
  completed: "Selesai",
  in_progress: "Sedang berlangsung",
  not_started: "Belum mulai",
  unverifiable: "Tidak dapat diverifikasi",
  empty: "Belum ada materi",
};
