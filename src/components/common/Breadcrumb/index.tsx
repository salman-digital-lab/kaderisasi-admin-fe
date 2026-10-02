import { Breadcrumb as AntBreadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useAdminViewport } from "../../../hooks/useAdminViewport";
import { NAV_LABELS } from "../../../constants/navigation";

interface BreadcrumbItem {
  /** Empty for the current page or for non-navigable menu groups. */
  path: string;
  title: string;
}

const L = NAV_LABELS;

const crumb = (path: string, title: string): BreadcrumbItem => ({
  path,
  title,
});
const current = (title: string): BreadcrumbItem => crumb("", title);

const ACCESS = crumb("", L.accessGroup);
const LEADERBOARD = crumb("", L.leaderboardGroup);
const DATA_CENTER = crumb("", L.dataCenterGroup);
const SETTINGS = crumb("", L.settingsGroup);

// Labels match the side menu (constants/navigation.ts).
const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  "/": [current(L.dashboard)],
  "/dashboard": [current(L.dashboard)],
  "/calendar": [current(L.calendar)],
  "/announcements": [current(L.announcements)],
  "/notifications": [current(L.notifications)],
  "/profile": [current(L.profile)],
  "/profile/talent-assessment": [
    crumb("/profile", L.profile),
    current("Asesmen Bakat"),
  ],
  "/profile/talent-assessment/result": [
    crumb("/profile", L.profile),
    current("Hasil Asesmen"),
  ],
  "/my-requests": [ACCESS, current(L.myRequests)],
  "/my-requests/new": [
    ACCESS,
    crumb("/my-requests", L.myRequests),
    current("Ajukan Akses"),
  ],
  "/ticket-review": [ACCESS, current(L.ticketReview)],
  "/member": [current(L.members)],
  "/activity": [current(L.activities)],
  "/activity/new": [crumb("/activity", L.activities), current("Buat Kegiatan")],
  "/universities": [DATA_CENTER, current(L.universities)],
  "/province": [DATA_CENTER, current(L.provinces)],
  "/ruang-curhat": [current(L.counseling)],
  "/admin-users": [SETTINGS, current(L.adminUsers)],
  "/rbac/roles": [SETTINGS, current(L.roles)],
  "/achievement": [LEADERBOARD, current(L.achievements)],
  "/monthly-leaderboard": [LEADERBOARD, current(L.monthlyLeaderboard)],
  "/lifetime-leaderboard": [LEADERBOARD, current(L.lifetimeLeaderboard)],
  "/club": [current(L.clubs)],
  "/courses": [current(L.courses)],
  "/short-links": [current(L.shortLinks)],
  "/digital-certificate": [current(L.certificates)],
  "/custom-form": [current(L.customForms)],
  "/forbidden": [current("Akses Ditolak")],
};

interface BreadcrumbState {
  activityId?: number | string;
}

const getDynamicBreadcrumbs = (
  pathname: string,
  state?: BreadcrumbState | null,
): BreadcrumbItem[] => {
  const segments = pathname.split("/");
  const activityRoot = crumb("/activity", L.activities);

  if (/^\/activity\/\d+\/setup$/.test(pathname))
    return [activityRoot, current("Siapkan Kegiatan")];

  if (/^\/my-requests\/[^/]+$/.test(pathname))
    return [
      ACCESS,
      crumb("/my-requests", L.myRequests),
      current("Detail Permintaan"),
    ];
  if (/^\/ticket-review\/[^/]+$/.test(pathname))
    return [
      ACCESS,
      crumb("/ticket-review", L.ticketReview),
      current("Detail Permintaan"),
    ];

  if (/^\/member\/\d+$/.test(pathname))
    return [crumb("/member", L.members), current("Detail Anggota")];

  if (/^\/activity\/\d+$/.test(pathname))
    return [activityRoot, current("Detail Kegiatan")];

  if (/^\/activity\/\d+\/certificates$/.test(pathname))
    return [
      activityRoot,
      crumb(`/activity/${segments[2]}`, "Detail Kegiatan"),
      current("Sertifikat"),
    ];

  if (/^\/registrant\/\d+$/.test(pathname)) {
    if (state?.activityId) {
      return [
        activityRoot,
        crumb(`/activity/${state.activityId}`, "Detail Kegiatan"),
        crumb(`/activity/${state.activityId}/participants`, "Kelola Peserta"),
        current("Detail Peserta"),
      ];
    }
    return [activityRoot, current("Detail Peserta")];
  }

  if (/^\/activity\/\d+\/participants$/.test(pathname))
    return [
      activityRoot,
      crumb(`/activity/${segments[2]}`, "Detail Kegiatan"),
      current("Kelola Peserta"),
    ];

  if (/^\/activity\/\d+\/participants\/\d+$/.test(pathname))
    return [
      activityRoot,
      crumb(`/activity/${segments[2]}`, "Detail Kegiatan"),
      crumb(`/activity/${segments[2]}/participants`, "Kelola Peserta"),
      current("Detail Peserta"),
    ];

  if (/^\/ruang-curhat\/\d+$/.test(pathname))
    return [crumb("/ruang-curhat", L.counseling), current("Detail Curhat")];

  if (/^\/achievement\/\d+$/.test(pathname))
    return [
      LEADERBOARD,
      crumb("/achievement", L.achievements),
      current("Detail Prestasi"),
    ];

  if (/^\/admin-users\/\d+\/talent-assessment\/result$/.test(pathname))
    return [
      SETTINGS,
      crumb("/admin-users", L.adminUsers),
      current("Hasil Asesmen"),
    ];

  if (/^\/courses\/\d+$/.test(pathname))
    return [crumb("/courses", L.courses), current("Detail Kelas")];

  if (/^\/club\/\d+$/.test(pathname))
    return [crumb("/club", L.clubs), current("Detail Klub")];

  if (/^\/club\/\d+\/form\/\d+\/edit$/.test(pathname))
    return [
      crumb("/club", L.clubs),
      crumb(`/club/${segments[2]}?section=registration`, "Pendaftaran"),
      current("Ubah Formulir Pendaftaran"),
    ];

  if (/^\/custom-form\/\d+\/edit$/.test(pathname))
    return [crumb("/custom-form", L.customForms), current("Ubah Formulir")];

  if (/^\/custom-form\/\d+\/files\/[^/]+$/.test(pathname))
    return [crumb("/custom-form", L.customForms), current("Berkas Jawaban")];

  if (/^\/activity\/\d+\/form\/\d+\/edit$/.test(pathname))
    return [
      activityRoot,
      crumb(`/activity/${segments[2]}?tab=7`, "Detail Kegiatan"),
      current("Ubah Formulir Pendaftaran"),
    ];

  return [current("Halaman Tidak Ditemukan")];
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { drawerNavigation: isMobile } = useAdminViewport();

  const breadcrumbs =
    breadcrumbMap[location.pathname] ??
    getDynamicBreadcrumbs(
      location.pathname,
      location.state as BreadcrumbState | null,
    );

  // On small screens keep the parent and the current page.
  const visible = isMobile ? breadcrumbs.slice(-2) : breadcrumbs;

  const items = visible.map((item, index) => {
    const isLast = index === visible.length - 1;
    return {
      key: `${index}-${item.title}`,
      title:
        !isLast && item.path ? (
          <Link to={item.path}>{item.title}</Link>
        ) : (
          item.title
        ),
    };
  });

  return (
    <AntBreadcrumb
      aria-label="Breadcrumb"
      items={items}
      style={{ fontSize: 13, minWidth: 0, overflowWrap: "anywhere" }}
    />
  );
};

export default Breadcrumb;
