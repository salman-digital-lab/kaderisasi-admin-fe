import { useState } from "react";
import { Button, Card, Flex, notification, Table, Typography } from "antd";
import { useParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { SaveOutlined } from "@ant-design/icons";

import { getActivity, putActivity } from "../../../../api/services/activity";
import { MandatoryProfileData } from "../../../../types/model/activity";
import { PROFILE_DATA } from "../constants/default";
import { MANDATORY_DATA_TABLE_COLUMNS } from "../constants/schema";

const { Title } = Typography;

const MandatoryData = () => {
  const { id } = useParams<{ id: string }>();

  const [toggleData, setToggleData] = useState<
    { is_shown: boolean; required: boolean }[]
  >([]);

  const { loading, data: activityData } = useRequest(
    () => getActivity(Number(id)),
    {
      cacheKey: `activity-${id}`,
      onSuccess: (data) => {
        if (data) {
          setToggleData(
            PROFILE_DATA.map((val) => {
              const mandatoryProfileData =
                data?.additional_config?.mandatory_profile_data;

              const profileData = mandatoryProfileData?.find(
                (d) => d.name === val.fieldname,
              );
              return {
                is_shown: Boolean(profileData),
                required: profileData?.required || false,
              };
            }),
          );
        }
      },
    },
  );

  const { loading: editLoading, runAsync } = useRequest(putActivity, {
    manual: true,
  });

  return (
    <Card loading={loading}>
      <Flex justify="end" align="middle">
        <Button
          type="primary"
          loading={editLoading}
          icon={<SaveOutlined />}
          onClick={async () => {
            const newData = toggleData.reduce<MandatoryProfileData[]>(
              (acc, val, idx) => {
                if (val.is_shown) {
                  acc.push({
                    name: PROFILE_DATA[idx].fieldname,
                    required: val.required,
                  });
                }
                return acc;
              },
              [],
            );

            await runAsync(Number(id), {
              additional_config: {
                ...activityData?.additional_config,
                mandatory_profile_data: newData,
              },
            });

            notification.success({
              message: "Berhasil",
              description: "Data berhasil diubah",
            });
          }}
        >
          Simpan
        </Button>
      </Flex>
      <Title level={3}>Keperluan Data Diri Peserta</Title>
      <Table
        rowKey="fieldname"
        columns={MANDATORY_DATA_TABLE_COLUMNS(setToggleData)}
        dataSource={PROFILE_DATA.map((val, idx) => {
          return {
            ...val,
            is_shown: toggleData[idx]?.is_shown,
            required: toggleData[idx]?.required,
          };
        })}
      />
    </Card>
  );
};

export default MandatoryData;
