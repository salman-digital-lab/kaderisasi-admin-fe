import type { CourseLesson, LessonInput } from "../../../types/model/course";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export const MAX_COURSE_PDF_BYTES = 20 * 1024 * 1024;

export function youtubeVideoId(value: string): string | null {
  const input = value.trim();
  if (!input || VIDEO_ID.test(input)) return input;
  try {
    const url = new URL(input);
    const authority = input.split("/")[2] ?? "";
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      authority.includes(":") ||
      input.includes("\\")
    )
      return null;
    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    let id = "";
    if (url.hostname === "youtu.be" && parts.length === 1) id = parts[0];
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
      if (parts.length === 2 && ["embed", "shorts", "live"].includes(parts[0]))
        id = parts[1];
    }
    return VIDEO_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function lessonInput(lesson?: CourseLesson): LessonInput {
  return {
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
    youtube_url: lesson?.youtube_video_id
      ? `https://www.youtube.com/watch?v=${lesson.youtube_video_id}`
      : "",
  };
}

export function hasLessonChanges(
  current: LessonInput,
  saved: LessonInput,
): boolean {
  return (
    current.title !== saved.title ||
    current.description !== saved.description ||
    current.youtube_url !== saved.youtube_url
  );
}

export function moveLessonIds(
  lessons: CourseLesson[],
  lessonId: number,
  direction: -1 | 1,
): number[] | null {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= lessons.length) return null;
  const ids = lessons.map((lesson) => lesson.id);
  [ids[index], ids[next]] = [ids[next], ids[index]];
  return ids;
}

export function formatDocumentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function lessonsWithoutVideo(lessons: CourseLesson[]): CourseLesson[] {
  return lessons.filter((lesson) => !VIDEO_ID.test(lesson.youtube_video_id));
}
