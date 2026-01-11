import { Breadcrumb as AntBreadcrumb } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface BreadcrumbItem {
  path: string;
  title: string;
}

// Hardcoded breadcrumb mappings for all routes
const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  "/": [{ path: "/", title: "Beranda" }],
  "/dashboard": [{ path: "/", title: "Beranda" }],
  "/member": [{ path: "/member", title: "Daftar Anggota" }],
  "/activity": [{ path: "/activity", title: "Daftar Kegiatan" }],
  "/universities": [
    {
      path: "/universities",
      title: "Daftar Perguruan Tinggi",
    },
  ],
  "/province": [{ path: "/province", title: "Daftar Provinsi" }],
  "/ruang-curhat": [{ path: "/ruang-curhat", title: "Daftar Ruang Curhat" }],
  "/admin-users": [{ path: "/admin-users", title: "Daftar Akun Admin" }],
  "/achievement": [{ path: "/achievement", title: "Daftar Prestasi" }],
  "/monthly-leaderboard": [
    {
      path: "/monthly-leaderboard",
      title: "Daftar Peringkat Bulanan",
    },
  ],
  "/lifetime-leaderboard": [
    {
      path: "/lifetime-leaderboard",
      title: "Daftar Peringkat Seumur Hidup",
    },
  ],
  "/club": [{ path: "/club", title: "Daftar Unit Kegiatan" }],
  "/custom-form": [{ path: "/custom-form", title: "Daftar Form Kustom" }],
};

// Helper function to get breadcrumbs for dynamic routes
const getDynamicBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Member detail pages
  if (pathname.match(/^\/member\/\d+$/)) {
    return [
      { path: "/member", title: "Daftar Anggota" },
      { path: "", title: "Detail Anggota" },
    ];
  }

  // Activity detail pages
  if (pathname.match(/^\/activity\/\d+$/)) {
    return [
      { path: "/activity", title: "Daftar Kegiatan" },
      { path: "", title: "Detail Kegiatan" },
    ];
  }

  // Registrant detail pages
  if (pathname.match(/^\/registrant\/\d+$/)) {
    return [
      { path: "/activity", title: "Daftar Kegiatan" },
      { path: "", title: "Detail Kegiatan" },
      { path: "", title: "Detail Peserta" },
    ];
  }

  // Activity participants management page
  if (pathname.match(/^\/activity\/\d+\/participants$/)) {
    const activityId = pathname.split("/")[2];
    return [
      { path: "/activity", title: "Daftar Kegiatan" },
      { path: `/activity/${activityId}`, title: "Detail Kegiatan" },
      { path: "", title: "Kelola Peserta" },
    ];
  }

  // Ruang Curhat detail pages
  if (pathname.match(/^\/ruang-curhat\/\d+$/)) {
    return [
      { path: "/ruang-curhat", title: "Daftar Ruang Curhat" },
      { path: "", title: "Detail Ruang Curhat" },
    ];
  }

  // Achievement detail pages
  if (pathname.match(/^\/achievement\/\d+$/)) {
    return [
      { path: "/achievement", title: "Daftar Prestasi" },
      { path: "", title: "Detail Prestasi" },
    ];
  }

  // Club detail pages
  if (pathname.match(/^\/club\/\d+$/)) {
    return [
      { path: "/club", title: "Daftar Unit Kegiatan" },
      { path: "", title: "Detail Unit Kegiatan" },
    ];
  }

  // Custom form edit pages
  if (pathname.match(/^\/custom-form\/\d+\/edit$/)) {
    return [
      { path: "/custom-form", title: "Daftar Form Kustom" },
      { path: "", title: "Ubah Form Kustom" },
    ];
  }

  // Default fallback
  return [{ path: "/", title: "Beranda" }];
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get breadcrumbs for current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    // First check if it's a static route
    if (breadcrumbMap[location.pathname]) {
      return breadcrumbMap[location.pathname];
    }

    // Then check for dynamic routes
    return getDynamicBreadcrumbs(location.pathname);
  };

  const breadcrumbs = getBreadcrumbs();

  const handleBreadcrumbClick = (path: string) => {
    if (path) {
      // Only navigate if path is not empty
      navigate(path);
    }
  };

  // On mobile, show only the last 2 items
  const displayBreadcrumbs = isMobile ? breadcrumbs.slice(-2) : breadcrumbs;

  const items = displayBreadcrumbs.map((crumb, index) => {
    const isLast = index === displayBreadcrumbs.length - 1;

    const isClickable = crumb.path && crumb.path !== "";

    return {
      title: isLast ? (
        <span style={{ color: "#666" }}>{crumb.title}</span>
      ) : (
        <span
          style={{
            cursor: isClickable ? "pointer" : "default",
            color: isClickable ? "#1890ff" : "#666",
            transition: isClickable ? "color 0.3s" : "none",
          }}
          onClick={() => handleBreadcrumbClick(crumb.path)}
          onMouseEnter={(e) => {
            if (isClickable) {
              e.currentTarget.style.color = "#40a9ff";
            }
          }}
          onMouseLeave={(e) => {
            if (isClickable) {
              e.currentTarget.style.color = "#1890ff";
            }
          }}
        >
          {crumb.title}
        </span>
      ),
    };
  });

  return (
    <AntBreadcrumb
      items={items}
      style={{
        margin: 0,
        fontSize: isMobile ? "12px" : "13px",
      }}
      separator=">"
    />
  );
};

export default Breadcrumb;
