export type CourseStatus = "draft" | "published" | "archived";
export type CourseInput = {
  title: string;
  summary: string;
  description: string;
  minimum_level: number;
  status: CourseStatus;
};
export type CourseDocument = {
  id: number;
  lesson_id: number;
  filename: string;
  size_bytes: number;
};
export type CourseLessonRecord = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  youtube_video_id: string;
  position: number;
};
export type CourseLesson = CourseLessonRecord & {
  documents: CourseDocument[];
};
export type Course = CourseInput & {
  id: number;
  created_at: string;
  updated_at: string;
  lesson_count?: number;
};
export type CourseDetail = Course & { lessons: CourseLesson[] };
export type LessonInput = {
  title: string;
  description: string;
  youtube_url: string;
};
export type CourseLearner = {
  user_id: number;
  name: string;
  member_id: string | null;
  completed_lessons: number;
  total_lessons: number;
  started_at: string;
  last_activity_at: string;
};
export type CoursePage<T> = {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};
export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Draf",
  published: "Tayang",
  archived: "Diarsipkan",
};
export const COURSE_LEVEL_OPTIONS = [
  { value: 0, label: "Jamaah" },
  { value: 3, label: "Aktivis" },
  { value: 6, label: "Kader" },
  { value: 10, label: "Kader Lanjut" },
];
