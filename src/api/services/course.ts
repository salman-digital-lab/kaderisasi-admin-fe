import type { AxiosResponse } from "axios";
import axios from "../axios";
import { handleError } from "../errorHandling";
import type {
  Course,
  CourseDetail,
  CourseInput,
  CourseLessonRecord,
  CourseDocument,
  CourseLearner,
  CoursePage,
  LessonInput,
} from "../../types/model/course";

async function result<T>(
  request: Promise<AxiosResponse<{ data: T }>>,
): Promise<T> {
  try {
    return (await request).data.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
}
export function getCourses(params: {
  search: string;
  status: string;
  page: number;
  per_page: number;
}): Promise<CoursePage<Course>> {
  return result(axios.get("/courses", { params }));
}
export function getCourse(id: number): Promise<CourseDetail> {
  return result(axios.get(`/courses/${id}`));
}
export function createCourse(input: CourseInput): Promise<Course> {
  return result(axios.post("/courses", input));
}
export function saveCourse(id: number, input: CourseInput): Promise<Course> {
  return result(axios.put(`/courses/${id}`, input));
}
export function saveCourseLesson(
  id: number,
  lessonId: number | undefined,
  input: LessonInput,
): Promise<CourseLessonRecord> {
  return result(
    lessonId
      ? axios.put(`/courses/${id}/lessons/${lessonId}`, input)
      : axios.post(`/courses/${id}/lessons`, input),
  );
}
export function removeCourseLesson(
  id: number,
  lessonId: number,
): Promise<null> {
  return result(axios.delete(`/courses/${id}/lessons/${lessonId}`));
}
export function reorderCourseLessons(
  id: number,
  lessonIds: number[],
): Promise<null> {
  return result(
    axios.put(`/courses/${id}/lesson-order`, { lesson_ids: lessonIds }),
  );
}
export function uploadCourseDocument(
  id: number,
  lessonId: number,
  file: File,
): Promise<CourseDocument> {
  const body = new FormData();
  body.append("file", file);
  return result(
    axios.post(`/courses/${id}/lessons/${lessonId}/documents`, body, {
      timeout: 120000,
    }),
  );
}
export function removeCourseDocument(
  id: number,
  lessonId: number,
  documentId: number,
): Promise<null> {
  return result(
    axios.delete(`/courses/${id}/lessons/${lessonId}/documents/${documentId}`),
  );
}
export function getCourseLearners(
  id: number,
  params: { search: string; page: number; per_page: number },
): Promise<CoursePage<CourseLearner>> {
  return result(axios.get(`/courses/${id}/learners`, { params }));
}
export async function downloadCourseDocument(
  id: number,
  lessonId: number,
  document: CourseDocument,
): Promise<void> {
  try {
    const response = await axios.get<Blob>(
      `/courses/${id}/lessons/${lessonId}/documents/${document.id}/download`,
      { responseType: "blob", timeout: 120000 },
    );
    const url = URL.createObjectURL(response.data);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    handleError(error);
    throw error;
  }
}
