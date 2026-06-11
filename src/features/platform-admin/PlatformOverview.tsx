import { Activity, Building2, Package, ShieldCheck, Users } from "lucide-react";
import { tenantHostForSlug } from "../../config";
import { EmptyState, Metric, SectionHeader, StatusBadge } from "../../app/components/ui";
import { formatDate, shouldShowSuspensionNotice, tenantModuleNotices, renderIcon } from "../../app/app-helpers";
import type { PlatformModule, PlatformTenant, PlatformUser } from "../../app/types";
import { TenantTable } from "./TenantCustomers";

export function PlatformOverview({
  tenants,
  modules,
  users,
  onRefresh,
  onSelectTenant,
  onTenantStatus
}: {
  tenants: PlatformTenant[];
  modules: PlatformModule[];
  users: PlatformUser[];
  onRefresh: () => void;
  onSelectTenant: (tenant: PlatformTenant) => void;
  onTenantStatus: (slug: string, status: string) => void;
}) {
  const suspensionNotices = tenants.filter((tenant) => shouldShowSuspensionNotice(tenant.suspensionNoticeAt, tenant.suspensionEffectiveAt));
  const moduleNotices = tenantModuleNotices(tenants);

  return (
    <section className="stack">
      {suspensionNotices.length ? <SuspensionNoticeList tenants={suspensionNotices} /> : null}
      {moduleNotices.length ? <PlatformModuleNoticeList notices={moduleNotices} onSelectTenant={onSelectTenant} /> : null}
      <div className="metric-grid">
        <Metric icon={<Building2 size={20} />} label="Customers" value={tenants.length} />
        <Metric icon={<Package size={20} />} label="Modules" value={modules.length} />
        <Metric icon={<Users size={20} />} label="Platform users" value={users.length} />
      </div>
      <div className="panel table-panel">
        <SectionHeader icon={<Activity size={20} />} title="Recent Customers" action={<button className="secondary-button" onClick={onRefresh}>Refresh</button>} />
        <TenantTable tenants={tenants.slice(0, 6)} onSelect={onSelectTenant} onStatus={onTenantStatus} />
      </div>
    </section>
  );
}

function SuspensionNoticeList({ tenants }: { tenants: PlatformTenant[] }) {
  return (
    <div className="panel suspension-panel">
      <SectionHeader icon={<ShieldCheck size={20} />} title="Tenant Suspension Notices" />
      <div className="admin-card-list">
        {tenants.map((tenant) => (
          <article className="admin-list-card warning-card" key={tenant.slug}>
            <div className="admin-card-main">
              <div className="entity-avatar danger">
                <ShieldCheck size={18} />
              </div>
              <div className="entity-copy">
              <strong>{tenant.name}</strong>
              <span>{tenantHostForSlug(tenant.slug)}</span>
              </div>
            </div>
            <div className="admin-card-meta">
              <StatusBadge status={tenant.status} />
              <span>Effective {formatDate(tenant.suspensionEffectiveAt)}</span>
            </div>
            <p className="admin-card-note">{tenant.suspensionReason ?? "No reason provided."}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PlatformModuleNoticeList({
  notices,
  onSelectTenant
}: {
  notices: Array<{ tenant: PlatformTenant; module: PlatformTenant["enabledModules"][number] }>;
  onSelectTenant: (tenant: PlatformTenant) => void;
}) {
  return (
    <div className="panel suspension-panel">
      <SectionHeader icon={<Package size={20} />} title="Module Renewal Notices" />
      <div className="admin-card-list">
        {notices.map(({ tenant, module }) => (
          <article className={module.code === "website" ? "admin-list-card warning-card highlight-row" : "admin-list-card warning-card"} key={`${tenant.slug}-${module.code}`}>
            <div className="admin-card-main">
              <div className="entity-avatar">
                {renderIcon({ code: module.code }, 18)}
              </div>
              <div className="entity-copy">
                <strong>{tenant.name}</strong>
                <span>{module.name} / {module.code}</span>
              </div>
            </div>
            <div className="admin-card-meta">
              <StatusBadge status="active" />
              <span>{module.billingCycle ?? "monthly"}</span>
              <span>Expires {formatDate(module.expiresAt)}</span>
            </div>
            <p className="admin-card-note">{module.tenantNote ?? "Renewal follow-up required. Contact customer before module expiry."}</p>
            <div className="admin-card-actions">
              <button className="secondary-button" type="button" onClick={() => onSelectTenant(tenant)}>
                View Customer
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
