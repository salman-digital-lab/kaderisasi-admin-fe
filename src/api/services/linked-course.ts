import axios from "../axios";
import type {
  ActivityCourse,
  ActivityCourseProgress,
} from "../../types/model/activity-course";
import type { CoursePage } from "../../types/model/course";
export type CourseOwner = "activity" | "club";
export type CoursePerson = {
  id: number;
  name: string;
  email: string;
  registration_status: string;
  course_progress: ActivityCourseProgress[];
};
export type ProgressFilters = {
  search?: string;
  status?: string;
  course_id?: number;
  course_completion?: string;
  page: number;
  per_page: number;
};
export type ProgressPage = CoursePage<CoursePerson> & {
  courses: ActivityCourse[];
};
const prefix = (kind: CourseOwner): string =>
  kind === "activity" ? "activities" : "clubs";
export async function getLinkedCourses(
  kind: CourseOwner,
  id: number,
): Promise<ActivityCourse[]> {
  return (
    await axios.get<{ data: ActivityCourse[] }>(
      `/${prefix(kind)}/${id}/courses`,
    )
  ).data.data;
}
export async function saveLinkedCourses(
  kind: CourseOwner,
  id: number,
  courseIds: number[],
): Promise<ActivityCourse[]> {
  return (
    await axios.put<{ data: ActivityCourse[] }>(
      `/${prefix(kind)}/${id}/courses`,
      { course_ids: courseIds },
    )
  ).data.data;
}
export async function getLinkedCourseOptions(
  kind: CourseOwner,
  search: string,
  page: number,
): Promise<CoursePage<ActivityCourse>> {
  return (
    await axios.get<{ data: CoursePage<ActivityCourse> }>(
      `/${prefix(kind)}/course-options`,
      { params: { search, page, per_page: 10 } },
    )
  ).data.data;
}
export async function getCoursePeople(
  kind: CourseOwner,
  id: number,
  filters: ProgressFilters,
): Promise<ProgressPage> {
  return (
    await axios.get<{ data: ProgressPage }>(
      `/${prefix(kind)}/${id}/course-progress`,
      { params: filters },
    )
  ).data.data;
}
export async function exportCoursePeople(
  kind: CourseOwner,
  id: number,
): Promise<Blob> {
  return (
    await axios.get<Blob>(`/${prefix(kind)}/${id}/course-progress/export`, {
      responseType: "blob",
    })
  ).data;
}
