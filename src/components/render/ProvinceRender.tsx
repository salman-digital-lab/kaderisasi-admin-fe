import { useRequest } from "ahooks";
import { Spin } from "antd";
import { getProvinces } from "../../api/services/province";

type UniversityRenderProps = {
  provinceId: number;
};

export function ProvinceRender({ provinceId }: UniversityRenderProps) {
  const { data, loading } = useRequest(() => getProvinces({}), {
    cacheKey: "province_render",
  });

  if (loading) return <Spin />;

  return <>{data?.data.find((val) => val.id === provinceId)?.name || "-"}</>;
}
