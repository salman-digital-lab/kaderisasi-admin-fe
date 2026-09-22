import { useRequest } from "ahooks";
import { Spin } from "antd";
import type { ReactElement } from "react";
import { getCities } from "../../api/services/city";

export function CityRender({ cityId }: { cityId: number }): ReactElement {
  const { data, loading } = useRequest(getCities, {
    cacheKey: "cities_render",
    staleTime: 60_000,
  });

  if (loading) return <Spin />;

  return <>{data?.data.find((city) => city.id === cityId)?.name || "-"}</>;
}
