import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="Halaman tidak ditemukan"
      subTitle="Alamat yang Anda buka tidak tersedia atau sudah dipindahkan. Periksa kembali tautannya."
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          Kembali ke beranda
        </Button>
      }
    />
  );
}
