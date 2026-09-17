import type { ReactElement } from "react";
import { Alert, Button } from "antd";
import type { FormSection } from "../../../../types/model/customForm";
import type { BuilderIssue } from "../utils/builder-state";

export function BuilderIssueList({
  section,
  issues,
  onSelect,
}: {
  section: FormSection;
  issues: BuilderIssue[];
  onSelect: (key: string, reveal: boolean) => void;
}): ReactElement {
  const groups = new Map<string | undefined, BuilderIssue[]>();
  for (const issue of issues)
    groups.set(issue.fieldKey, [...(groups.get(issue.fieldKey) ?? []), issue]);
  return (
    <Alert
      className="builder-section-errors"
      type="error"
      showIcon
      title="Ada yang perlu diperbaiki"
      description={
        <div className="builder-issue-groups">
          {[...groups].map(([key, problems]) => {
            const index = section.fields.findIndex(
              (field) => field.key === key,
            );
            const field = section.fields[index];
            const heading = field
              ? `Pertanyaan ${index + 1}`
              : "Pengaturan bagian dan alur";
            return (
              <div className="builder-issue-group" key={key ?? "section"}>
                <div className="builder-issue-heading">
                  <strong>{heading}</strong>
                  {field && (
                    <Button
                      size="small"
                      onClick={() => onSelect(field.key, true)}
                      aria-label={`Perbaiki pertanyaan ${index + 1}`}
                    >
                      Perbaiki pertanyaan
                    </Button>
                  )}
                </div>
                {field && (
                  <p className="builder-issue-question">
                    {field.label.trim() || "Belum ada judul pertanyaan"}
                  </p>
                )}
                <ul aria-label={`Perbaikan untuk ${heading.toLowerCase()}`}>
                  {problems.map((problem) => (
                    <li key={problem.message}>{problem.message}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      }
    />
  );
}
