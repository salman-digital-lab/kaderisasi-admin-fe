import axios from "../axios";
export interface TalentDefinition {
  version: string;
  questions: { id: number; statement: string }[];
}
export interface TalentDraft {
  draft_id: string;
  definition_version: string;
  answers: number[];
  current_question: number;
  revision: number;
  updated_at: string;
}
export interface TalentScore {
  name: string;
  domain: string;
  total: number;
  score: number;
  rank: number;
  group: string;
  equal_score: boolean;
}
export interface TalentResult {
  participant_name?: string;
  submission_id: string;
  definition_version: string;
  submitted_at: string;
  talents: TalentScore[];
  domains: { name: string; score: number; top_seven_count: number }[];
}
export interface TalentState {
  draft: TalentDraft | null;
  result: TalentResult | null;
}
interface Envelope<T> {
  data: T;
}
export async function getTalentDefinition(): Promise<TalentDefinition> {
  return (
    await axios.get<Envelope<TalentDefinition>>("/talent-assessment/definition")
  ).data.data;
}
export async function getTalentState(): Promise<TalentState> {
  return (await axios.get<Envelope<TalentState>>("/talent-assessment")).data
    .data;
}
export async function startTalentDraft(): Promise<TalentDraft> {
  return (
    await axios.post<Envelope<TalentDraft>>("/talent-assessment/draft", {})
  ).data.data;
}
export async function saveTalentDraft(
  draft: TalentDraft,
): Promise<TalentDraft> {
  return (
    await axios.put<Envelope<TalentDraft>>("/talent-assessment/draft", {
      draft_id: draft.draft_id,
      revision: draft.revision,
      answers: draft.answers,
      current_question: draft.current_question,
    })
  ).data.data;
}
export async function submitTalentDraft(
  draft: TalentDraft,
): Promise<TalentResult> {
  return (
    await axios.post<Envelope<TalentResult>>("/talent-assessment/submit", {
      draft_id: draft.draft_id,
      revision: draft.revision,
    })
  ).data.data;
}
export async function getTalentResult(adminID?: string): Promise<TalentResult> {
  const path = adminID
    ? `/admin-users/${encodeURIComponent(adminID)}/talent-assessment/result`
    : "/talent-assessment/result";
  return (await axios.get<Envelope<TalentResult>>(path)).data.data;
}
