import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { NAV_LABELS } from "../../constants/navigation";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="Akses ditolak"
      subTitle={`Akun Anda tidak memiliki izin untuk membuka halaman ini. Ajukan akses melalui menu ${NAV_LABELS.myRequests}.`}
      extra={
        <Button type="primary" onClick={() => navigate("/my-requests")}>
          Buka {NAV_LABELS.myRequests}
        </Button>
      }
    />
  );
}
