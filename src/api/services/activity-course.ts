import axios from "../axios";
import type { ActivityCourse } from "../../types/model/activity-course";
import type { CoursePage } from "../../types/model/course";

export async function getActivityCourseOptions(
  search: string,
  page: number,
): Promise<CoursePage<ActivityCourse>> {
  return (
    await axios.get<{ data: CoursePage<ActivityCourse> }>(
      "/activities/course-options",
      { params: { search, page, per_page: 50 } },
    )
  ).data.data;
}

export async function getActivityCourses(
  id: number,
): Promise<ActivityCourse[]> {
  return (
    await axios.get<{ data: ActivityCourse[] }>(`/activities/${id}/courses`)
  ).data.data;
}

export async function saveActivityCourses(
  id: number,
  courseIds: number[],
): Promise<ActivityCourse[]> {
  return (
    await axios.put<{ data: ActivityCourse[] }>(`/activities/${id}/courses`, {
      course_ids: courseIds,
    })
  ).data.data;
}
