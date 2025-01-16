import { useState } from "react";
import { Button, Card, Col, Empty, notification, Row, Space } from "antd";
import { PlusOutlined, SaveFilled } from "@ant-design/icons";

import QuestionField from "./components/QuestionField";
import { generateDefaultQuestion } from "../../constants/default";
import { getActivity, putActivity } from "../../../../../api/services/activity";
import { useRequest } from "ahooks";
import { useParams } from "react-router-dom";
import { Questionnaire } from "../../../../../types/model/activity";

const QuestionnaireForm = () => {
  const { id } = useParams<{ id: string }>();

  const [cards, setCards] = useState<Questionnaire[]>([
    generateDefaultQuestion("text"),
  ]);

  const { data: activityData } = useRequest(() => getActivity(Number(id)), {
    cacheKey: `activity-${id}`,
    onSuccess: (data) => {
      if (data)
        setCards(data?.additional_config?.additional_questionnaire || []);
    },
  });

  const handleAddCard = () => {
    setCards([...cards, generateDefaultQuestion("text")]);
  };

  const handleChangeCard = (
    questionName: string,
    changeCb: (question: Questionnaire) => Questionnaire,
  ) => {
    setCards((prev) =>
      prev.map((oldQuestion) => {
        if (questionName !== oldQuestion.name) {
          return oldQuestion;
        }

        return changeCb(oldQuestion);
      }),
    );
  };

  const handleDeleteCard = (name: string) => {
    const updatedCards = cards.filter((card) => card.name !== name);
    setCards(updatedCards);
  };

  const { loading: editLoading, runAsync } = useRequest(putActivity, {
    manual: true,
  });

  const handleSave = async () => {
    await runAsync(Number(id), {
      additional_config: {
        ...activityData?.additional_config,
        additional_questionnaire: cards,
      },
    });
    notification.success({
      message: "Berhasil",
      description: "Data berhasil diubah",
    });
  };

  return (
    <Card>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Row justify="end">
          <Space>
            <Button
              type="primary"
              onClick={handleSave}
              icon={<SaveFilled />}
              loading={editLoading}
            >
              Simpan Pertanyaan
            </Button>
            <Button
              type="primary"
              onClick={handleAddCard}
              icon={<PlusOutlined />}
            >
              Tambah Pertanyaan
            </Button>
          </Space>
        </Row>
        <Row gutter={24}>
          <Col span={24}>
            <Space
              direction="vertical"
              size="middle"
              style={{ display: "flex" }}
            >
              {cards?.length ? (
                cards.map((card, idx) => (
                  <QuestionField
                    idx={idx + 1}
                    key={card.name}
                    handleChangeCard={handleChangeCard}
                    question={card}
                    onDelete={() => handleDeleteCard(card.name)}
                  />
                ))
              ) : (
                <Empty />
              )}
            </Space>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default QuestionnaireForm;
