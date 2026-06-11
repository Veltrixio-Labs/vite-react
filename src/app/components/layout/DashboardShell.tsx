import { Building2, Globe2, LayoutDashboard, Menu, Package, Store, Users, X } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { useState } from "react";
import { appConfig } from "../../../config";
import type { PlatformTab, TenantTab, View } from "../../types";
import { Brand } from "../common/ui";

export function DashboardShell({
  view,
  platformTab,
  tenantTab,
  onPlatformTab,
  onTenantTab,
  mobileActions,
  children
}: {
  view: Exclude<View, "marketing" | "tenant-public">;
  platformTab: PlatformTab;
  tenantTab: TenantTab;
  onPlatformTab: (tab: PlatformTab) => void;
  onTenantTab: (tab: TenantTab) => void;
  mobileActions?: JSX.Element;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <main className="app-shell">
      <header className="mobile-app-bar">
        <button className="icon-button" onClick={() => setMenuOpen(true)} title="Open menu">
          <Menu size={18} />
        </button>
        <Brand />
        {mobileActions ? <div className="mobile-bar-actions">{mobileActions}</div> : null}
      </header>
      {menuOpen ? <button className="drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close menu" /> : null}
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <AppSidebar
          view={view}
          platformTab={platformTab}
          tenantTab={tenantTab}
          onPlatformTab={(tab) => {
            onPlatformTab(tab);
            closeMenu();
          }}
          onTenantTab={(tab) => {
            onTenantTab(tab);
            closeMenu();
          }}
        />
      </aside>
      <section className="content">
        <div className="content-main">{children}</div>
        <DashboardFooter />
      </section>
    </main>
  );
}

export function DashboardFooter() {
  return (
    <footer className="dashboard-footer">
      <div>
        <strong>{appConfig.companyName}</strong>
        <span>{appConfig.brandName} business cloud for modular operations.</span>
      </div>
      <div className="dashboard-footer-links">
        <a href={appConfig.websiteUrl} target="_blank" rel="noreferrer">
          Website
        </a>
        <a href={`mailto:${appConfig.supportEmail}`}>Support</a>
        {appConfig.whatsappUrl ? (
          <a href={appConfig.whatsappUrl} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        ) : null}
      </div>
    </footer>
  );
}

export function AppSidebar({
  view,
  platformTab,
  tenantTab,
  onPlatformTab,
  onTenantTab
}: {
  view: View;
  platformTab: PlatformTab;
  tenantTab: TenantTab;
  onPlatformTab: (tab: PlatformTab) => void;
  onTenantTab: (tab: TenantTab) => void;
}) {
  return (
    <>
      <Brand />
      {view === "platform" ? (
        <>
          <div className="sidebar-label">Platform Admin</div>
          <button className={platformTab === "overview" ? "nav-item active" : "nav-item"} onClick={() => onPlatformTab("overview")}>
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button className={platformTab === "provision" ? "nav-item active" : "nav-item"} onClick={() => onPlatformTab("provision")}>
            <Building2 size={18} />
            Provision
          </button>
          <button className={platformTab === "customers" ? "nav-item active" : "nav-item"} onClick={() => onPlatformTab("customers")}>
            <Store size={18} />
            Customers
          </button>
          <button className={platformTab === "catalog" ? "nav-item active" : "nav-item"} onClick={() => onPlatformTab("catalog")}>
            <Package size={18} />
            Catalog
          </button>
          <button className={platformTab === "staff" ? "nav-item active" : "nav-item"} onClick={() => onPlatformTab("staff")}>
            <Users size={18} />
            Staff
          </button>
        </>
      ) : (
        <>
          <div className="sidebar-label">Tenant Workspace</div>
          <button className={tenantTab === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => onTenantTab("dashboard")}>
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button className={tenantTab === "website" ? "nav-item active" : "nav-item"} onClick={() => onTenantTab("website")}>
            <Globe2 size={18} />
            Website
          </button>
          <button className={tenantTab === "users" ? "nav-item active" : "nav-item"} onClick={() => onTenantTab("users")}>
            <Users size={18} />
            Users
          </button>
          <button className={tenantTab === "modules" ? "nav-item active" : "nav-item"} onClick={() => onTenantTab("modules")}>
            <Package size={18} />
            Modules
          </button>
        </>
      )}
    </>
  );
}
