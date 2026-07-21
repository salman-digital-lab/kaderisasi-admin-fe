import { Card, Space, Typography } from "antd";

import type { Club } from "../../../../types/model/club";
import ClubDetail from "./ClubDetail";
import LogoUpload from "./LogoUpload";
import MediaList from "./MediaList";

const { Paragraph, Title } = Typography;

type ClubProfileProps = {
  club: Club;
  onUpdated: (club: Club) => void;
};

const ClubProfile = ({ club, onUpdated }: ClubProfileProps) => (
  <Space direction="vertical" size="large" style={{ display: "flex" }}>
    <div>
      <Title level={3} style={{ marginBottom: 4 }}>
        Profil Publik
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Atur informasi dan media yang membantu calon anggota mengenal klub. Item
        yang disarankan meningkatkan kualitas profil, tetapi tidak menghalangi
        publikasi.
      </Paragraph>
    </div>

    <Card>
      <ClubDetail key={club.updated_at} club={club} onUpdated={onUpdated} />
    </Card>
    <Card>
      <LogoUpload club={club} onUpdated={onUpdated} />
    </Card>
    <Card>
      <MediaList club={club} onUpdated={onUpdated} />
    </Card>
  </Space>
);

export default ClubProfile;
