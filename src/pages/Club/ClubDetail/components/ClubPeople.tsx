import { Tabs, Typography } from "antd";

import type { Club } from "../../../../types/model/club";
import ClubMembersPage from "../../ClubMembers";
import ClubRegistrationsPage from "../../ClubRegistrations";

const { Paragraph, Title } = Typography;

type ClubPeopleProps = {
  club: Club;
};

const ClubPeople = ({ club }: ClubPeopleProps) => (
  <section aria-labelledby="club-people-title">
    <Title id="club-people-title" level={3} style={{ marginBottom: 4 }}>
      Pendaftar & Anggota
    </Title>
    <Paragraph type="secondary">
      Tinjau orang yang mendaftar, lalu kelola anggota yang sudah diterima dan
      perannya di klub.
    </Paragraph>
    <Tabs
      defaultActiveKey="applicants"
      items={[
        {
          key: "applicants",
          label: "Pendaftar",
          children: <ClubRegistrationsPage club={club} />,
        },
        {
          key: "members",
          label: "Anggota & Peran",
          children: <ClubMembersPage />,
        },
      ]}
    />
  </section>
);

export default ClubPeople;
