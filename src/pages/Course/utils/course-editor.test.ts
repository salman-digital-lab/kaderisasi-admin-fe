import { describe, expect, it } from "vitest";
import type { CourseLesson } from "../../../types/model/course";
import {
  formatDocumentSize,
  hasLessonChanges,
  lessonInput,
  mergeSavedLesson,
  lessonsWithoutVideo,
  moveLessonIds,
  youtubeVideoId,
} from "./course-editor";

const lesson = (id: number, video = "aqz-KE-bpKQ"): CourseLesson => ({
  id,
  course_id: 2,
  title: `Materi uji ${id}`,
  description: "",
  youtube_video_id: video,
  position: id,
  documents: [],
});

describe("YouTube input and preview", () => {
  it.each([
    "aqz-KE-bpKQ",
    " https://youtu.be/aqz-KE-bpKQ?si=example ",
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=30",
    "https://m.youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtube.com/embed/aqz-KE-bpKQ",
    "https://youtube.com/shorts/aqz-KE-bpKQ",
    "https://youtube.com/live/aqz-KE-bpKQ",
  ])("normalizes supported references: %s", (value) => {
    expect(youtubeVideoId(value)).toBe("aqz-KE-bpKQ");
  });
  it.each([
    "javascript:alert(1)",
    "https://youtube.com.attacker.test/watch?v=aqz-KE-bpKQ",
    "https://user@youtube.com/watch?v=aqz-KE-bpKQ",
    "https://youtube.com:443/watch?v=aqz-KE-bpKQ",
    "https://youtube.com/playlist?list=aqz-KE-bpKQ",
    "https://youtube.com/@channel",
    "https://youtu.be/short",
    "https://youtu.be/aqz-KE-bpKQ/extra",
    "https://youtube.com\\watch?v=aqz-KE-bpKQ",
  ])("rejects unsafe or unsupported references: %s", (value) => {
    expect(youtubeVideoId(value)).toBeNull();
  });
  it("allows a blank video while authoring a draft", () =>
    expect(youtubeVideoId("  ")).toBe(""));
});

describe("lesson ordering and authoring state", () => {
  const lessons = [lesson(11), lesson(22), lesson(33)];
  it("moves the original lesson when the visible list is filtered", () => {
    expect(moveLessonIds(lessons, 22, -1)).toEqual([22, 11, 33]);
    expect(moveLessonIds(lessons, 22, 1)).toEqual([11, 33, 22]);
    expect(lessons.map(({ id }) => id)).toEqual([11, 22, 33]);
  });
  it("rejects boundary moves and stale lesson IDs", () => {
    expect(moveLessonIds(lessons, 11, -1)).toBeNull();
    expect(moveLessonIds(lessons, 33, 1)).toBeNull();
    expect(moveLessonIds(lessons, 44, -1)).toBeNull();
  });
  it("detects edits without treating the loaded form as dirty", () => {
    const values = lessonInput(lesson(11));
    expect(hasLessonChanges({ ...values }, values)).toBe(false);
    expect(hasLessonChanges({ ...values, title: "Revisi judul" }, values)).toBe(
      true,
    );
    expect(
      hasLessonChanges({ ...values, description: "<p>Catatan</p>" }, values),
    ).toBe(true);
    expect(hasLessonChanges({ ...values, youtube_url: "" }, values)).toBe(true);
  });
  it("reports incomplete videos without requiring optional PDFs", () => {
    expect(
      lessonsWithoutVideo([lesson(1), lesson(2, ""), lesson(3, "bad")]).map(
        ({ id }) => id,
      ),
    ).toEqual([2, 3]);
    expect(lessonsWithoutVideo([lesson(1)])).toEqual([]);
  });
});

describe("lesson save responses", () => {
  const response = {
    id: 11,
    course_id: 2,
    title: "Judul tersimpan",
    description: "",
    youtube_video_id: "aqz-KE-bpKQ",
    position: 1,
  };
  it("opens document controls after creation when the API omits documents", () => {
    const saved = mergeSavedLesson(response);
    expect(saved.documents).toEqual([]);
    expect(lessonInput(saved).title).toBe("Judul tersimpan");
  });
  it("keeps the loaded document list when an edit response omits it", () => {
    const previous = {
      ...lesson(11),
      documents: [
        { id: 3, lesson_id: 11, filename: "materi.pdf", size_bytes: 1659 },
      ],
    };
    expect(mergeSavedLesson(response, previous)).toEqual({
      ...response,
      documents: previous.documents,
    });
  });
});

describe("PDF size labels", () => {
  it("keeps small PDFs readable instead of showing 0.0 MB", () => {
    expect(formatDocumentSize(100)).toBe("100 B");
    expect(formatDocumentSize(1659)).toBe("2 KB");
    expect(formatDocumentSize(20 * 1024 * 1024)).toBe("20.0 MB");
  });
});
