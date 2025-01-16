import { useRequest } from "ahooks";
import { getUniversities } from "../../api/services/university";
import { Spin } from "antd";

type UniversityRenderProps = {
  universityId: number;
};

export function UniversityRender({ universityId }: UniversityRenderProps) {
  const { data, loading } = useRequest(
    () =>
      getUniversities({
        per_page: "1000",
        page: "1",
      }),
    {
      cacheKey: "university_render",
    },
  );

  if (loading) return <Spin />;

  return <>{data?.data.find((val) => val.id === universityId)?.name || "-"}</>;
}
