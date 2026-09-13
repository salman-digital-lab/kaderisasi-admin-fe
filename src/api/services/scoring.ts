import axios from "../axios";
import type {
  ScoringBatch,
  ScoringData,
  ScoringPage,
  ScoringPreview,
  ScoringRubric,
  ScoringSave,
} from "../../types/services/scoring";

const path = (id: number): string => `/activities/${id}/scoring`;
export async function getScoringRubric(
  id: number,
): Promise<ScoringRubric | null> {
  return (await axios.get<{ data: ScoringRubric | null }>(`${path(id)}/rubric`))
    .data.data;
}
export async function saveScoringRubric(
  id: number,
  rubric: ScoringRubric,
): Promise<ScoringRubric> {
  return (
    await axios.put<{ data: ScoringRubric }>(`${path(id)}/rubric`, rubric)
  ).data.data;
}
export async function getScoringEntries(
  id: number,
  params: { page: number; per_page: number; search: string; state: string },
): Promise<ScoringPage> {
  return (await axios.get<{ data: ScoringPage }>(path(id), { params })).data
    .data;
}
export async function saveScoringDraft(
  id: number,
  registrationId: number,
  input: ScoringSave,
): Promise<ScoringData> {
  return (
    await axios.put<{ data: ScoringData }>(
      `${path(id)}/registrations/${registrationId}`,
      input,
    )
  ).data.data;
}
export async function publishScoring(
  id: number,
  input: ScoringBatch,
  withdraw = false,
): Promise<void> {
  await axios.post(`${path(id)}/${withdraw ? "withdraw" : "publish"}`, input, {
    timeout: 120000,
  });
}
export async function importScoring(
  id: number,
  file: File,
  hash?: string,
): Promise<ScoringPreview> {
  const body = new FormData();
  body.append("file", file);
  if (hash) body.append("preview_hash", hash);
  return (
    await axios.post<{ data: ScoringPreview }>(
      `${path(id)}/import/${hash ? "commit" : "preview"}`,
      body,
      { timeout: 120000 },
    )
  ).data.data;
}
export async function downloadScoring(
  id: number,
  mode: "template" | "draft" | "published",
): Promise<void> {
  const response = await axios.get<Blob>(`${path(id)}/excel`, {
    params: { mode },
    responseType: "blob",
    timeout: 120000,
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `penilaian-${id}-${mode}.xlsx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
