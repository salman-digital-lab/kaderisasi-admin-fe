export type ScoringCriterion = {
  id: string;
  name: string;
  maximum: number;
  weight: number;
};
export type ScoringGroup = {
  id: string;
  name: string;
  criteria: ScoringCriterion[];
};
export type ScoringDefinition = {
  groups: ScoringGroup[];
  grades: { label: string; minimum: number }[];
  note: string;
};
export type ScoringRubric = ScoringDefinition & {
  revision: number;
  locked: boolean;
};
export type ScoringDraft = {
  scores: Record<string, number | null>;
  note: string;
};
export type ScoringResult = {
  criteria: {
    criterion_id: string;
    score: number | null;
    normalized: number | null;
    grade: string | null;
  }[];
  total: number | null;
  grade: string | null;
  complete: boolean;
};
export type ScoringSnapshot = {
  schema_version: 1;
  activity_id: number;
  registration_id: number;
  revision: number;
  rubric: ScoringDefinition;
  draft: ScoringDraft;
  result: ScoringResult;
  published_by: number;
  published_at: string;
};
export type PublishedScoringResult = {
  revision: number;
  published_at: string;
  rubric: ScoringDefinition;
  note: string;
  result: ScoringResult;
};
export type ScoringState =
  | "unscored"
  | "incomplete"
  | "complete"
  | "published"
  | "changed";
export type ScoringData = {
  schema_version: 1;
  revision: number;
  state: ScoringState;
  draft: ScoringDraft;
  published: ScoringSnapshot | null;
  updated_by: number;
  updated_at: string;
};
export type ScoringEntry = {
  registration_id: number;
  name: string;
  scoring_data: ScoringData | null;
  result: ScoringResult | null;
};
export type ScoringPage = {
  entries: ScoringEntry[];
  total: number;
  page: number;
  per_page: number;
};
export type ScoringSave = {
  revision: number;
  rubric_revision: number;
  draft: ScoringDraft;
};
export type ScoringBatch = {
  rubric_revision: number;
  selections: { registration_id: number; revision: number }[];
};
export type ScoringPreview = {
  changes: (ScoringSave & {
    row: number;
    registration_id: number;
    name: string;
  })[];
  errors: { row: number; column: string; message: string }[];
  hash: string;
};
