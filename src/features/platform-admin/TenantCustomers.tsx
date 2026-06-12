import { Building2, Globe2, Package, Receipt, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { tenantHostForSlug } from "../../config";
import { Badge, DetailItem, EmptyState, Field, NoticeBanner, SectionHeader, StatusBadge, TextAreaField } from "../../app/components/ui";
import { dateInputValue, emptyModuleScheduleForm, formatDate, moduleScheduleForms, nextMonthDateInput } from "../../app/app-helpers";
import type { PlatformModule, PlatformTenant } from "../../app/types";

export function TenantTable({ tenants, onSelect, onStatus }: { tenants: PlatformTenant[]; onSelect?: (tenant: PlatformTenant) => void; onStatus?: (slug: string, status: string) => void }) {
  return (
    <div className="admin-card-list">
      {tenants.length ? (
        tenants.map((tenant) => (
          <article className="admin-list-card customer-card" key={tenant.slug}>
            <button className="admin-card-main as-button" type="button" onClick={() => onSelect?.(tenant)}>
              <div className="entity-avatar">
                <Building2 size={18} />
              </div>
              <div className="entity-copy">
                <strong>{tenant.name}</strong>
                <span>{tenantHostForSlug(tenant.slug)}</span>
              </div>
            </button>

            <div className="admin-card-meta customer-meta">
              <span><Globe2 size={14} />{tenant.country}</span>
              <span>{tenant.currency}</span>
              <span>{(tenant.billingMode ?? "trial").replace(/_/g, " ")}</span>
              <span>{tenant.enabledModules.length} modules</span>
            </div>

            <div className="admin-card-note">
              {tenant.enabledModules.map((module) => module.name).join(", ") || "No modules enabled"}
            </div>

            <div className="admin-card-actions">
              <StatusBadge status={tenant.status} />
              <button className="secondary-button" type="button" onClick={() => onSelect?.(tenant)}>
                View
              </button>
              {onStatus ? (
                tenant.status === "suspended" ? (
                  <button className="secondary-button" type="button" onClick={() => onStatus(tenant.slug, "active")}>
                    Reactivate
                  </button>
                ) : tenant.suspensionPolicy === "disabled" ? (
                  <button className="secondary-button" type="button" disabled title="Suspension is disabled by policy">
                    Protected
                  </button>
                ) : (
                  <button className="secondary-button danger" type="button" onClick={() => onSelect?.(tenant)}>
                    Suspend...
                  </button>
                )
              ) : null}
            </div>
          </article>
        ))
      ) : (
        <EmptyState text="No customers found." />
      )}
    </div>
  );
}

export function TenantDetailModal({
  tenant,
  availableModules,
  onClose,
  onScheduleSuspension,
  onImmediateSuspension,
  onClearSuspension,
  onBillingPolicy,
  onTenantModule
}: {
  tenant: PlatformTenant;
  availableModules: PlatformModule[];
  onClose: () => void;
  onScheduleSuspension: (slug: string, body: { effectiveAt: string; reason: string }) => void;
  onImmediateSuspension: (slug: string, reason: string) => void;
  onClearSuspension: (slug: string) => void;
  onBillingPolicy: (slug: string, body: { billingMode: string; suspensionPolicy: string }) => void;
  onTenantModule: (
    slug: string,
    moduleCode: string,
    body: { enabled: boolean; billingCycle?: string; startsAt?: string; expiresAt?: string; tenantNote?: string; internalNote?: string }
  ) => void;
}) {
  const [suspensionForm, setSuspensionForm] = useState({
    effectiveAt: dateInputValue(tenant.suspensionEffectiveAt) || nextMonthDateInput(),
    reason: tenant.suspensionReason ?? ""
  });
  const [policyForm, setPolicyForm] = useState({
    billingMode: tenant.billingMode ?? "trial",
    suspensionPolicy: tenant.suspensionPolicy ?? "standard"
  });
  const [moduleForms, setModuleForms] = useState(() => moduleScheduleForms(availableModules, tenant.enabledModules));

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    setModuleForms(moduleScheduleForms(availableModules, tenant.enabledModules));
  }, [availableModules, tenant.enabledModules]);

  useEffect(() => {
    setPolicyForm({
      billingMode: tenant.billingMode ?? "trial",
      suspensionPolicy: tenant.suspensionPolicy ?? "standard"
    });
  }, [tenant.billingMode, tenant.suspensionPolicy]);

  const domain = tenantHostForSlug(tenant.slug);
  const primaryDatabase = tenant.databases?.[0];
  const databaseStatus = primaryDatabase?.status ?? "not_available";
  const databaseNeedsAction = databaseStatus === "pending" || databaseStatus === "failed";
  const monthlyTotal = tenant.enabledModules.reduce((total, module) => total + (module.monthlyPrice ?? 0), 0);
  const enabledModuleCodes = new Set(tenant.enabledModules.map((module) => module.code));
  const currentBillingMode = tenant.billingMode ?? "trial";
  const currentSuspensionPolicy = tenant.suspensionPolicy ?? "standard";
  const suspensionDisabled = currentSuspensionPolicy === "disabled";
  const scheduleSuspensionDisabled = suspensionDisabled || currentSuspensionPolicy === "manual_only" || currentBillingMode === "internal";

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" aria-label="Close customer details" onClick={onClose} />
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="tenant-detail-title">
        <header className="modal-header">
          <div>
            <p className="eyebrow">{domain}</p>
            <h2 id="tenant-detail-title">{tenant.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </header>

        <div className="detail-grid">
          <DetailItem label="Slug" value={tenant.slug} />
          <DetailItem label="Workspace access" value={tenant.status} />
          <DetailItem label="Billing mode" value={currentBillingMode.replace(/_/g, " ")} />
          <DetailItem label="Suspension policy" value={currentSuspensionPolicy.replace(/_/g, " ")} />
          <DetailItem label="Country" value={tenant.country} />
          <DetailItem label="Currency" value={tenant.currency} />
          <DetailItem label="Timezone" value={tenant.timezone} />
          <DetailItem label="Owner name" value={tenant.ownerName ?? "Not recorded"} />
          <DetailItem label="Owner email" value={tenant.ownerEmail ?? "Not recorded"} wide />
          <DetailItem label="Enabled modules" value={tenant.enabledModules.length} />
          <DetailItem label="Monthly module value" value={`${tenant.currency} ${monthlyTotal.toLocaleString()}`} />
          <DetailItem label="Database" value={primaryDatabase?.databaseName ?? "Not linked"} wide />
          <DetailItem label="Schema version" value={primaryDatabase?.schemaVersion ?? "Not available"} />
          <DetailItem label="Database status" value={primaryDatabase?.status ?? "Not available"} />
        </div>

        {databaseNeedsAction ? (
          <NoticeBanner
            notice={{
              kind: "error",
              text:
                databaseStatus === "failed"
                  ? `Database provisioning failed for ${primaryDatabase?.databaseName}. Create that MySQL database manually if needed, then retry provisioning with the same slug and owner details.`
                  : `Database provisioning is pending for ${primaryDatabase?.databaseName}. Tenant users cannot sign in until the database is active.`
            }}
          />
        ) : null}

        <form
          className="modal-section"
          onSubmit={(event) => {
            event.preventDefault();
            onBillingPolicy(tenant.slug, policyForm);
          }}
        >
          <SectionHeader icon={<Receipt size={20} />} title="Billing & Suspension Policy" />
          <div className="module-schedule-fields policy-fields">
            <label className="field">
              <span>Billing mode</span>
              <select value={policyForm.billingMode} onChange={(event) => setPolicyForm((current) => ({ ...current, billingMode: event.target.value }))}>
                <option value="trial">Trial customer</option>
                <option value="paid">Paid customer</option>
                <option value="partner">Partner customer</option>
                <option value="internal">Internal / own business</option>
              </select>
            </label>
            <label className="field">
              <span>Suspension policy</span>
              <select value={policyForm.suspensionPolicy} onChange={(event) => setPolicyForm((current) => ({ ...current, suspensionPolicy: event.target.value }))}>
                <option value="standard">Standard billing suspension</option>
                <option value="manual_only">Manual emergency only</option>
                <option value="disabled">Never suspend</option>
              </select>
            </label>
          </div>
          {policyForm.billingMode === "internal" || policyForm.suspensionPolicy !== "standard" ? (
            <NoticeBanner
              notice={{
                kind: "info",
                text:
                  policyForm.suspensionPolicy === "disabled"
                    ? "This tenant cannot be suspended while the policy is disabled."
                    : "Scheduled billing suspension will be blocked for this tenant. Use manual suspension only for real access/security issues."
              }}
            />
          ) : null}
          <div className="action-row wrap">
            <button className="primary-button" type="submit">
              Save Policy
            </button>
          </div>
        </form>

        <div className="modal-section">
          <SectionHeader icon={<Package size={20} />} title="Enabled Modules" />
          <div className="module-list">
            {tenant.enabledModules.length ? (
              tenant.enabledModules.map((module) => (
                <article className="module-row" key={module.code}>
                  <div>
                    <strong>{module.name}</strong>
                    <span>{module.product} / {module.code}</span>
                  </div>
                  <div>
                    <span>{module.billingCycle ?? "monthly"}</span>
                    <small>{tenant.currency} {(module.monthlyPrice ?? 0).toLocaleString()} monthly</small>
                  </div>
                  <Badge>{module.status}</Badge>
                </article>
              ))
            ) : (
              <EmptyState text="No modules enabled for this customer." />
            )}
          </div>
        </div>

        <div className="modal-section">
          <SectionHeader icon={<Globe2 size={20} />} title="Customer Module Access" />
          <div className="module-list">
            {availableModules.map((module) => {
              const enabled = enabledModuleCodes.has(module.code);
              const form = moduleForms[module.code] ?? emptyModuleScheduleForm();

              return (
                <article className={module.code === "website" ? "module-row highlight-row" : "module-row"} key={module.code}>
                  <div>
                    <strong>{module.name}</strong>
                    <span>{module.product} / {module.code}</span>
                  </div>
                  <div>
                    <span>{module.monthlyPrice ? `${tenant.currency} ${module.monthlyPrice.toLocaleString()} monthly` : "Package pricing"}</span>
                    <small>{module.description}</small>
                  </div>
                  <div className="module-schedule-fields">
                    <label className="field">
                      <span>Billing</span>
                      <select value={form.billingCycle} onChange={(event) => setModuleForms((current) => ({ ...current, [module.code]: { ...form, billingCycle: event.target.value } }))}>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </label>
                    <Field label="Start" type="date" value={form.startsAt} onChange={(value) => setModuleForms((current) => ({ ...current, [module.code]: { ...form, startsAt: value } }))} />
                    <Field label="Expiry" type="date" value={form.expiresAt} onChange={(value) => setModuleForms((current) => ({ ...current, [module.code]: { ...form, expiresAt: value } }))} />
                    <TextAreaField label="Tenant note" value={form.tenantNote} onChange={(value) => setModuleForms((current) => ({ ...current, [module.code]: { ...form, tenantNote: value } }))} />
                    <TextAreaField label="Internal note" value={form.internalNote} onChange={(value) => setModuleForms((current) => ({ ...current, [module.code]: { ...form, internalNote: value } }))} />
                  </div>
                  <div className="action-row wrap module-action-row">
                    <StatusBadge status={enabled ? "active" : "inactive"} />
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        onTenantModule(tenant.slug, module.code, {
                          enabled: true,
                          billingCycle: form.billingCycle,
                          startsAt: form.startsAt,
                          expiresAt: form.expiresAt,
                          tenantNote: form.tenantNote,
                          internalNote: form.internalNote
                        })
                      }
                    >
                      {enabled ? "Update Schedule" : "Enable / Schedule"}
                    </button>
                    {enabled ? (
                      <button className="secondary-button danger" type="button" onClick={() => onTenantModule(tenant.slug, module.code, { ...form, enabled: false })}>
                        Disable Now
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <form
          className="modal-section suspension-panel"
          onSubmit={(event) => {
            event.preventDefault();
            onScheduleSuspension(tenant.slug, {
              effectiveAt: suspensionForm.effectiveAt,
              reason: suspensionForm.reason
            });
          }}
        >
          <SectionHeader icon={<ShieldCheck size={20} />} title="Suspension Management" />
          {suspensionDisabled ? (
            <NoticeBanner notice={{ kind: "info", text: "Suspension is disabled for this tenant. Change the policy before suspending access." }} />
          ) : scheduleSuspensionDisabled ? (
            <NoticeBanner notice={{ kind: "info", text: "Scheduled billing suspension is blocked for this tenant because it is internal or manual-only." }} />
          ) : null}
          {tenant.suspensionEffectiveAt ? (
            <NoticeBanner
              notice={{
                kind: "info",
                text: `Suspension is scheduled for ${formatDate(tenant.suspensionEffectiveAt)}. Reason: ${tenant.suspensionReason ?? "Not provided"}`
              }}
            />
          ) : null}
          <Field label="Effective date" type="date" value={suspensionForm.effectiveAt} onChange={(value) => setSuspensionForm((current) => ({ ...current, effectiveAt: value }))} />
          <TextAreaField label="Suspension reason visible to tenant" value={suspensionForm.reason} onChange={(value) => setSuspensionForm((current) => ({ ...current, reason: value }))} />
          <div className="action-row wrap">
            <button className="primary-button danger-action" type="submit" disabled={scheduleSuspensionDisabled}>
              {tenant.suspensionEffectiveAt ? "Extend / Update Suspension" : "Schedule Suspension"}
            </button>
            <button
              className="secondary-button danger"
              type="button"
              disabled={suspensionDisabled}
              onClick={() => onImmediateSuspension(tenant.slug, suspensionForm.reason)}
            >
              Suspend Immediately
            </button>
            {tenant.suspensionEffectiveAt ? (
              <button className="secondary-button" type="button" onClick={() => onClearSuspension(tenant.slug)}>
                Payment Received / Clear
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
