import { Layout, Menu, Typography } from "antd";
import { useLocation } from "react-router-dom";
import { menuItems } from "./data";
import { SidebarProps } from "../../../types";

const { Sider } = Layout;
const { Text } = Typography;

const SideMenu = ({ collapsed, onCollapse }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Determine selected keys based on current path
  const getSelectedKeys = () => {
    if (currentPath.startsWith('/dashboard')) return ['/dashboard'];
    if (currentPath.startsWith('/activity')) return ['/activity'];
    if (currentPath.startsWith('/member')) return ['/member'];
    if (currentPath.startsWith('/ruang-curhat')) return ['/ruang-curhat'];
    if (currentPath.startsWith('/achievement')) return ['/achievement'];
    if (currentPath.startsWith('/club')) return ['/club'];
    if (currentPath.startsWith('/province')) return ['/province'];
    if (currentPath.startsWith('/universities')) return ['/universities'];
    if (currentPath.startsWith('/custom-form')) return ['/custom-form'];
    if (currentPath.startsWith('/admin-users')) return ['/admin-users'];
    return ['/dashboard'];
  };

  const getOpenKeys = () => {
    if (currentPath.startsWith('/province') || 
        currentPath.startsWith('/universities') || 
        currentPath.startsWith('/custom-form')) {
      return ['/data-center'];
    }
    if (currentPath.startsWith('/admin-users')) {
      return ['setting'];
    }
    return [];
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={200}
      collapsedWidth={80}
      style={{
        overflow: "hidden",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1001,
        background: 'linear-gradient(135deg, #1F99CB 0%, #229ACC 100%)',

        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Logo Section */}
      <div 
        className="logo-section"
        style={{
          padding: collapsed ? '16px 8px' : '20px 16px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '8px',
          transition: 'all 0.3s ease',
        }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 12,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            position: 'relative',
            display: 'inline-block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <img 
              src={'/BMKA_logo.svg'} 
              alt="BMKA Logo"
              style={{
                width: collapsed ? 42 : 52,
                height: collapsed ? 42 : 52,
                borderRadius: collapsed ? '10px' : '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                background: '#ffffff',
                padding: '6px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',

              }}
              className="bmka-logo"
            />

          </div>
          {!collapsed && (
            <div style={{ 
              textAlign: 'left',
              overflow: 'hidden'
            }}>
              <Text style={{
                color: '#ffffff',
                fontSize: '17px',
                fontWeight: 700,
                lineHeight: 1.1,
                display: 'block',
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                marginBottom: '2px'
              }}>
                BMKA Admin
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '11px',
                lineHeight: 1.1,
                display: 'block',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                opacity: 0.9
              }}>
                Dashboard
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Menu Section */}
      <div style={{
        height: 'calc(100vh - 100px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0 8px',
      }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems()}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
          }}
          inlineIndent={16}
        />
      </div>
    </Sider>
  );
};

export default SideMenu;

// Add custom styles for sidebar
const sidebarStyles = `
  .ant-menu-dark {
    background: transparent !important;
  }
  
  .ant-menu-dark .ant-menu-item {
    background: transparent !important;
    margin: 4px 0 !important;
    border-radius: 8px !important;
    height: 40px !important;
    line-height: 40px !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .ant-menu-dark .ant-menu-item:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    transform: translateX(4px);
  }
  
  .ant-menu-dark .ant-menu-item-selected {
    background: rgba(255, 255, 255, 0.15) !important;
    border-right: 3px solid #ffffff;
    font-weight: 500;
  }
  
  .ant-menu-dark .ant-menu-submenu-title {
    background: transparent !important;
    margin: 4px 0 !important;
    border-radius: 8px !important;
    height: 40px !important;
    line-height: 40px !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .ant-menu-dark .ant-menu-submenu-title:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    transform: translateX(4px);
  }
  
  .ant-menu-dark .ant-menu-submenu-open > .ant-menu-submenu-title {
    background: rgba(255, 255, 255, 0.1) !important;
  }
  
  .ant-menu-dark .ant-menu-sub {
    background: rgba(0, 0, 0, 0.1) !important;
    border-radius: 8px;
    margin: 4px 0;
  }
  
  .ant-menu-dark .ant-menu-sub .ant-menu-item {
    padding-left: 32px !important;
    margin: 2px 8px !important;
    height: 36px !important;
    line-height: 36px !important;
  }
  
  .ant-menu-dark .ant-menu-item a,
  .ant-menu-dark .ant-menu-submenu-title {
    color: rgba(255, 255, 255, 0.9) !important;
  }
  
  .ant-menu-dark .ant-menu-item-selected a {
    color: #ffffff !important;
    font-weight: 500;
  }
  
  .ant-menu-dark .ant-menu-item .anticon,
  .ant-menu-dark .ant-menu-submenu-title .anticon {
    color: rgba(255, 255, 255, 0.8) !important;
    font-size: 16px;
  }
  
  .ant-menu-dark .ant-menu-item-selected .anticon {
    color: #ffffff !important;
  }
  

  
  /* Custom scrollbar for sidebar */
  .ant-layout-sider::-webkit-scrollbar {
    width: 4px;
  }
  
  .ant-layout-sider::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .ant-layout-sider::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  .ant-layout-sider::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

`;

// Inject sidebar styles
if (typeof document !== 'undefined') {
  const existingSidebarStyle = document.getElementById('sidebar-styles');
  if (!existingSidebarStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'sidebar-styles';
    styleSheet.textContent = sidebarStyles;
    document.head.appendChild(styleSheet);
  }
}
