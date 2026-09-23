import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import {
  Alert,
  Button,
  Card,
  theme,
  Empty,
  Modal,
  Segmented,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { LeftOutlined, RightOutlined, PlusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import {
  getCalendarEvents,
  deleteCalendarEvent,
} from "../../api/services/calendar";
import { handleError } from "../../api/errorHandling";
import { usePermissions } from "../../stores/authStore";
import { useAdminViewport } from "../../hooks/useAdminViewport";
import type { CalendarEvent } from "../../types/model/calendar";
import {
  WEEKDAYS,
  addDays,
  dateLabel,
  eventsOnDay,
  eventSchedule,
  midnight,
  monthDays,
  monthLabel,
  monthStart,
  shiftMonth,
  wibDate,
} from "../../utils/calendar";
import CalendarForm from "./CalendarForm";
import { getCertificatePublicBaseUrl } from "../DigitalCertificate/utils/certificate-content";
import styles from "./Calendar.module.css";

export default function CalendarPage(): ReactElement {
  const { token } = theme.useToken();
  const calendarTheme = {
    "--calendar-primary": token.colorPrimary,
    "--calendar-event-text": token.colorPrimaryText,
    "--calendar-event-bg": token.colorPrimaryBg,
    "--calendar-event-hover": token.colorPrimaryBgHover,
    "--calendar-border": token.colorBorderSecondary,
    "--calendar-surface": token.colorBgContainer,
    "--calendar-subtle": token.colorFillAlter,
    "--calendar-muted": token.colorTextSecondary,
    "--calendar-radius": `${token.borderRadius}px`,
  } as CSSProperties;
  const [month, setMonth] = useState(() => monthStart(wibDate()));
  const [choice, setChoice] = useState<string | null>(null);
  const { compact } = useAdminViewport();
  const view = choice ?? (compact ? "agenda" : "month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [editor, setEditor] = useState<CalendarEvent | "new" | null>(null);
  const [modal, modalContext] = Modal.useModal();
  const [notification, notificationContext] = message.useMessage();
  const permissions = usePermissions();
  const canManage = permissions.includes("calendar.manage");
  const canReadActivities = permissions.includes("activities.read");
  const publicBaseUrl = getCertificatePublicBaseUrl();
  const days = monthDays(month, view === "month");
  const start = midnight(days[0]);
  const end = midnight(addDays(days[days.length - 1], 1));
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void getCalendarEvents(start, end, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setEvents(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [start, end, revision]);

  const eventButton = (event: CalendarEvent): ReactElement => (
    <button
      key={event.id}
      className={styles.event}
      onClick={() => setSelected(event)}
    >
      {event.title}
    </button>
  );
  const remove = (event: CalendarEvent): void => {
    modal.confirm({
      title: "Hapus acara?",
      content: `“${event.title}” akan dihapus dari Kalender BMKA.`,
      okText: "Hapus acara",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async (): Promise<void> => {
        try {
          await deleteCalendarEvent(event.id);
          setSelected(null);
          setRevision((value) => value + 1);
          void notification.success("Acara dihapus");
        } catch (failure) {
          handleError(failure);
          throw failure;
        }
      },
    });
  };
  return (
    <main className={styles.page} style={calendarTheme}>
      {modalContext}
      {notificationContext}
      <Typography.Title level={2}>Kalender Kegiatan</Typography.Title>
      <Typography.Paragraph className={styles.lead}>
        Jadwal kegiatan bersama BMKA.
      </Typography.Paragraph>
      <Card styles={{ body: { padding: 12 } }} className={styles.toolbar}>
        <div className={styles.controls}>
          <Space size={12} wrap>
            <Button
              aria-label="Bulan sebelumnya"
              icon={<LeftOutlined />}
              onClick={() => setMonth(shiftMonth(month, -1))}
            />
            <Typography.Text strong aria-live="polite">
              {monthLabel(month)}
            </Typography.Text>
            <Button
              aria-label="Bulan berikutnya"
              icon={<RightOutlined />}
              onClick={() => setMonth(shiftMonth(month, 1))}
            />
            <Button onClick={() => setMonth(monthStart(wibDate()))}>
              Hari ini
            </Button>
          </Space>
          <Space size={8} wrap>
            <Segmented
              aria-label="Tampilan kalender"
              value={view}
              onChange={setChoice}
              options={[
                { label: "Bulan", value: "month" },
                { label: "Agenda", value: "agenda" },
              ]}
            />
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setEditor("new")}
              >
                Tambah acara
              </Button>
            )}
          </Space>
        </div>
      </Card>
      {loading ? (
        <div role="status" aria-label="Memuat kalender">
          <Spin /> Memuat kalender…
        </div>
      ) : error ? (
        <Alert
          type="error"
          showIcon
          title="Kalender gagal dimuat"
          action={
            <Button onClick={() => setRevision((value) => value + 1)}>
              Coba lagi
            </Button>
          }
        />
      ) : (
        <>
          {view === "agenda" && !events.length && (
            <Empty description="Belum ada acara pada periode ini" />
          )}
          {view === "month" ? (
            <div
              className={styles.scroll}
              role="region"
              aria-label="Kalender bulanan, gulir untuk melihat semua tanggal"
              tabIndex={0}
            >
              <table className={styles.month}>
                <caption className={styles.caption}>
                  {monthLabel(month)}
                </caption>
                <thead>
                  <tr>
                    {WEEKDAYS.map((day) => (
                      <th scope="col" key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: days.length / 7 }, (_, week) => (
                    <tr key={week}>
                      {days.slice(week * 7, week * 7 + 7).map((day) => (
                        <td
                          key={day}
                          className={
                            day.slice(0, 7) !== month.slice(0, 7)
                              ? styles.outside
                              : undefined
                          }
                        >
                          <time
                            dateTime={day}
                            aria-label={dateLabel(day)}
                            aria-current={
                              day === wibDate() ? "date" : undefined
                            }
                            className={`${styles.date} ${day === wibDate() ? styles.today : ""}`}
                          >
                            {Number(day.slice(-2))}
                          </time>
                          <div className={styles.events}>
                            {eventsOnDay(events, day).map(eventButton)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            days.map((day) => {
              const daily = eventsOnDay(events, day);
              return daily.length ? (
                <section key={day} className={styles.agenda}>
                  <Typography.Title level={3} style={{ fontSize: 16 }}>
                    {dateLabel(day)}
                  </Typography.Title>
                  {daily.map(eventButton)}
                </section>
              ) : null;
            })
          )}
        </>
      )}
      <Modal
        open={selected !== null}
        title={selected?.title}
        onCancel={() => setSelected(null)}
        footer={
          selected && canManage ? (
            <Space>
              <Button
                onClick={() => {
                  setEditor(selected);
                  setSelected(null);
                }}
              >
                Ubah acara
              </Button>
              <Button danger onClick={() => remove(selected)}>
                Hapus acara
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setSelected(null)}>Tutup</Button>
          )
        }
      >
        {selected && (
          <div className={styles.details}>
            <Typography.Paragraph>
              {eventSchedule(selected)}
            </Typography.Paragraph>
            {selected.location && (
              <Typography.Paragraph>
                <strong>Lokasi:</strong> {selected.location}
              </Typography.Paragraph>
            )}
            {selected.description && (
              <Typography.Paragraph>
                {selected.description}
              </Typography.Paragraph>
            )}
            {selected.activity && (
              <Typography.Paragraph>
                {selected.activity.is_published && publicBaseUrl ? (
                  <a
                    href={`${publicBaseUrl}/activity/${encodeURIComponent(selected.activity.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lihat kegiatan: {selected.activity.name}
                  </a>
                ) : selected.activity.is_published && canReadActivities ? (
                  <Link to={`/activity/${selected.activity.id}`}>
                    Lihat kegiatan: {selected.activity.name}
                  </Link>
                ) : (
                  `${selected.activity.is_published ? "Kegiatan" : "Kegiatan draf"}: ${selected.activity.name}`
                )}
              </Typography.Paragraph>
            )}
          </div>
        )}
      </Modal>
      {editor && canManage && (
        <CalendarForm
          event={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setRevision((value) => value + 1);
            void notification.success(
              "Acara tersimpan dan terlihat di Kalender BMKA",
            );
          }}
        />
      )}
    </main>
  );
}
