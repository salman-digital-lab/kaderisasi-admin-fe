import { useRequest } from "ahooks";
import { Spin } from "antd";
import { getProvinces } from "../../api/services/province";

type ProvinceRenderProps = {
  provinceId: number;
};

export function ProvinceRender({ provinceId }: ProvinceRenderProps) {
  const { data, loading } = useRequest(() => getProvinces({}), {
    cacheKey: "provinces_all",
    cacheTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    staleTime: 1000 * 60 * 60 * 24, // Consider data stale after 24 hours
    setCache: (data) =>
      localStorage.setItem("provinces_all", JSON.stringify(data)),
    getCache: () => {
      const cache = localStorage.getItem("provinces_all");
      return cache ? JSON.parse(cache) : undefined;
    },
  });
  if (loading) return <Spin />;
  return <>{data?.data.find((val) => val.id === provinceId)?.name || "-"}</>;
}
