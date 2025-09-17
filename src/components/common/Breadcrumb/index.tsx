import { Breadcrumb as AntBreadcrumb } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined,
  UserOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  WechatOutlined,
  SettingOutlined,
  TrophyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

interface BreadcrumbItem {
  path: string;
  title: string;
  icon?: React.ReactNode;
}

// Hardcoded breadcrumb mappings for all routes
const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  "/": [
    { path: "/", title: "Beranda", icon: <HomeOutlined /> }
  ],
  "/dashboard": [
    { path: "/", title: "Beranda", icon: <HomeOutlined /> }
  ],
  "/member": [
    { path: "/member", title: "Anggota", icon: <UserOutlined /> }
  ],
  "/activity": [
    { path: "/activity", title: "Kegiatan", icon: <ScheduleOutlined /> }
  ],
  "/universities": [
    { path: "/universities", title: "Perguruan Tinggi", icon: <DatabaseOutlined /> }
  ],
  "/province": [
    { path: "/province", title: "Provinsi", icon: <DatabaseOutlined /> }
  ],
  "/ruang-curhat": [
    { path: "/ruang-curhat", title: "Ruang Curhat", icon: <WechatOutlined /> }
  ],
  "/admin-users": [
    { path: "/admin-users", title: "Akun Admin", icon: <SettingOutlined /> }
  ],
  "/achievement": [
    { path: "/achievement", title: "Leaderboard", icon: <TrophyOutlined /> }
  ],
  "/club": [
    { path: "/club", title: "Unit Kegiatan", icon: <TeamOutlined /> }
  ],
  "/custom-form": [
    { path: "/custom-form", title: "Form Kustom", icon: <DatabaseOutlined /> }
  ]
};

// Helper function to get breadcrumbs for dynamic routes
const getDynamicBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Member detail pages
  if (pathname.match(/^\/member\/\d+$/)) {
    return [
      { path: "/member", title: "Anggota" },
      { path: "", title: "Detail Anggota" },
      { path: "", title: pathname.split('/').pop() || "" }
    ];
  }

  // Activity detail pages
  if (pathname.match(/^\/activity\/\d+$/)) {
    return [
      { path: "/activity", title: "Kegiatan" },
      { path: "", title: "Detail Kegiatan" },
      { path: "", title: pathname.split('/').pop() || "" }
    ];
  }

  // Registrant detail pages
  if (pathname.match(/^\/registrant\/\d+$/)) {
    return [
      { path: "/activity", title: "Kegiatan" },
      { path: "", title: "Detail Kegiatan" },
      { path: "", title: "Detail Peserta" },
      { path: "", title: pathname.split('/').pop() || "" }
    ];
  }

  // Ruang Curhat detail pages
  if (pathname.match(/^\/ruang-curhat\/\d+$/)) {
    return [
      { path: "/ruang-curhat", title: "Ruang Curhat" },
      { path: "", title: "Detail Ruang Curhat" },
      { path: "", title: pathname.split('/').pop() || "" }
    ];
  }

  // Achievement detail pages
  if (pathname.match(/^\/achievement\/\d+$/)) {
    return [
      { path: "/achievement", title: "Leaderboard" },
      { path: "", title: "Detail Leaderboard" },
      { path: "", title: pathname.split('/').pop() || "" }
    ];
  }

  // Club detail pages
  if (pathname.match(/^\/club\/\d+$/)) {
    return [
      { path: "/club", title: "Unit Kegiatan" },
      { path: "", title: "Detail Unit Kegiatan" },
      { path: "", title: pathname.split('/').pop() || "" }
    ];
  }

  // Custom form edit pages
  if (pathname.match(/^\/custom-form\/\d+\/edit$/)) {
    return [
      { path: "/custom-form", title: "Form Kustom" },
      { path: "", title: "Ubah Form Kustom" },
      { path: "", title: pathname.split('/')[2] || "" }
    ];
  }

  // Default fallback
  return [
    { path: "/", title: "Beranda", icon: <HomeOutlined /> }
  ];
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
    if (path) { // Only navigate if path is not empty
      navigate(path);
    }
  };

  // On mobile, show only the last 2 items
  const displayBreadcrumbs = isMobile ? breadcrumbs.slice(-2) : breadcrumbs;

  const items = displayBreadcrumbs.map((crumb, index) => {
    const isLast = index === displayBreadcrumbs.length - 1;
    
    const isClickable = crumb.path && crumb.path !== '';

    return {
      title: isLast ? (
        <span style={{ color: "#666" }}>
          {crumb.icon && <span style={{ marginRight: 4 }}>{crumb.icon}</span>}
          {crumb.title}
        </span>
      ) : (
        <span
          style={{
            cursor: isClickable ? "pointer" : "default",
            color: isClickable ? "#1890ff" : "#666",
            transition: isClickable ? "color 0.3s" : "none"
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
          {crumb.icon && <span style={{ marginRight: 4 }}>{crumb.icon}</span>}
          {crumb.title}
        </span>
      )
    };
  });

  return (
    <AntBreadcrumb
      items={items}
      style={{ 
        margin: 0,
        fontSize: isMobile ? "12px" : "13px"
      }}
      separator=">"
    />
  );
};

export default Breadcrumb;
