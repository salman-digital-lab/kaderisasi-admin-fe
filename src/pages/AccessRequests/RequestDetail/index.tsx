import { useRequest } from "ahooks";
import { Button, Card, Popconfirm, Space, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { cancelMyRequest, getMyRequest } from "../../../api/services/access";
import TicketDetails from "../components/TicketDetails";

export default function RequestDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, refresh } = useRequest(() => getMyRequest(id), {
    refreshDeps: [id],
  });
  if (!data) return <Card loading={loading} />;
  const active = data.status === "open";

  return (
    <div className="access-ticket-page" style={{ padding: 12 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Button onClick={() => navigate("/my-requests")}>Kembali</Button>
        <TicketDetails ticket={data} />
        {active && (
          <Popconfirm
            title="Batalkan permintaan ini?"
            okText="Ya, Batalkan"
            cancelText="Kembali"
            onConfirm={async () => {
              await cancelMyRequest(data.id);
              message.success("Permintaan dibatalkan");
              refresh();
            }}
          >
            <Button danger>Batalkan Permintaan</Button>
          </Popconfirm>
        )}
      </Space>
    </div>
  );
}
