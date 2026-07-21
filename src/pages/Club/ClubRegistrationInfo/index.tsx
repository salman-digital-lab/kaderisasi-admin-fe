import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Modal,
  Space,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

import { putClub } from "../../../api/services/club";
import { updateClubRegistrationInfo } from "../../../api/services/clubRegistration";
import type { Club } from "../../../types/model/club";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import CustomFormAttachment from "../ClubDetail/components/CustomFormAttachment";
import { getClubReadiness } from "../utils/club-workspace";
import { serializeClubDate } from "../utils/mutation-payloads";

type ClubRegistrationInfoProps = {
  club: Club;
  onUpdated: (club: Club) => void;
};

type ScheduleFields = {
  registration_end_date?: Dayjs | null;
};

const { Paragraph, Text, Title } = Typography;

const ClubRegistrationInfo = ({
  club,
  onUpdated,
}: ClubRegistrationInfoProps) => {
  const [descriptionForm] = Form.useForm();
  const [scheduleForm] = Form.useForm<ScheduleFields>();
  const [modal, modalContextHolder] = Modal.useModal();
  const [savingDescription, setSavingDescription] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState(
    club.registration_info?.registration_info || "",
  );
  const registrationEndDate = Form.useWatch(
    "registration_end_date",
    scheduleForm,
  );
  const readiness = getClubReadiness(club);
  const registrationExpired = readiness.registrationState === "expired";
  const hasActiveForm = club.attachedCustomForm?.is_active === true;
  const selectedDateIsValid =
    !registrationEndDate || !registrationEndDate.endOf("day").isBefore(dayjs());
  const canOpenRegistration = hasActiveForm && selectedDateIsValid;

  const handleSaveDescription = async (): Promise<void> => {
    setSavingDescription(true);
    try {
      const updated = await updateClubRegistrationInfo(club.id, {
        registration_info: registrationInfo,
      });
      onUpdated({
        ...club,
        registration_info: updated.registration_info,
      });
    } finally {
      setSavingDescription(false);
    }
  };

  const updateRegistrationSettings = async (
    openRegistration: boolean,
  ): Promise<void> => {
    const values = await scheduleForm.validateFields();
    const updated = await putClub(club.id, {
      is_registration_open: openRegistration,
      registration_end_date: serializeClubDate(values.registration_end_date),
    });
    onUpdated({ ...club, ...updated });
  };

  const handleSaveSchedule = async (): Promise<void> => {
    setSavingSchedule(true);
    try {
      await updateRegistrationSettings(Boolean(club.is_registration_open));
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleOpenRegistration = async (): Promise<void> => {
    setChangingStatus(true);
    try {
      await updateRegistrationSettings(true);
    } finally {
      setChangingStatus(false);
    }
  };

  const confirmCloseRegistration = (): void => {
    modal.confirm({
      title: "Tutup pendaftaran klub?",
      content:
        "Calon anggota tidak dapat lagi mengirim pendaftaran sampai dibuka kembali.",
      okText: "Tutup Pendaftaran",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async () => {
        setChangingStatus(true);
        try {
          const updated = await putClub(club.id, {
            is_registration_open: false,
          });
          onUpdated({ ...club, ...updated });
        } finally {
          setChangingStatus(false);
        }
      },
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      {modalContextHolder}
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Pendaftaran Online
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Pendaftaran bersifat opsional. Jika digunakan, lengkapi informasi,
          siapkan form aktif, lalu buka pendaftaran.
        </Paragraph>
      </div>

      <Alert
        type={
          registrationExpired
            ? "warning"
            : club.is_registration_open
              ? "success"
              : "info"
        }
        showIcon
        title={
          registrationExpired
            ? "Tanggal pendaftaran telah berakhir"
            : club.is_registration_open
              ? "Pendaftaran sedang dibuka"
              : readiness.registrationState === "ready"
                ? "Pendaftaran siap dibuka"
                : "Pendaftaran belum dibuka"
        }
        description={
          registrationExpired
            ? "Perbarui tanggal penutupan atau tutup pendaftaran agar status sesuai."
            : club.is_registration_open
              ? "Pendaftar dapat mengisi form selama pendaftaran tersedia."
              : readiness.registrationBlockingReason ||
                "Semua persyaratan utama sudah terpenuhi."
        }
      />

      <Card
        title="1. Informasi untuk Calon Anggota"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={savingDescription}
            onClick={() => void handleSaveDescription()}
          >
            Simpan Informasi
          </Button>
        }
      >
        <Form
          form={descriptionForm}
          layout="vertical"
          initialValues={{ registration_info: registrationInfo }}
        >
          <Form.Item
            name="registration_info"
            label="Petunjuk pendaftaran (Disarankan)"
            extra="Informasi ini tampil sebelum calon anggota mulai mengisi form."
            style={{ marginBottom: 0 }}
          >
            <RichTextEditor
              value={registrationInfo}
              onChange={(value) => {
                setRegistrationInfo(value);
                descriptionForm.setFieldValue("registration_info", value);
              }}
              minHeight="240px"
            />
          </Form.Item>
        </Form>
      </Card>

      <div aria-label="Langkah 2: Form pendaftaran">
        <CustomFormAttachment club={club} onUpdated={onUpdated} />
      </div>

      <Card title="3. Jadwal dan Status Pendaftaran">
        <Form
          form={scheduleForm}
          layout="vertical"
          initialValues={{
            registration_end_date: club.registration_end_date
              ? dayjs(club.registration_end_date)
              : null,
          }}
        >
          <Form.Item
            label="Tanggal Penutupan (Opsional)"
            name="registration_end_date"
            extra="Kosongkan jika pendaftaran tidak memiliki batas waktu."
            rules={[
              {
                validator: (_, value?: Dayjs) =>
                  !value || !value.endOf("day").isBefore(dayjs())
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          "Tanggal penutupan tidak boleh berada di masa lalu.",
                        ),
                      ),
              },
            ]}
          >
            <DatePicker
              placeholder="Pilih tanggal penutupan"
              style={{ width: "100%", maxWidth: 360 }}
              disabledDate={(date) => date.endOf("day").isBefore(dayjs())}
            />
          </Form.Item>

          <Space wrap>
            <Button
              icon={<CalendarOutlined />}
              loading={savingSchedule}
              disabled={changingStatus}
              onClick={() => void handleSaveSchedule()}
            >
              Simpan Jadwal
            </Button>
            {club.is_registration_open ? (
              <Button
                danger
                icon={<PauseCircleOutlined />}
                loading={changingStatus}
                onClick={confirmCloseRegistration}
              >
                Tutup Pendaftaran
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={changingStatus}
                disabled={!canOpenRegistration}
                onClick={() => void handleOpenRegistration()}
              >
                Buka Pendaftaran
              </Button>
            )}
          </Space>

          {!club.is_registration_open && !canOpenRegistration ? (
            <Paragraph
              type="secondary"
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              <Text strong>Belum dapat dibuka:</Text>{" "}
              {!hasActiveForm
                ? "hubungkan dan aktifkan form pendaftaran pada langkah 2."
                : "perbaiki tanggal penutupan terlebih dahulu."}
            </Paragraph>
          ) : null}
        </Form>
      </Card>
    </Space>
  );
};

export default ClubRegistrationInfo;
