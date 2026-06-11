import { ChevronDown, ChevronUp, LogOut, Package, RefreshCw, ShieldCheck, Store, Users } from "lucide-react";
import type { TenantDashboardResponse, TenantWebsiteBuilder, TenantWebsiteSettings, WebsiteManualProduct, WebsiteMenu, WebsiteSection, WebsiteSectionType } from "@veltrixio/shared-types";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { apiEndpoints, appConfig, isLocalHost } from "../../config";
import { DashboardShell } from "../../app/components/layout";
import { AuthScreen, ConfirmDialog, Dashboard, EmptyState, Field, InlineStatus, Metric, NoticeBanner, NoticeToast, PageHeader, SectionHeader, SelectField, Tabs, TenantUserList, TextAreaField, ToggleField, WebsiteSettingsPanel } from "../../app/components/ui";
import { api, defaultWebsiteSettings, errorMessage, formatDate, hasModule, isUnauthorized, shouldShowSuspensionNotice, tenantApi, tenantSessionKey } from "../../app/app-helpers";
import type { ConfirmDialogState, Notice, TenantProfile, TenantRole, TenantSession, TenantTab, TenantUser } from "../../app/types";

const NOTICE_AUTO_DISMISS_MS = 6000;

function useAutoDismissNotice(notice: Notice | null, setNotice: Dispatch<SetStateAction<Notice | null>>) {
  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), NOTICE_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);
}

