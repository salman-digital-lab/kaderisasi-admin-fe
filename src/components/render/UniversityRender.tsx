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
        per_page: "10000",
        page: "1",
      }),
    {
      cacheKey: "universities_all",
      cacheTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
      staleTime: 1000 * 60 * 60 * 24, // Consider data stale after 24 hours
      setCache: (data) =>
        localStorage.setItem("universities_all", JSON.stringify(data)),
      getCache: () => {
        const cache = localStorage.getItem("universities_all");
        return cache ? JSON.parse(cache) : undefined;
      },
    },
  );

  if (loading) return <Spin />;

  return <>{data?.data.find((val) => val.id === universityId)?.name || "-"}</>;
}
