import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="Akses ditolak"
      subTitle="Akun Anda tidak memiliki izin untuk membuka halaman ini. Anda dapat mengajukan akses melalui My Requests."
      extra={
        <Button type="primary" onClick={() => navigate("/my-requests")}>
          Buka My Requests
        </Button>
      }
    />
  );
}