export function TenantWorkspace() {
  const [tab, setTab] = useState<TenantTab>("dashboard");
  const canEditTenantHost = isLocalHost();
  const resolvedTenantHost = canEditTenantHost ? localStorage.getItem("tenantHost") ?? appConfig.defaultTenantHost : window.location.hostname;
  const [host, setHost] = useState(resolvedTenantHost);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<TenantSession | null>(() => {
    const raw = localStorage.getItem(tenantSessionKey(resolvedTenantHost));
    return raw ? (JSON.parse(raw) as TenantSession) : null;
  });
  const [dashboard, setDashboard] = useState<TenantDashboardResponse | null>(null);
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [websiteSettings, setWebsiteSettings] = useState<TenantWebsiteSettings>(() => defaultWebsiteSettings(appConfig.defaultTenantSlug));
  const [websiteBuilder, setWebsiteBuilder] = useState<TenantWebsiteBuilder>(() => defaultWebsiteBuilder());
  const [tenantProfileChecked, setTenantProfileChecked] = useState(false);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", roleCode: "manager", password: "" });

  useAutoDismissNotice(notice, setNotice);

  useEffect(() => {
    void loadTenantProfile(host);
  }, [host]);

  useEffect(() => {
    if (session) {
      void loadTenantData(session);
    }
  }, [session]);

  async function loadTenantProfile(nextHost: string) {
    setTenantProfileChecked(false);
    setTenantProfile(null);

    try {
      const profile = await api<TenantProfile>(apiEndpoints.tenantProfile, {
        tenantHost: nextHost
      });
      setTenantProfile(profile);
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, `Tenant workspace was not found for ${nextHost}.`) });
      setTenantProfile(null);
    } finally {
      setTenantProfileChecked(true);
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const result = await api<{
        user: TenantSession["user"];
        tokens: { accessToken: string };
      }>(apiEndpoints.tenantLogin, {
        method: "POST",
        tenantHost: host,
        body: { email, password }
      });
      const nextSession = { token: result.tokens.accessToken, host, user: result.user };
      if (canEditTenantHost) {
        localStorage.setItem("tenantHost", host);
      }
      localStorage.setItem(tenantSessionKey(host), JSON.stringify(nextSession));
      setSession(nextSession);
      setEmail("");
      setPassword("");
      setNotice({ kind: "success", text: `Signed in as ${result.user.role.name}.` });
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Invalid tenant credentials.") });
    } finally {
      setLoading(false);
    }
  }

  async function loadTenantData(activeSession = session) {
    if (!activeSession) {
      return;
    }

    setLoading(true);
    try {
      const [dashboardResult, rolesResult, usersResult] = await Promise.all([
        tenantApi<TenantDashboardResponse>(activeSession, apiEndpoints.tenantDashboard),
        tenantApi<{ roles: TenantRole[] }>(activeSession, apiEndpoints.tenantRoles),
        tenantApi<TenantUser[]>(activeSession, apiEndpoints.tenantUsers)
      ]);
      setDashboard(dashboardResult);
      setRoles(rolesResult.roles);
      setUsers(usersResult);
      if (activeSession.user.role.permissions.includes("settings.manage")) {
        const settingsResult = await tenantApi<TenantWebsiteSettings>(activeSession, apiEndpoints.tenantWebsiteSettings);
        setWebsiteSettings(settingsResult);
        if (hasModule(dashboardResult.modules, "website")) {
          const builderResult = await tenantApi<TenantWebsiteBuilder>(activeSession, apiEndpoints.tenantWebsiteBuilder);
          setWebsiteBuilder(builderResult);
        }
      }
    } catch (error) {
      if (isUnauthorized(error)) {
        logoutTenant();
      }
      setNotice({ kind: "error", text: errorMessage(error, "Unable to load tenant workspace.") });
    } finally {
      setLoading(false);
    }
  }

  async function createTenantUser(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const result = await tenantApi<TenantUser>(session, apiEndpoints.tenantUsers, {
        method: "POST",
        body: userForm
      });
      setNotice({ kind: "success", text: `Created tenant user ${result.email}.` });
      setUserForm({ name: "", email: "", roleCode: "manager", password: "" });
      await loadTenantData(session);
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Tenant user creation failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function saveWebsiteSettings(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const result = await tenantApi<TenantWebsiteSettings>(session, apiEndpoints.tenantWebsiteSettings, {
        method: "PUT",
        body: websiteSettings
      });
      setWebsiteSettings(result);
      setNotice({ kind: "success", text: "Website settings saved." });
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Website settings save failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function saveWebsiteBuilder(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const result = await tenantApi<TenantWebsiteBuilder>(session, apiEndpoints.tenantWebsiteBuilder, {
        method: "PUT",
        body: websiteBuilder
      });
      setWebsiteBuilder(result);
      setNotice({ kind: "success", text: "Website menus, sections, and products saved." });
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Website builder save failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function saveBusinessProfile(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const result = await tenantApi<{ tenant: TenantDashboardResponse["tenant"]; websiteSettings: TenantWebsiteSettings }>(session, apiEndpoints.tenantBusinessProfile, {
        method: "PUT",
        body: {
          businessName: websiteSettings.businessName,
          phone: websiteSettings.phone
        }
      });
      setWebsiteSettings(result.websiteSettings);
      setDashboard((current) => (current ? { ...current, tenant: result.tenant } : current));
      setNotice({ kind: "success", text: "Business information saved." });
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Business information save failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function updateTenantUserStatus(id: string, status: string) {
    if (!session) {
      return;
    }

    setConfirmDialog({
      title: status === "suspended" ? "Disable Tenant User Login" : "Enable Tenant User Login",
      message:
        status === "suspended"
          ? "This will block this user from signing in or accessing this tenant workspace."
          : "This will restore access for this tenant user.",
      confirmLabel: status === "suspended" ? "Disable Login" : "Enable Login",
      tone: status === "suspended" ? "danger" : "default",
      onConfirm: () => void performTenantUserStatusUpdate(id, status)
    });
  }

  async function performTenantUserStatusUpdate(id: string, status: string) {
    if (!session) {
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      await tenantApi<TenantUser>(session, `${apiEndpoints.tenantUsers}/${id}/status`, {
        method: "PUT",
        body: { status }
      });
      setNotice({ kind: "success", text: `Tenant user login ${status === "suspended" ? "disabled" : "enabled"}.` });
      await loadTenantData(session);
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Tenant user status update failed.") });
    } finally {
      setLoading(false);
    }
  }

  function logoutTenant() {
    if (session) {
      localStorage.removeItem(tenantSessionKey(session.host));
    }
    localStorage.removeItem("tenantSession");
    setSession(null);
    setDashboard(null);
    setWebsiteSettings(defaultWebsiteSettings(appConfig.defaultTenantSlug));
    setWebsiteBuilder(defaultWebsiteBuilder());
    setRoles([]);
    setUsers([]);
  }

  if (!session) {
    if (!tenantProfileChecked) {
      return <InlineStatus text={`Checking tenant workspace for ${host}...`} />;
    }

    if (!tenantProfile && !canEditTenantHost) {
      return (
        <div className="auth-wrap">
          <div className="login-panel">
            <span className="service-icon">
              <Store size={24} />
            </span>
            <div>
              <h1>Workspace Not Found</h1>
              <p>No active tenant workspace is configured for {host}.</p>
            </div>
            <NoticeBanner notice={{ kind: "error", text: `Ask ${appConfig.brandName} support to confirm this tenant subdomain.` }} />
          </div>
        </div>
      );
    }

    return (
      <AuthScreen
        icon={<Store size={24} />}
        title={tenantProfile?.loginTitle ?? "Tenant Workspace"}
        subtitle={tenantProfile?.loginSubtitle ?? "Sign in with the owner or manager credentials created for the customer."}
        email={email}
        password={password}
        loading={loading}
        notice={notice}
        onEmail={setEmail}
        onPassword={setPassword}
        onSubmit={login}
        extra={
          canEditTenantHost ? (
          <Field
            label="Tenant host"
            value={host}
            onChange={(value) => {
              setHost(value);
              setNotice(null);
            }}
            placeholder={appConfig.defaultTenantHost}
            helper="For local frontend testing this is sent as X-Tenant-Host."
          />
          ) : (
            <div className="host-lock">
              <span>Tenant</span>
              <strong>{host}</strong>
            </div>
          )
        }
      />
    );
  }

  const canManageUsers = session.user.role.permissions.includes("users.manage");
  const canManageSettings = session.user.role.permissions.includes("settings.manage");
  const websiteModuleEnabled = hasModule(dashboard?.modules ?? [], "website");
  const tenantActions = (
    <div className="action-row">
      <button className="icon-button" onClick={() => loadTenantData()} title="Refresh">
        <RefreshCw size={18} />
      </button>
      <button className="icon-button" onClick={logoutTenant} title="Sign out">
        <LogOut size={18} />
      </button>
    </div>
  );

  return (
    <DashboardShell
      view="tenant-manage"
      platformTab="overview"
      tenantTab={tab}
      onPlatformTab={() => undefined}
      onTenantTab={setTab}
      mobileActions={tenantActions}
    >
      <div>
      <PageHeader
        eyebrow={session.host}
        title={dashboard?.tenant.name ?? "Tenant Workspace"}
        action={tenantActions}
      />
      <Tabs
        items={[
          ["dashboard", "Dashboard"],
          ["website", "Website"],
          ["users", "Users"],
          ["modules", "Modules"]
        ]}
        active={tab}
        onChange={(value) => setTab(value as TenantTab)}
      />
      {notice ? <NoticeToast notice={notice} /> : null}
      {loading ? <InlineStatus text="Loading tenant data..." /> : null}
      {tab === "dashboard" ? <TenantDashboard dashboard={dashboard} session={session} onWebsiteTab={() => setTab("website")} /> : null}
      {tab === "website" ? (
        <section className="stack">
          <WebsiteSettingsPanel
            settings={websiteSettings}
            loading={loading}
            canManage={canManageSettings}
            moduleEnabled={websiteModuleEnabled}
            tenantHost={session.host}
            onSettings={setWebsiteSettings}
            onBusinessSubmit={saveBusinessProfile}
            onSubmit={saveWebsiteSettings}
          />
          {websiteModuleEnabled ? (
            <WebsiteBuilderPanel builder={websiteBuilder} settings={websiteSettings} loading={loading} canManage={canManageSettings} onBuilder={setWebsiteBuilder} onSubmit={saveWebsiteBuilder} />
          ) : null}
        </section>
      ) : null}
      {tab === "users" ? (
        <section className="split-grid">
          <form className="panel form-grid" onSubmit={createTenantUser}>
            <SectionHeader icon={<Users size={20} />} title="Create Tenant User" />
            {!canManageUsers ? <NoticeBanner notice={{ kind: "error", text: "Your role cannot create tenant users." }} /> : null}
            <Field label="Name" value={userForm.name} onChange={(value) => setUserForm({ ...userForm, name: value })} />
            <Field label="Email" type="email" value={userForm.email} onChange={(value) => setUserForm({ ...userForm, email: value })} />
            <label className="field">
              <span>Role</span>
              <select value={userForm.roleCode} onChange={(event) => setUserForm({ ...userForm, roleCode: event.target.value })}>
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Temporary password" type="password" value={userForm.password} onChange={(value) => setUserForm({ ...userForm, password: value })} />
            <button className="primary-button" type="submit" disabled={loading || !canManageUsers}>
              Create User
            </button>
          </form>
          <TenantUserList users={users} currentUserId={session.user.id} onStatus={updateTenantUserStatus} />
        </section>
      ) : null}
      {tab === "modules" ? <Dashboard modules={dashboard?.modules ?? []} tenantHost={session.host} onWebsiteTab={() => setTab("website")} showWebsiteUpsell={!websiteModuleEnabled} /> : null}
      {confirmDialog ? <ConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} onConfirm={() => {
        const action = confirmDialog.onConfirm;
        setConfirmDialog(null);
        action();
      }} /> : null}
      </div>
    </DashboardShell>
  );
}

function TenantDashboard({ dashboard, session, onWebsiteTab }: { dashboard: TenantDashboardResponse | null; session: TenantSession; onWebsiteTab: () => void }) {
  const moduleNotices = dashboard?.modules.filter((module) => shouldShowSuspensionNotice(module.noticeAt, module.expiresAt)) ?? [];

  return (
    <section className="stack">
      {shouldShowSuspensionNotice(dashboard?.tenant.suspensionNoticeAt, dashboard?.tenant.suspensionEffectiveAt) ? (
        <NoticeBanner
          notice={{
            kind: "error",
            text: `Workspace suspension scheduled for ${formatDate(dashboard?.tenant.suspensionEffectiveAt)}. Reason: ${dashboard?.tenant.suspensionReason ?? "Please contact support for details."}`
          }}
        />
      ) : null}
      {moduleNotices.map((module) => (
        <NoticeBanner
          key={module.code}
          notice={{
            kind: "info",
            text: `${module.name} expires on ${formatDate(module.expiresAt)}. ${module.tenantNote ?? "Please contact support to renew or extend this module."}`
          }}
        />
      ))}
      <div className="metric-grid">
        <Metric icon={<Store size={20} />} label="Signed in as" value={session.user.role.name} />
        <Metric icon={<Package size={20} />} label="Enabled modules" value={dashboard?.modules.length ?? 0} />
        <Metric icon={<ShieldCheck size={20} />} label="Permissions" value={session.user.role.permissions.length} />
      </div>
      <Dashboard modules={dashboard?.modules ?? []} tenantHost={session.host} onWebsiteTab={onWebsiteTab} />
    </section>
  );
}

function WebsiteBuilderPanel({
  builder,
  settings,
  loading,
  canManage,
  onBuilder,
  onSubmit
}: {
  builder: TenantWebsiteBuilder;
  settings: TenantWebsiteSettings;
  loading: boolean;
  canManage: boolean;
  onBuilder: Dispatch<SetStateAction<TenantWebsiteBuilder>>;
  onSubmit: (event: FormEvent) => void;
}) {
  const orderedMenus = [...builder.menus].sort((left, right) => left.sortOrder - right.sortOrder);
  const menuOptions = [{ value: "default", label: "Main website page" }, ...orderedMenus.map((menu) => ({ value: menu.id, label: menu.label }))];
  const [editorTab, setEditorTab] = useState<"menus" | "sections" | "products">("sections");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => new Set());
  const [builderNotice, setBuilderNotice] = useState("");
  const visibleSectionsForTab = builder.sections
    .filter((section) => (editorTab === "products" ? section.type === "products" : section.type !== "hero"))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  useEffect(() => {
    if (!builderNotice) {
      return;
    }

    const timer = window.setTimeout(() => setBuilderNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [builderNotice]);

  function updateMenu(id: string, next: Partial<WebsiteMenu>) {
    onBuilder((current) => ({ ...current, menus: current.menus.map((menu) => (menu.id === id ? { ...menu, ...next } : menu)) }));
  }

  function updateSection(id: string, next: Partial<WebsiteSection>) {
    onBuilder((current) => ({ ...current, sections: current.sections.map((section) => (section.id === id ? { ...section, ...next } : section)) }));
  }

  function updateProduct(sectionId: string, productId: string, next: Partial<WebsiteManualProduct>) {
    onBuilder((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              products: section.products.map((product) => (product.id === productId ? { ...product, ...next } : product))
            }
          : section
      )
    }));
  }

  function addMenu() {
    const id = uniqueBuilderId("menu");
    onBuilder((current) => {
      return {
        ...current,
        menus: [...current.menus, { id, label: "New Menu", slug: id, sortOrder: current.menus.length + 1, isActive: true }]
      };
    });
    setExpandedMenus((current) => new Set([...current, id]));
    setEditorTab("menus");
    setBuilderNotice("Navigation menu created. Open the Menus tab below to edit it.");
  }

  function addSection(type: WebsiteSectionType) {
    const id = uniqueBuilderId("section");
    onBuilder((current) => {
      const firstMenu = [...current.menus].sort((left, right) => left.sortOrder - right.sortOrder)[0];
      return {
        ...current,
        sections: [
          ...current.sections,
          {
            id,
            menuId: firstMenu?.id ?? "default",
            type,
            heading: type === "products" ? "Featured Products" : "New Section",
            subheading: "",
            content: "",
            imageUrl: "",
            buttons: [],
            products: [],
            sortOrder: current.sections.length + 1,
            isActive: true
          }
        ]
      };
    });
    setExpandedSections((current) => new Set([...current, id]));
    setEditorTab(type === "products" ? "products" : "sections");
    setBuilderNotice(`${sectionTypeLabel(type)} created and expanded below.`);
  }

  function addTemplate(template: "about" | "catalog" | "contact") {
    if (template === "catalog") {
      addSection("products");
      return;
    }

    if (template === "contact") {
      addSection("contact");
      return;
    }

    addSection("image_text");
  }

  function addButton(sectionId: string) {
    onBuilder((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, buttons: [...section.buttons, { label: "Learn More", url: "#" }] } : section))
    }));
  }

  function addProduct(sectionId: string) {
    onBuilder((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              products: [
                ...section.products,
                {
                  id: uniqueBuilderId("product"),
                  name: "New Product",
                  description: "",
                  priceLabel: "",
                  imageUrl: "",
                  orderButtonLabel: "Order on WhatsApp",
                  whatsappMessage: "",
                  sortOrder: section.products.length + 1,
                  isActive: true
                }
              ]
            }
          : section
      )
    }));
    setBuilderNotice("Product card created inside the selected showcase.");
  }

  function removeMenu(id: string) {
    onBuilder((current) => {
      const fallbackMenuId = current.menus.find((menu) => menu.id !== id)?.id ?? "default";
      return {
        menus: current.menus.filter((menu) => menu.id !== id),
        sections: current.sections.map((section) => (section.menuId === id ? { ...section, menuId: fallbackMenuId } : section))
      };
    });
  }

  function removeSection(id: string) {
    onBuilder((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }));
  }

  function removeButton(sectionId: string, index: number) {
    onBuilder((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, buttons: section.buttons.filter((_, itemIndex) => itemIndex !== index) } : section))
    }));
  }

  function removeProduct(sectionId: string, productId: string) {
    onBuilder((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, products: section.products.filter((product) => product.id !== productId) } : section))
    }));
  }

  const visibleMenuCount = builder.menus.filter((menu) => menu.isActive).length;
  const visibleSectionCount = builder.sections.filter((section) => section.isActive).length;
  const visibleProductCount = builder.sections.flatMap((section) => section.products).filter((product) => product.isActive).length;
  const productSectionCount = builder.sections.filter((section) => section.type === "products").length;

  function menuLabelFor(menuId: string) {
    return menuOptions.find((option) => option.value === menuId)?.label ?? "Main website page";
  }

  return (
    <form className="website-editor" onSubmit={onSubmit}>
      <section className="website-editor-hero panel">
        <div>
          <p className="eyebrow">Website Suite</p>
          <h2>Build the public website</h2>
          <p>Create menus, sections, image banners, buttons, and WhatsApp product cards for {settings.businessName || "this business"}. The first hero screen is managed from Website Settings.</p>
        </div>
        <div className="website-editor-stats">
          <span><strong>{visibleMenuCount}</strong> menus</span>
          <span><strong>{visibleSectionCount}</strong> sections</span>
          <span><strong>{visibleProductCount}</strong> products</span>
        </div>
      </section>

      {!canManage ? <NoticeBanner notice={{ kind: "error", text: "Your role cannot update website content." }} /> : null}
      <NoticeBanner notice={{ kind: "info", text: "Manual product sections can show products, vehicles, offers, or multi-shop items now. Later, inventory-enabled tenants can publish products directly from inventory." }} />

      <section className="website-editor-toolbar panel">
        <SectionHeader icon={<Store size={20} />} title="Website Builder Workflow" />
        {builderNotice ? <NoticeBanner notice={{ kind: "success", text: builderNotice }} /> : null}
        <div className="builder-guide-grid">
          <article className="builder-guide-card">
            <span>1</span>
            <strong>Menus create navigation</strong>
            <p>Create menus like About, Products, Gallery, or Offers. Menus only control the top website links.</p>
          </article>
          <article className="builder-guide-card">
            <span>2</span>
            <strong>Sections create visible content</strong>
            <p>Add one or many sections under any menu. Visitors see the section heading, content, image, and buttons.</p>
          </article>
          <article className="builder-guide-card">
            <span>3</span>
            <strong>Products create order cards</strong>
            <p>Add product showcase sections for products, vehicles, packages, or shop items with WhatsApp order links.</p>
          </article>
        </div>
        <div className="builder-template-grid">
          <article className="builder-template-card">
            <strong>About / Story</strong>
            <p>Best for business story, service explanation, or brand introduction.</p>
            <button className="secondary-button" type="button" onClick={() => addTemplate("about")} disabled={!canManage}>Use Template</button>
          </article>
          <article className="builder-template-card">
            <strong>Catalog / Products</strong>
            <p>Best for products, vehicles, offers, packages, or multi-shop items.</p>
            <button className="secondary-button" type="button" onClick={() => addTemplate("catalog")} disabled={!canManage}>Use Template</button>
          </article>
          <article className="builder-template-card">
            <strong>Inquiry / Contact</strong>
            <p>Best for support, inquiry, showroom details, or booking contact.</p>
            <button className="secondary-button" type="button" onClick={() => addTemplate("contact")} disabled={!canManage}>Use Template</button>
          </article>
        </div>
        <div className="editor-mode-tabs">
          <button className={editorTab === "menus" ? "tab active" : "tab"} type="button" onClick={() => setEditorTab("menus")}>Menus</button>
          <button className={editorTab === "sections" ? "tab active" : "tab"} type="button" onClick={() => setEditorTab("sections")}>Sections</button>
          <button className={editorTab === "products" ? "tab active" : "tab"} type="button" onClick={() => setEditorTab("products")}>Products</button>
        </div>
        <div className="action-row wrap">
          <button className="secondary-button" type="button" onClick={addMenu} disabled={!canManage}>Add Navigation Menu</button>
          <button className="secondary-button" type="button" onClick={() => addSection("text")} disabled={!canManage}>Add Text Section</button>
          <button className="secondary-button" type="button" onClick={() => addSection("image_text")} disabled={!canManage}>Add Image + Text</button>
          <button className="secondary-button" type="button" onClick={() => addSection("products")} disabled={!canManage}>Add Product Showcase</button>
          <button className="secondary-button" type="button" onClick={() => addSection("links")} disabled={!canManage}>Add Buttons / Links</button>
        </div>
      </section>

      <section className={editorTab === "menus" ? "website-editor-grid single" : "website-editor-grid"}>
        <aside className={editorTab === "menus" ? "website-editor-panel panel" : "website-editor-panel panel hidden-panel"}>
          <SectionHeader icon={<Package size={18} />} title="Menus" />
          <div className="builder-menu-list">
            {orderedMenus.length ? orderedMenus.map((menu) => (
              <article className={menu.isActive ? "builder-menu-card" : "builder-menu-card muted"} key={menu.id}>
                <div className="builder-card-top">
                  <div>
                    <strong>{menu.label || "Untitled menu"}</strong>
                    <span>Navigation link: #{menu.slug || "menu"}</span>
                  </div>
                  <div className="action-row wrap">
                    <small className="builder-chip">Order {menu.sortOrder}</small>
                    <button className="secondary-button" type="button" onClick={() => setExpandedMenus((current) => toggleSetValue(current, menu.id))}>
                      {expandedMenus.has(menu.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {expandedMenus.has(menu.id) ? "Collapse" : "Expand"}
                    </button>
                  </div>
                </div>
                <p className="builder-help-text">This menu appears in the public website top navigation. Assign sections to this menu to show content when visitors click it.</p>
                {expandedMenus.has(menu.id) ? (
                  <>
                    <div className="module-schedule-fields">
                      <Field label="Label" value={menu.label} onChange={(value) => updateMenu(menu.id, { label: value, slug: slugifyLocal(value) })} />
                      <Field label="Slug" value={menu.slug} onChange={(value) => updateMenu(menu.id, { slug: slugifyLocal(value) })} />
                      <Field label="Order" type="number" value={String(menu.sortOrder)} onChange={(value) => updateMenu(menu.id, { sortOrder: Number(value) || 1 })} />
                      <ToggleField label="Visible" checked={menu.isActive} onChange={(value) => updateMenu(menu.id, { isActive: value })} />
                    </div>
                    <button className="secondary-button danger" type="button" onClick={() => removeMenu(menu.id)} disabled={!canManage}>Remove Menu</button>
                  </>
                ) : null}
              </article>
            )) : <EmptyState text="No custom menus. Sections assigned to Main website page will show under the default website navigation." />}
            <div className="builder-bottom-actions">
              <button className="secondary-button" type="button" onClick={addMenu} disabled={!canManage}>Add Another Navigation Menu</button>
            </div>
          </div>
        </aside>

        <section className={editorTab === "sections" || editorTab === "products" ? "website-editor-panel panel" : "website-editor-panel panel hidden-panel"}>
          <SectionHeader icon={<Store size={18} />} title={editorTab === "products" ? "Product Showcase Sections" : "Page Sections"} />
          <div className="builder-context-card">
            <strong>{editorTab === "products" ? `${productSectionCount} product showcase section${productSectionCount === 1 ? "" : "s"}` : `${visibleSectionsForTab.length} content section${visibleSectionsForTab.length === 1 ? "" : "s"}`}</strong>
            <p>
              {editorTab === "products"
                ? "A product showcase section can contain many product cards. Create more than one showcase if the business needs separate groups such as Vehicles, Spare Parts, or Offers."
                : "A page can contain multiple sections. The public website renders sections by their order number, using the section heading as the visible title."}
            </p>
          </div>
          <div className="builder-section-list">
            {visibleSectionsForTab.length ? (
              visibleSectionsForTab.map((section) => (
                <article className={section.isActive ? "builder-section-card" : "builder-section-card muted"} key={section.id}>
                  <div className="builder-section-header">
                    <div>
                      <strong>{section.heading || "Untitled section"}</strong>
                      <span>{sectionTypeLabel(section.type)} · {menuLabelFor(section.menuId)} · order {section.sortOrder}</span>
                    </div>
                    <div className="action-row wrap">
                      <button className="secondary-button" type="button" onClick={() => setExpandedSections((current) => toggleSetValue(current, section.id))}>
                        {expandedSections.has(section.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        {expandedSections.has(section.id) ? "Collapse" : "Expand"}
                      </button>
                      <button className="secondary-button danger" type="button" onClick={() => removeSection(section.id)} disabled={!canManage}>Remove</button>
                    </div>
                  </div>
                  <div className="builder-section-summary">
                    <span><strong>Appears under</strong>{menuLabelFor(section.menuId)}</span>
                    <span><strong>Visitors see</strong>{section.heading || "Heading not set"}</span>
                    <span><strong>Image behavior</strong>{sectionImageHelp(section.type)}</span>
                  </div>
                  <p className="builder-help-text">{sectionHelp(section.type)}</p>

                  {expandedSections.has(section.id) ? <div className="module-schedule-fields">
                    <SelectField label="Menu" value={section.menuId} options={menuOptions} onChange={(value) => updateSection(section.id, { menuId: value })} />
                    <SelectField
                      label="Type"
                      value={section.type}
                      options={["text", "image_text", "products", "contact", "gallery", "links", "youtube"].map((type) => ({ value: type, label: type.replace("_", " ") }))}
                      onChange={(value) => updateSection(section.id, { type: value as WebsiteSectionType })}
                    />
                    <Field label="Heading" value={section.heading} onChange={(value) => updateSection(section.id, { heading: value })} />
                    <Field label="Subheading" value={section.subheading} onChange={(value) => updateSection(section.id, { subheading: value })} />
                    <TextAreaField label="Content" value={section.content} onChange={(value) => updateSection(section.id, { content: value })} />
                    <Field label={section.type === "hero" ? "Background image URL optional" : section.type === "image_text" ? "Side image URL optional" : "Image URL optional"} value={section.imageUrl} onChange={(value) => updateSection(section.id, { imageUrl: value })} />
                    <div className="two-col">
                      <Field label="Order" type="number" value={String(section.sortOrder)} onChange={(value) => updateSection(section.id, { sortOrder: Number(value) || 1 })} />
                      <ToggleField label="Visible" checked={section.isActive} onChange={(value) => updateSection(section.id, { isActive: value })} />
                    </div>
                  </div> : null}

                  {expandedSections.has(section.id) ? <div className="builder-subsection">
                    <div className="builder-subsection-head">
                      <strong>Buttons</strong>
                      <button className="secondary-button" type="button" onClick={() => addButton(section.id)} disabled={!canManage}>Add Button</button>
                    </div>
                    {section.buttons.length ? section.buttons.map((button, index) => (
                      <div className="builder-inline-row" key={`${section.id}-button-${index}`}>
                        <Field label="Label" value={button.label} onChange={(value) => updateSection(section.id, { buttons: section.buttons.map((item, itemIndex) => (itemIndex === index ? { ...item, label: value } : item)) })} />
                        <Field label="Link" value={button.url} onChange={(value) => updateSection(section.id, { buttons: section.buttons.map((item, itemIndex) => (itemIndex === index ? { ...item, url: value } : item)) })} />
                        <button className="secondary-button danger" type="button" onClick={() => removeButton(section.id, index)} disabled={!canManage}>Remove</button>
                      </div>
                    )) : <EmptyState text="No buttons added for this section." />}
                  </div> : null}

                  {expandedSections.has(section.id) && section.type === "products" ? (
                    <div className="builder-subsection">
                      <div className="builder-subsection-head">
                        <strong>Manual Products</strong>
                        <button className="secondary-button" type="button" onClick={() => addProduct(section.id)} disabled={!canManage}>Add Product</button>
                      </div>
                      <div className="builder-product-grid">
                        {section.products.length ? section.products.map((product) => (
                          <article className={product.isActive ? "builder-product-card" : "builder-product-card muted"} key={product.id}>
                            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="builder-product-placeholder">Image URL optional</div>}
                            <Field label="Product name" value={product.name} onChange={(value) => updateProduct(section.id, product.id, { name: value })} />
                            <Field label="Price label" value={product.priceLabel} onChange={(value) => updateProduct(section.id, product.id, { priceLabel: value })} placeholder="LKR 2,500" />
                            <Field label="Image URL optional" value={product.imageUrl} onChange={(value) => updateProduct(section.id, product.id, { imageUrl: value })} />
                            <TextAreaField label="Description" value={product.description} onChange={(value) => updateProduct(section.id, product.id, { description: value })} />
                            <Field label="WhatsApp message" value={product.whatsappMessage} onChange={(value) => updateProduct(section.id, product.id, { whatsappMessage: value })} placeholder="Hi, I want to order this product." />
                            <div className="action-row wrap">
                              <ToggleField label="Visible" checked={product.isActive} onChange={(value) => updateProduct(section.id, product.id, { isActive: value })} />
                              <button className="secondary-button danger" type="button" onClick={() => removeProduct(section.id, product.id)} disabled={!canManage}>Remove Product</button>
                            </div>
                          </article>
                        )) : <EmptyState text="No manual products yet." />}
                      </div>
                      <div className="builder-bottom-actions">
                        <button className="secondary-button" type="button" onClick={() => addProduct(section.id)} disabled={!canManage}>Add Another Product</button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState text={editorTab === "products" ? "No product showcase sections yet. Click Add Product Showcase to create one." : "No page sections yet. Click Add Text Section, Add Hero Section, or Add Image + Text to create visible website content."} />
            )}
            <div className="builder-bottom-actions">
              {editorTab === "products" ? (
                <button className="secondary-button" type="button" onClick={() => addSection("products")} disabled={!canManage}>Add Another Product Showcase</button>
              ) : (
                <>
                  <button className="secondary-button" type="button" onClick={() => addSection("text")} disabled={!canManage}>Add Text Section</button>
                  <button className="secondary-button" type="button" onClick={() => addSection("image_text")} disabled={!canManage}>Add Image + Text</button>
                </>
              )}
            </div>
          </div>
        </section>
      </section>

      <div className="website-editor-savebar">
        <span>{settings.businessName || "Website"} content editor</span>
        <button className="primary-button" type="submit" disabled={loading || !canManage}>Save Website Builder</button>
      </div>
    </form>
  );
}

function defaultWebsiteBuilder(): TenantWebsiteBuilder {
  return {
    menus: [],
    sections: [{ id: "home-products", menuId: "default", type: "products", heading: "Featured Products", subheading: "", content: "", imageUrl: "", buttons: [], products: [], sortOrder: 1, isActive: true }]
  };
}

function slugifyLocal(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function sectionTypeLabel(type: WebsiteSectionType) {
  const labels: Record<WebsiteSectionType, string> = {
    hero: "Hero section",
    text: "Text section",
    image_text: "Image + text section",
    products: "Product showcase",
    contact: "Contact section",
    gallery: "Gallery section",
    links: "Buttons / links section",
    youtube: "YouTube section"
  };

  return labels[type];
}

function sectionHelp(type: WebsiteSectionType) {
  const help: Record<WebsiteSectionType, string> = {
    hero: "Use this for the main first screen. Heading, content, image URL, and buttons become the large public hero.",
    text: "Use this for About, story, mission, services explanation, or any text-led content block.",
    image_text: "Use this when the tenant wants text beside a strong image, similar to a premium catalog section.",
    products: "Use this to display manual products, vehicles, packages, or offers with price labels and WhatsApp order buttons.",
    contact: "Use this for an extra contact or inquiry section. The main contact block still comes from Website Settings.",
    gallery: "Use this for visual story sections. In this phase, the image URL becomes a background-style visual section.",
    links: "Use this for quick buttons such as View Catalog, Book Now, WhatsApp, or YouTube.",
    youtube: "Use this for a video-focused content section. Add the video or channel URL as a button for now."
  };

  return help[type];
}

function sectionImageHelp(type: WebsiteSectionType) {
  if (type === "hero") {
    return "Background image";
  }

  if (type === "image_text") {
    return "Side image";
  }

  if (type === "products") {
    return "Product images";
  }

  return "Background image optional";
}

function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

function uniqueBuilderId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
