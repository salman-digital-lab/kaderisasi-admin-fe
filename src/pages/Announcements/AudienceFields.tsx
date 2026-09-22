import { useEffect, useState, type ReactElement } from "react";
import { Alert, Button, Checkbox, Form, Select, Typography } from "antd";
import axios from "../../api/axios";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../constants/options";
import AudienceSelect from "./AudienceSelect";
import type { AnnouncementInput, Audience } from "./types";
import styles from "./Composer.module.css";

type Group = "members" | "activities" | "clubs" | "admins";
const labels: Record<Group, string> = {
  members: "Anggota website",
  activities: "Pendaftar kegiatan",
  clubs: "Anggota komunitas",
  admins: "Admin",
};

export default function AudienceFields({
  onChange,
}: {
  onChange: () => void;
}): ReactElement {
  const form = Form.useFormInstance<AnnouncementInput>();
  const initial = form.getFieldValue("audience") as Audience;
  const [groups, setGroups] = useState<Record<Group, boolean>>(() => ({
    members: initial.all_members || initial.member_ids.length > 0,
    activities: initial.activity_ids.length > 0,
    clubs: initial.club_ids.length > 0,
    admins:
      initial.all_admins ||
      initial.admin_ids.length > 0 ||
      initial.role_codes.length > 0,
  }));
  const allMembers = Form.useWatch(["audience", "all_members"], {
    form,
    preserve: true,
  });
  const allAdmins = Form.useWatch(["audience", "all_admins"], {
    form,
    preserve: true,
  });
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!groups.admins || allAdmins) return;
    const controller = new AbortController();
    setFailed(false);
    void axios
      .get<{ data: { code: string; name: string }[] }>("/rbac/roles", {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted)
          setRoles(
            data.data.map((role) => ({ value: role.code, label: role.name })),
          );
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [groups.admins, allAdmins, retry]);
  const toggle = (group: Group, checked: boolean): void => {
    setGroups((old) => ({ ...old, [group]: checked }));
    if (!checked) {
      const clear: Record<Group, Partial<Audience>> = {
        members: { all_members: false, member_ids: [] },
        activities: { activity_ids: [], activity_statuses: [] },
        clubs: { club_ids: [], club_statuses: ["APPROVED"] },
        admins: { all_admins: false, admin_ids: [], role_codes: [] },
      };
      form.setFieldsValue({ audience: clear[group] });
      onChange();
    }
  };
  return (
    <>
      <Typography.Paragraph type="secondary">
        Pilih satu atau beberapa kelompok. Setiap akun menerima satu pesan.
      </Typography.Paragraph>
      {(Object.keys(labels) as Group[]).map((group) => (
        <div className={styles.audienceGroup} key={group}>
          <Checkbox
            checked={groups[group]}
            onChange={(event) => toggle(group, event.target.checked)}
          >
            {labels[group]}
          </Checkbox>
          {groups[group] && (
            <div className={styles.audienceOptions}>
              {group === "members" && (
                <>
                  <Form.Item
                    name={["audience", "all_members"]}
                    valuePropName="checked"
                  >
                    <Checkbox>Semua anggota dengan akun aktif</Checkbox>
                  </Form.Item>
                  {!allMembers && (
                    <Form.Item
                      name={["audience", "member_ids"]}
                      label="Anggota tertentu"
                    >
                      <AudienceSelect kind="member" />
                    </Form.Item>
                  )}
                </>
              )}
              {group === "activities" && (
                <>
                  <Form.Item
                    name={["audience", "activity_ids"]}
                    label="Kegiatan"
                  >
                    <AudienceSelect kind="activity" />
                  </Form.Item>
                  <Form.Item
                    name={["audience", "activity_statuses"]}
                    label="Status pendaftaran kegiatan"
                    extra="Kosong berarti semua status. Anda juga dapat mengetik status khusus."
                  >
                    <Select
                      mode="tags"
                      placeholder="Semua status"
                      options={ACTIVITY_REGISTRANT_STATUS_OPTIONS}
                    />
                  </Form.Item>
                </>
              )}
              {group === "clubs" && (
                <>
                  <Form.Item name={["audience", "club_ids"]} label="Komunitas">
                    <AudienceSelect kind="club" />
                  </Form.Item>
                  <Form.Item
                    name={["audience", "club_statuses"]}
                    label="Status pendaftaran komunitas"
                    extra="Jika kosong, hanya yang disetujui yang dipilih."
                  >
                    <Select
                      mode="multiple"
                      options={[
                        { value: "APPROVED", label: "Disetujui" },
                        { value: "PENDING", label: "Menunggu" },
                        { value: "REJECTED", label: "Ditolak" },
                      ]}
                    />
                  </Form.Item>
                </>
              )}
              {group === "admins" && (
                <>
                  <Form.Item
                    name={["audience", "all_admins"]}
                    valuePropName="checked"
                  >
                    <Checkbox>Semua admin aktif</Checkbox>
                  </Form.Item>
                  {!allAdmins && (
                    <>
                      <Form.Item
                        name={["audience", "admin_ids"]}
                        label="Admin tertentu"
                      >
                        <AudienceSelect kind="admin" />
                      </Form.Item>
                      <Form.Item
                        name={["audience", "role_codes"]}
                        label="Peran admin"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Pilih peran"
                          options={roles}
                        />
                      </Form.Item>
                      {failed && (
                        <Alert
                          type="error"
                          title="Daftar peran gagal dimuat."
                          action={
                            <Button
                              onClick={() => setRetry((value) => value + 1)}
                            >
                              Coba lagi
                            </Button>
                          }
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
