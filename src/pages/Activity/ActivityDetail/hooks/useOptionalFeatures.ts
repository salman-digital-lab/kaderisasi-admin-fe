import { useRequest } from "ahooks";
import { getScoringRubric } from "../../../../api/services/scoring";
import { getLinkedCourses } from "../../../../api/services/linked-course";
import { saveActivityOptionalFeatures } from "../../../../api/services/activity-setup";
import type {
  Activity,
  ActivityOptionalFeature,
} from "../../../../types/model/activity";
import { usePermissions } from "../../../../stores/authStore";

export type OptionalFeatureState = {
  /** Whether the user's role can see this workspace at all. */
  available: boolean;
  /** Whether the activity shows this workspace. */
  enabled: boolean;
  /** Short status for the overview, e.g. "2 kelas terkait". */
  summary?: string;
};

export type OptionalFeatures = Record<
  ActivityOptionalFeature,
  OptionalFeatureState
> & {
  loading: boolean;
  canManage: boolean;
  setEnabled: (
    feature: ActivityOptionalFeature,
    enabled: boolean,
  ) => Promise<void>;
};

/**
 * Resolves the optional activity workspaces (scoring and linked courses).
 * An explicit flag in `additional_config.optional_features` wins; otherwise a
 * feature counts as enabled when it already has data, so existing activities
 * keep their workspaces.
 */
export function useOptionalFeatures(
  activity: Activity,
  onSaved: () => void,
): OptionalFeatures {
  const permissions = usePermissions();
  const canManage = permissions.includes("activities.manage");
  const coursesAvailable =
    canManage || permissions.includes("activity_registrations.read");
  const flags = activity.additional_config?.optional_features ?? {};

  const { data, loading } = useRequest(
    async () => {
      const [rubric, courses] = await Promise.all([
        getScoringRubric(activity.id).catch(() => undefined),
        coursesAvailable
          ? getLinkedCourses("activity", activity.id).catch(() => undefined)
          : Promise.resolve(undefined),
      ]);
      return { rubric, courses };
    },
    { refreshDeps: [activity.id, coursesAvailable] },
  );

  const hasRubric = Boolean(data?.rubric);
  const courseCount = data?.courses?.length ?? 0;

  return {
    loading,
    canManage,
    scoring: {
      available: true,
      enabled: flags.scoring ?? hasRubric,
      summary: data
        ? hasRubric
          ? "Rubrik sudah disusun"
          : "Rubrik belum disusun"
        : undefined,
    },
    courses: {
      available: coursesAvailable,
      enabled: coursesAvailable && (flags.courses ?? courseCount > 0),
      summary: data?.courses
        ? courseCount > 0
          ? `${courseCount} kelas terkait`
          : "Belum ada kelas terkait"
        : undefined,
    },
    setEnabled: async (feature, enabled) => {
      await saveActivityOptionalFeatures(activity, { [feature]: enabled });
      onSaved();
    },
  };
}
