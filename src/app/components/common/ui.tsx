import { CheckCircle2, CirclePause, Globe2, Mail, ShieldCheck, Store, Users } from "lucide-react";
import type { EnabledModule, TenantWebsiteSettings } from "@veltrixio/shared-types";
import type { Dispatch, FormEvent, JSX, KeyboardEvent as ReactKeyboardEvent, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { appConfig } from "../../../config";
import type { ConfirmDialogState, Notice, PlatformUser, TenantSession, TenantUser } from "../../types";
import { renderIcon } from "../../app-helpers";

export function ConfirmDialog({
  dialog,
  onCancel,
  onConfirm
}: {
  dialog: ConfirmDialogState;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" aria-label="Cancel confirmation" onClick={onCancel} />
      <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className={dialog.tone === "danger" ? "confirm-icon danger" : "confirm-icon"}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 id="confirm-title">{dialog.title}</h2>
          <p>{dialog.message}</p>
        </div>
        <div className="confirm-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className={dialog.tone === "danger" ? "primary-button danger-action" : "primary-button"} type="button" onClick={onConfirm}>
            {dialog.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function DetailItem({ label, value, wide = false }: { label: string; value: string | number; wide?: boolean }) {
  return (
    <div className={wide ? "detail-item wide" : "detail-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-pill ${status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{status}</span>;
}

export function WebsiteSettingsPanel({
  settings,
  loading,
  canManage,
  moduleEnabled,
  tenantHost,
  onSettings,
  onBusinessSubmit,
  onSubmit
}: {
  settings: TenantWebsiteSettings;
  loading: boolean;
  canManage: boolean;
  moduleEnabled: boolean;
  tenantHost: string;
  onSettings: Dispatch<SetStateAction<TenantWebsiteSettings>>;
  onBusinessSubmit: (event: FormEvent) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  if (!moduleEnabled) {
    return (
      <section className="stack">
        <BusinessProfileForm settings={settings} loading={loading} canManage={canManage} onSettings={onSettings} onSubmit={onBusinessSubmit} />
        <section className="panel website-disabled-panel">
          <SectionHeader icon={<Globe2 size={20} />} title="Website Module" />
          <span className="service-icon">
            <Globe2 size={24} />
          </span>
          <h2>Public website is not enabled</h2>
          <p>
            Enable the Website module to publish the business website at this tenant subdomain. After enabling, the owner can add logo, about content, contact details, WhatsApp, YouTube, colors, and public module sections.
          </p>
          <div className="service-grid">
            <article className="service-card">
              <strong>Business website</strong>
              <span>Public profile for customer visitors.</span>
            </article>
            <article className="service-card">
              <strong>Future ecommerce display</strong>
              <span>Show selected inventory products online.</span>
            </article>
            <article className="service-card">
              <strong>Future scoreboard display</strong>
              <span>Publish match scores for sports events.</span>
            </article>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="website-builder-grid">
      <div className="stack">
      <BusinessProfileForm settings={settings} loading={loading} canManage={canManage} onSettings={onSettings} onSubmit={onBusinessSubmit} />
      <form className="panel form-grid" onSubmit={onSubmit}>
        <SectionHeader icon={<Globe2 size={20} />} title="Website Builder" />
        {!canManage ? <NoticeBanner notice={{ kind: "error", text: "Your role cannot update website settings." }} /> : null}
        <Field label="Logo URL" value={settings.logoUrl} onChange={(value) => onSettings((current) => ({ ...current, logoUrl: value }))} placeholder="https://example.com/logo.png" />
        <Field label="Tagline" value={settings.tagline} onChange={(value) => onSettings((current) => ({ ...current, tagline: value }))} />
        <Field label="Hero background image URL optional" value={settings.heroBackgroundImageUrl} onChange={(value) => onSettings((current) => ({ ...current, heroBackgroundImageUrl: value }))} placeholder="https://example.com/hero.jpg" />
        <TextAreaField label="About content" value={settings.about} onChange={(value) => onSettings((current) => ({ ...current, about: value }))} />
        <Field label="WhatsApp number or link" value={settings.whatsapp} onChange={(value) => onSettings((current) => ({ ...current, whatsapp: value }))} placeholder="+94770000000 or https://wa.me/..." required />
        <TextAreaField label="Address" value={settings.address} onChange={(value) => onSettings((current) => ({ ...current, address: value }))} />
        <SocialLinksEditor settings={settings} onSettings={onSettings} />
        <Field label="Footer background image URL optional" value={settings.footerBackgroundImageUrl} onChange={(value) => onSettings((current) => ({ ...current, footerBackgroundImageUrl: value }))} />
        <div className="two-col">
          <Field label="Hero button label optional" value={settings.heroButtonLabel} onChange={(value) => onSettings((current) => ({ ...current, heroButtonLabel: value }))} placeholder="Shop Now" />
          <Field label="Hero button link optional" value={settings.heroButtonUrl} onChange={(value) => onSettings((current) => ({ ...current, heroButtonUrl: value }))} placeholder="/products or https://facebook.com/page" />
        </div>
        <Field label="Primary color" type="color" value={settings.primaryColor} onChange={(value) => onSettings((current) => ({ ...current, primaryColor: value }))} />
        <Field label="Icon color" type="color" value={settings.iconColor} onChange={(value) => onSettings((current) => ({ ...current, iconColor: value }))} />
        <ToggleField label="Show enabled modules on public website" checked={settings.showModules} onChange={(value) => onSettings((current) => ({ ...current, showModules: value }))} />
        <ToggleField label="Show social media icons in hero section" checked={settings.showHeroSocialLinks} onChange={(value) => onSettings((current) => ({ ...current, showHeroSocialLinks: value }))} />
        <div className="divider" />
        <Field label="SEO title" value={settings.seoTitle} onChange={(value) => onSettings((current) => ({ ...current, seoTitle: value }))} placeholder={settings.businessName} />
        <KeywordInput label="SEO keywords" value={settings.seoKeywords} onChange={(value) => onSettings((current) => ({ ...current, seoKeywords: value }))} limit={12} />
        <button className="primary-button" type="submit" disabled={loading || !canManage}>
          Save Website
        </button>
      </form>
      </div>

      <div className="panel website-preview-panel">
        <SectionHeader icon={<Store size={20} />} title="Public Website Preview" action={<a className="secondary-button" href={`http://${tenantHost}`} target="_blank" rel="noreferrer">Open Site</a>} />
        <div className="website-preview-card" style={{ borderColor: settings.primaryColor }}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt={settings.businessName} /> : <span className="brand-mark">{settings.businessName.slice(0, 1).toUpperCase()}</span>}
          <strong>{settings.businessName || "Business name"}</strong>
          <p>{settings.tagline || "Business tagline will appear here."}</p>
          <small>{settings.about || "About content, address, contact details, WhatsApp, and YouTube links will appear on the public website."}</small>
        </div>
      </div>
    </section>
  );
}

function BusinessProfileForm({
  settings,
  loading,
  canManage,
  onSettings,
  onSubmit
}: {
  settings: TenantWebsiteSettings;
  loading: boolean;
  canManage: boolean;
  onSettings: Dispatch<SetStateAction<TenantWebsiteSettings>>;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="panel form-grid" onSubmit={onSubmit}>
      <SectionHeader icon={<Store size={20} />} title="Business Information" />
      {!canManage ? <NoticeBanner notice={{ kind: "error", text: "Your role cannot update business information." }} /> : null}
      <Field label="Business name" value={settings.businessName} onChange={(value) => onSettings((current) => ({ ...current, businessName: value }))} />
      <Field label="Business phone number" value={settings.phone} onChange={(value) => onSettings((current) => ({ ...current, phone: value }))} />
      <div className="host-lock">
        <span>Login email</span>
        <strong>Managed from user accounts and cannot be changed here</strong>
      </div>
      <button className="primary-button" type="submit" disabled={loading || !canManage}>
        Save Business Info
      </button>
    </form>
  );
}

export function UserList({ users, currentUserId, onStatus }: { users: PlatformUser[]; currentUserId: string | null; onStatus: (id: string, status: string) => void }) {
  return (
    <div className="panel table-panel">
      <SectionHeader icon={<Users size={20} />} title="Platform Users" />
      <div className="admin-card-list">
        {users.length ? (
          users.map((user) => {
            const isCurrentUser = user.id === currentUserId;

            return (
            <article className="admin-list-card user-card" key={user.id}>
              <div className="admin-card-main">
                <div className="entity-avatar user">
                  <Users size={18} />
                </div>
                <div className="entity-copy">
                  <strong>{user.name}</strong>
                  <span><Mail size={14} />{user.email}</span>
                </div>
              </div>

              <div className="admin-card-meta">
                <Badge>{user.role.replace(/_/g, " ")}</Badge>
                <span>{user.permissions.length} permissions</span>
              </div>

              <p className="admin-card-note">{user.permissions.join(", ") || "No explicit permissions"}</p>

              <div className="admin-card-actions">
                <StatusBadge status={user.status} />
                {isCurrentUser ? (
                  <Badge>Current user</Badge>
                ) : (
                  <button
                    className={user.status === "suspended" ? "secondary-button" : "secondary-button danger"}
                    type="button"
                    onClick={() => onStatus(user.id, user.status === "suspended" ? "active" : "suspended")}
                  >
                    {user.status === "suspended" ? <CheckCircle2 size={15} /> : <CirclePause size={15} />}
                    {user.status === "suspended" ? "Reactivate" : "Suspend"}
                  </button>
                )}
            </div>
          </article>
            );
          })
        ) : (
          <EmptyState text="No platform users found." />
        )}
      </div>
    </div>
  );
}

export function TenantUserList({ users, currentUserId, onStatus }: { users: TenantUser[]; currentUserId?: string; onStatus: (id: string, status: string) => void }) {
  return (
    <div className="panel table-panel">
      <SectionHeader icon={<Users size={20} />} title="Tenant Users" />
      <div className="admin-card-list">
        {users.map((user) => (
          <article className="admin-list-card user-card" key={user.id}>
            <div className="admin-card-main">
              <div className="entity-avatar user">
                <Users size={18} />
              </div>
              <div className="entity-copy">
                <strong>{user.name}</strong>
                <span><Mail size={14} />{user.email}</span>
              </div>
            </div>

            <div className="admin-card-meta">
              <Badge>{user.role.name}</Badge>
              <span>{user.branch?.name ?? "No branch assigned"}</span>
            </div>

            <p className="admin-card-note">
              {user.status === "suspended" ? "Login is disabled for this tenant workspace." : "Can sign in to this tenant workspace."}
            </p>

            <div className="admin-card-actions">
              <StatusBadge status={user.status} />
              {user.id === currentUserId ? (
                <Badge>Current user</Badge>
              ) : (
                <button
                  className={user.status === "suspended" ? "secondary-button" : "secondary-button danger"}
                  type="button"
                  onClick={() => onStatus(user.id, user.status === "suspended" ? "active" : "suspended")}
                >
                  {user.status === "suspended" ? <CheckCircle2 size={15} /> : <CirclePause size={15} />}
                  {user.status === "suspended" ? "Enable login" : "Disable login"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Dashboard({
  modules,
  tenantHost,
  onWebsiteTab,
  showWebsiteUpsell = false
}: {
  modules: EnabledModule[];
  tenantHost?: string;
  onWebsiteTab?: () => void;
  showWebsiteUpsell?: boolean;
}) {
  return (
    <div className="service-grid">
      {modules.length ? (
        modules.map((module) => (
          <article className="service-card" key={module.code}>
            <span className="service-icon">{renderIcon(module, 24)}</span>
            <strong>{module.name}</strong>
            <span>{module.description}</span>
            {module.code === "website" ? (
              <div className="service-card-actions">
                {tenantHost ? (
                  <a className="secondary-button" href={`http://${tenantHost}`} target="_blank" rel="noreferrer">
                    View Website
                  </a>
                ) : null}
                {onWebsiteTab ? (
                  <button className="secondary-button" type="button" onClick={onWebsiteTab}>
                    Manage Website
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))
      ) : (
        <EmptyState text="No modules enabled for this tenant." />
      )}
      {showWebsiteUpsell ? (
        <article className="service-card upgrade-card">
          <span className="service-icon">
            <Globe2 size={24} />
          </span>
          <strong>Business Website</strong>
          <span>Enable Website Suite to publish the customer website at this tenant subdomain.</span>
          {onWebsiteTab ? (
            <button className="secondary-button" type="button" onClick={onWebsiteTab}>
              View Website Module
            </button>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}

export function AuthScreen({
  icon,
  title,
  subtitle,
  email,
  password,
  loading,
  notice,
  extra,
  onEmail,
  onPassword,
  onSubmit
}: {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  email: string;
  password: string;
  loading: boolean;
  notice: Notice | null;
  extra?: JSX.Element;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="auth-wrap">
      <form className="login-panel" onSubmit={onSubmit}>
        <span className="service-icon">{icon}</span>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {extra}
        <Field label="Email" type="email" value={email} onChange={onEmail} />
        <Field label="Password" type="password" value={password} onChange={onPassword} />
        {notice ? <NoticeBanner notice={notice} /> : null}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: JSX.Element }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function Tabs({ items, active, onChange }: { items: Array<[string, string]>; active: string; onChange: (value: string) => void }) {
  return (
    <div className="tabs">
      {items.map(([value, label]) => (
        <button className={active === value ? "tab active" : "tab"} key={value} onClick={() => onChange(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helper,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} required={required} />
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

export function KeywordInput({ label, value, onChange, limit }: { label: string; value: string; onChange: (value: string) => void; limit: number }) {
  const [draft, setDraft] = useState("");
  const keywords = keywordList(value);

  function commitKeyword(rawValue = draft) {
    const nextKeyword = rawValue.trim().replace(/,+/g, "");
    if (!nextKeyword || keywords.length >= limit || keywords.includes(nextKeyword.toLowerCase())) {
      setDraft("");
      return;
    }

    onChange([...keywords, nextKeyword.toLowerCase()].join(", "));
    setDraft("");
  }

  function removeKeyword(keyword: string) {
    onChange(keywords.filter((item) => item !== keyword).join(", "));
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitKeyword();
    }
  }

  return (
    <label className="field keyword-field">
      <span>{label}</span>
      <div className="keyword-input-wrap">
        <div className="keyword-chip-list">
          {keywords.map((keyword) => (
            <button className="keyword-chip" type="button" key={keyword} onClick={() => removeKeyword(keyword)}>
              {keyword}
              <span>×</span>
            </button>
          ))}
        </div>
        <input value={draft} placeholder={keywords.length >= limit ? "Keyword limit reached" : "Type keyword and press Enter"} onBlur={() => commitKeyword()} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} disabled={keywords.length >= limit} />
      </div>
      <small>{keywords.length}/{limit} keywords. Click a keyword to remove it.</small>
    </label>
  );
}

type SocialKey = "youtubeUrl" | "facebookUrl" | "instagramUrl" | "linkedinUrl" | "tiktokUrl";

const socialOptions: Array<{ key: SocialKey; label: string }> = [
  { key: "youtubeUrl", label: "YouTube" },
  { key: "facebookUrl", label: "Facebook" },
  { key: "instagramUrl", label: "Instagram" },
  { key: "linkedinUrl", label: "LinkedIn" },
  { key: "tiktokUrl", label: "TikTok" }
];

function SocialLinksEditor({ settings, onSettings }: { settings: TenantWebsiteSettings; onSettings: Dispatch<SetStateAction<TenantWebsiteSettings>> }) {
  const availableOptions = socialOptions.filter((option) => !settings[option.key]);
  const [selectedKey, setSelectedKey] = useState<SocialKey>(availableOptions[0]?.key ?? "youtubeUrl");
  const [url, setUrl] = useState("");
  const selectedLinks = socialOptions.filter((option) => settings[option.key]);

  function addSocialLink() {
    const nextUrl = url.trim();
    if (!nextUrl) {
      return;
    }

    onSettings((current) => ({ ...current, [selectedKey]: nextUrl }));
    setUrl("");
    const nextOption = socialOptions.find((option) => option.key !== selectedKey && !settings[option.key]);
    if (nextOption) {
      setSelectedKey(nextOption.key);
    }
  }

  function removeSocialLink(key: SocialKey) {
    onSettings((current) => ({ ...current, [key]: "" }));
  }

  return (
    <div className="social-editor">
      <div>
        <strong>Optional social media links</strong>
        <p>Select a social platform, paste the public profile URL, and add only what this business uses.</p>
      </div>
      <div className="social-add-row">
        <label className="field">
          <span>Social media</span>
          <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value as SocialKey)} disabled={!availableOptions.length}>
            {(availableOptions.length ? availableOptions : socialOptions).map((option) => (
              <option value={option.key} key={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Profile URL" value={url} onChange={setUrl} placeholder="https://..." />
        <button className="secondary-button" type="button" onClick={addSocialLink} disabled={!availableOptions.length || !url.trim()}>
          Add Social
        </button>
      </div>
      <div className="social-link-list">
        {selectedLinks.length ? selectedLinks.map((option) => (
          <article className="social-link-row" key={option.key}>
            <div>
              <strong>{option.label}</strong>
              <span>{settings[option.key]}</span>
            </div>
            <button className="secondary-button danger" type="button" onClick={() => removeSocialLink(option.key)}>
              Remove
            </button>
          </article>
        )) : <EmptyState text="No optional social media links added yet." />}
      </div>
    </div>
  );
}

function keywordList(value: string) {
  return value
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function CheckList({ title, items, selected, onToggle }: { title: string; items: Array<{ code: string; label: string }>; selected: string[]; onToggle: (code: string) => void }) {
  return (
    <div className="check-panel">
      <strong>{title}</strong>
      {items.map((item) => (
        <label className="checkbox-row" key={item.code}>
          <input type="checkbox" checked={selected.includes(item.code)} onChange={() => onToggle(item.code)} />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  );
}

export function Metric({ icon, label, value }: { icon: JSX.Element; label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span className="service-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

export function SectionHeader({ icon, title, action }: { icon: JSX.Element; title: string; action?: JSX.Element }) {
  return (
    <div className="section-header">
      <div>
        <span className="mini-icon">{icon}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function HelpPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <aside className="panel help-panel">
      <SectionHeader icon={<ShieldCheck size={20} />} title={title} />
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}

export function NoticeBanner({ notice }: { notice: Notice }) {
  return <div className={`notice ${notice.kind}`}>{notice.text}</div>;
}

export function NoticeToast({ notice }: { notice: Notice }) {
  return (
    <div className="toast-layer" role="status" aria-live="polite">
      <div className={`notice toast ${notice.kind}`}>{notice.text}</div>
    </div>
  );
}

export function InlineStatus({ text }: { text: string }) {
  return <div className="inline-status">{text}</div>;
}

export function Badge({ children }: { children: string }) {
  return <span className="badge">{children}</span>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

export function Brand() {
  return (
    <div className="brand">
      {appConfig.logoUrl ? (
        <img className="brand-logo" src={appConfig.logoUrl} alt={appConfig.brandName} />
      ) : (
        <span className="brand-mark">V</span>
      )}
      <div>
        <strong>{appConfig.brandName}</strong>
        <span>Cloud Platform</span>
      </div>
    </div>
  );
}
