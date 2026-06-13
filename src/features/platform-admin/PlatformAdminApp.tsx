import { Activity, Building2, CheckCircle2, CirclePause, Globe2, LogOut, Mail, Package, Receipt, ShieldCheck, Store, Users, X } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { apiEndpoints, appConfig, tenantHostForSlug } from "../../config";
import { DashboardShell } from "../../app/components/layout";
import { AuthScreen, Badge, CheckList, ConfirmDialog, DetailItem, EmptyState, Field, HelpPanel, InlineStatus, Metric, NoticeBanner, NoticeToast, PageHeader, SectionHeader, SelectField, StatusBadge, Tabs, TextAreaField, ToggleField, UserList } from "../../app/components/ui";
import { api, dateInputValue, emptyModuleScheduleForm, errorMessage, formatDate, isUnauthorized, moduleScheduleForms, nextMonthDateInput, platformApi, platformPermissionsFromPlatformToken, platformUserIdFromPlatformToken, renderIcon, shouldShowSuspensionNotice, slugify, tenantModuleNotices } from "../../app/app-helpers";
import type { ConfirmDialogState, Notice, PlatformModule, PlatformPermission, PlatformProduct, PlatformTab, PlatformTenant, PlatformUser, ReferenceOption } from "../../app/types";
import { CatalogManager } from "./CatalogPage";
import { PlatformOverview } from "./PlatformOverview";
import { TenantDetailModal, TenantTable } from "./TenantCustomers";

const NOTICE_AUTO_DISMISS_MS = 6000;
const fallbackCountryOptions = ["Sri Lanka", "India", "United States", "United Kingdom", "Canada", "Australia", "United Arab Emirates", "Singapore", "Malaysia"].map((country) => ({ value: country, label: country }));
const fallbackCurrencyOptions = ["LKR", "INR", "USD", "GBP", "EUR", "CAD", "AUD", "AED", "SGD", "MYR"].map((currency) => ({ value: currency, label: currency }));
const fallbackTimezoneOptions = [
  { value: "Asia/Colombo", label: "Sri Lanka / Sri Jayawardenepura (Asia/Colombo)" },
  { value: "Asia/Kolkata", label: "India (Asia/Kolkata)" },
  { value: "Asia/Dubai", label: "UAE (Asia/Dubai)" },
  { value: "Asia/Singapore", label: "Singapore (Asia/Singapore)" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia (Asia/Kuala_Lumpur)" },
  { value: "Europe/London", label: "United Kingdom (Europe/London)" },
  { value: "America/New_York", label: "US Eastern (America/New_York)" },
  { value: "America/Los_Angeles", label: "US Pacific (America/Los_Angeles)" },
  { value: "America/Toronto", label: "Canada Eastern (America/Toronto)" },
  { value: "Australia/Sydney", label: "Australia Sydney (Australia/Sydney)" },
  { value: "UTC", label: "UTC" }
];

interface ProvisionTenantResult {
  tenant: { name: string };
  databaseName: string;
  provisioningStatus?: "ready" | "database_failed";
  manualActionRequired?: boolean;
  message?: string;
  nextLoginUrl?: string;
}

function useAutoDismissNotice(notice: Notice | null, setNotice: Dispatch<SetStateAction<Notice | null>>) {
  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), NOTICE_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);
}

export function PlatformAdminApp() {
  const [tab, setTab] = useState<PlatformTab>("overview");
  const [token, setToken] = useState(() => localStorage.getItem("platformAccessToken") ?? "");
  const [currentPlatformUserId, setCurrentPlatformUserId] = useState(() => platformUserIdFromPlatformToken(localStorage.getItem("platformAccessToken") ?? ""));
  const [currentPlatformPermissions, setCurrentPlatformPermissions] = useState(() => platformPermissionsFromPlatformToken(localStorage.getItem("platformAccessToken") ?? ""));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [platformPermissions, setPlatformPermissions] = useState<PlatformPermission[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [referenceOptions, setReferenceOptions] = useState({
    countries: fallbackCountryOptions,
    currencies: fallbackCurrencyOptions,
    timezones: fallbackTimezoneOptions
  });
  const [form, setForm] = useState({
    slug: "",
    name: "",
    country: appConfig.defaultCountry,
    currency: appConfig.defaultCurrency,
    timezone: appConfig.defaultTimezone,
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    moduleCodes: [] as string[]
  });
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    permissionCodes: [] as string[]
  });
  const emptyProductForm = { code: "", name: "", description: "", isActive: true };
  const emptyModuleForm = {
    productCode: "",
    code: "",
    name: "",
    description: "",
    path: "",
    icon: "package",
    monthlyPrice: "0",
    annualPrice: "0",
    isActive: true
  };
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductCode, setEditingProductCode] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [editingModuleCode, setEditingModuleCode] = useState<string | null>(null);

  useAutoDismissNotice(notice, setNotice);

  useEffect(() => {
    if (token) {
      void loadPlatformData();
      void loadReferenceOptions();
    }
  }, [token]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const result = await api<{ accessToken: string }>(apiEndpoints.platformLogin, {
        method: "POST",
        body: { email, password }
      });
      localStorage.setItem("platformAccessToken", result.accessToken);
      setToken(result.accessToken);
      setCurrentPlatformUserId(platformUserIdFromPlatformToken(result.accessToken));
      setCurrentPlatformPermissions(platformPermissionsFromPlatformToken(result.accessToken));
      setEmail("");
      setPassword("");
      setNotice({ kind: "success", text: "Platform login successful." });
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Invalid platform credentials.") });
    } finally {
      setLoading(false);
    }
  }

  async function loadPlatformData() {
    setLoading(true);
    try {
      const permissions = platformPermissionsFromPlatformToken(token);
      const canViewTenants = permissions.includes("platform.tenants.view");
      const canViewModules = permissions.includes("platform.modules.view");
      const canViewUsers = permissions.includes("platform.users.view");

      if (!canViewTenants && !canViewModules && !canViewUsers) {
        setNotice({ kind: "error", text: "This platform user has no dashboard permissions. Sign in as a super admin or update platform staff permissions." });
        return;
      }

      const [tenantList, moduleList, productList, userList, permissionResult] = await Promise.all([
        canViewTenants ? platformApi<PlatformTenant[]>(token, apiEndpoints.platformTenants) : Promise.resolve([]),
        canViewModules ? platformApi<PlatformModule[]>(token, apiEndpoints.platformModules) : Promise.resolve([]),
        canViewModules ? platformApi<PlatformProduct[]>(token, apiEndpoints.platformProducts) : Promise.resolve([]),
        canViewUsers ? platformApi<PlatformUser[]>(token, apiEndpoints.platformUsers) : Promise.resolve([]),
        canViewUsers ? platformApi<{ permissions: PlatformPermission[] }>(token, apiEndpoints.platformPermissions) : Promise.resolve({ permissions: [] })
      ]);

      setTenants(tenantList);
      setModules(moduleList);
      setProducts(productList);
      setPlatformUsers(userList);
      setPlatformPermissions(permissionResult.permissions);
    } catch (error) {
      if (isUnauthorized(error)) {
        logoutPlatform();
      }
      setNotice({ kind: "error", text: errorMessage(error, "Unable to load platform data.") });
    } finally {
      setLoading(false);
    }
  }

  async function loadReferenceOptions() {
    try {
      const result = await api<{ countries: ReferenceOption[]; currencies: ReferenceOption[]; timezones: ReferenceOption[] }>(apiEndpoints.referenceTenantOptions);
      setReferenceOptions({
        countries: result.countries.length ? result.countries : fallbackCountryOptions,
        currencies: result.currencies.length ? result.currencies : fallbackCurrencyOptions,
        timezones: result.timezones.length ? result.timezones : fallbackTimezoneOptions
      });
    } catch {
      setReferenceOptions({
        countries: fallbackCountryOptions,
        currencies: fallbackCurrencyOptions,
        timezones: fallbackTimezoneOptions
      });
    }
  }

  async function provision(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const result = await platformApi<ProvisionTenantResult>(token, apiEndpoints.platformProvisionTenant, {
        method: "POST",
        body: form
      });

      if (result.manualActionRequired) {
        setNotice({
          kind: "error",
          text: result.message ?? `Tenant ${result.tenant.name} was created, but database ${result.databaseName} needs manual provisioning.`
        });
      } else {
        setNotice({ kind: "success", text: `Provisioned ${result.tenant.name}. Customer URL: ${result.nextLoginUrl}` });
        setForm({
          slug: "",
          name: "",
          country: appConfig.defaultCountry,
          currency: appConfig.defaultCurrency,
          timezone: appConfig.defaultTimezone,
          ownerName: "",
          ownerEmail: "",
          ownerPassword: "",
          moduleCodes: []
        });
      }

      setTab("customers");
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Provisioning failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function createStaffUser(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const result = await platformApi<{ email: string }>(token, apiEndpoints.platformUsers, {
        method: "POST",
        body: staffForm
      });
      setNotice({ kind: "success", text: `Created platform user ${result.email}.` });
      setStaffForm({ name: "", email: "", password: "", role: "manager", permissionCodes: [] });
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Staff user creation failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function updateTenantStatus(slug: string, status: string) {
    const tenant = tenants.find((item) => item.slug === slug);

    if (tenant?.status === "suspended" && status === "suspended") {
      setNotice({ kind: "info", text: `${tenant.name} is already suspended.` });
      return;
    }

    setConfirmDialog({
      title: status === "suspended" ? "Suspend Workspace Access" : "Reactivate Workspace Access",
      message:
        status === "suspended"
          ? "This will block the tenant owner and all staff from signing in or accessing the tenant workspace."
          : "This will restore access to the tenant workspace for active tenant users.",
      confirmLabel: status === "suspended" ? "Suspend Access" : "Reactivate Access",
      tone: status === "suspended" ? "danger" : "default",
      onConfirm: () => void performTenantStatusUpdate(slug, status)
    });
  }

  async function performTenantStatusUpdate(slug: string, status: string) {
    setLoading(true);
    setNotice(null);

    try {
      await platformApi<PlatformTenant>(token, `${apiEndpoints.platformTenants}/${slug}/status`, {
        method: "PUT",
        body: { status, reason: status === "suspended" ? "Suspended by platform admin." : undefined }
      });
      setNotice({ kind: "success", text: `Tenant ${status === "suspended" ? "suspended" : "reactivated"}.` });
      setSelectedTenant((current) => (current?.slug === slug ? { ...current, status } : current));
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Tenant status update failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function suspendTenantImmediately(slug: string, reason: string) {
    setLoading(true);
    setNotice(null);

    try {
      const updated = await platformApi<PlatformTenant>(token, `${apiEndpoints.platformTenants}/${slug}/status`, {
        method: "PUT",
        body: { status: "suspended", reason }
      });
      setNotice({ kind: "success", text: "Tenant suspended immediately." });
      setSelectedTenant((current) => (current?.slug === slug ? { ...current, ...updated } : current));
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Tenant suspension failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function scheduleTenantSuspension(slug: string, body: { effectiveAt: string; reason: string }) {
    setLoading(true);
    setNotice(null);

    try {
      const updated = await platformApi<PlatformTenant>(token, `${apiEndpoints.platformTenants}/${slug}/suspension`, {
        method: "PUT",
        body
      });
      setNotice({ kind: "success", text: "Tenant suspension scheduled." });
      setSelectedTenant((current) => (current?.slug === slug ? { ...current, ...updated } : current));
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Tenant suspension scheduling failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function clearTenantSuspension(slug: string) {
    setLoading(true);
    setNotice(null);

    try {
      const updated = await platformApi<PlatformTenant>(token, `${apiEndpoints.platformTenants}/${slug}/suspension`, {
        method: "DELETE"
      });
      setNotice({ kind: "success", text: "Tenant suspension cleared." });
      setSelectedTenant((current) => (current?.slug === slug ? { ...current, ...updated } : current));
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Tenant suspension clear failed.") });
    } finally {
      setLoading(false);
    }
  }

  function confirmDeleteTenant(tenant: PlatformTenant) {
    setConfirmDialog({
      title: "Delete Tenant Permanently",
      message: `This will permanently delete ${tenant.name}, its tenant data, domain records, module access, and owner workspace. This cannot be undone.`,
      confirmLabel: "Delete Permanently",
      tone: "danger",
      onConfirm: () => void deleteTenant(tenant.slug)
    });
  }

  async function deleteTenant(slug: string) {
    setLoading(true);
    setNotice(null);

    try {
      await platformApi<{ deleted: boolean; slug: string }>(token, apiEndpoints.platformTenant(slug), {
        method: "DELETE"
      });
      setNotice({ kind: "success", text: `Tenant ${slug} was permanently deleted.` });
      setSelectedTenant(null);
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Tenant deletion failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function updateTenantBillingPolicy(slug: string, body: { billingMode: string; suspensionPolicy: string }) {
    setLoading(true);
    setNotice(null);

    try {
      const updated = await platformApi<PlatformTenant>(token, apiEndpoints.platformTenantBillingPolicy(slug), {
        method: "PUT",
        body
      });
      setNotice({ kind: "success", text: "Customer billing and suspension policy updated." });
      setSelectedTenant((current) => (current?.slug === slug ? { ...current, ...updated } : current));
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Billing policy update failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function updateTenantModule(
    slug: string,
    moduleCode: string,
    body: { enabled: boolean; billingCycle?: string; startsAt?: string; expiresAt?: string; tenantNote?: string; internalNote?: string }
  ) {
    setLoading(true);
    setNotice(null);

    try {
      const result = await platformApi<PlatformTenant["enabledModules"][number]>(token, apiEndpoints.platformTenantModule(slug, moduleCode), {
        method: "PUT",
        body
      });
      setNotice({ kind: "success", text: `Module ${body.enabled ? "enabled/scheduled" : "disabled"} for customer.` });
      setSelectedTenant((current) => {
        if (!current || current.slug !== slug) {
          return current;
        }

        const enabledModules = body.enabled
          ? [...current.enabledModules.filter((module) => module.code !== moduleCode), result]
          : current.enabledModules.filter((module) => module.code !== moduleCode);

        return { ...current, enabledModules };
      });
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Module update failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function updatePlatformUserStatus(id: string, status: string) {
    setConfirmDialog({
      title: status === "suspended" ? "Suspend Platform User" : "Reactivate Platform User",
      message:
        status === "suspended"
          ? "This will block this platform staff member from signing in or using the platform admin dashboard."
          : "This will restore platform admin access for this staff member.",
      confirmLabel: status === "suspended" ? "Suspend User" : "Reactivate User",
      tone: status === "suspended" ? "danger" : "default",
      onConfirm: () => void performPlatformUserStatusUpdate(id, status)
    });
  }

  async function performPlatformUserStatusUpdate(id: string, status: string) {
    setLoading(true);
    setNotice(null);

    try {
      await platformApi<PlatformUser>(token, `${apiEndpoints.platformUsers}/${id}/status`, {
        method: "PUT",
        body: { status }
      });
      setNotice({ kind: "success", text: `Platform user ${status === "suspended" ? "suspended" : "reactivated"}.` });
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Platform user status update failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const path = editingProductCode ? `${apiEndpoints.platformProducts}/${editingProductCode}` : apiEndpoints.platformProducts;
      await platformApi<PlatformProduct>(token, path, {
        method: editingProductCode ? "PUT" : "POST",
        body: productForm
      });
      setNotice({ kind: "success", text: editingProductCode ? "Product updated." : "Product created." });
      resetProductForm();
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Product save failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(code: string) {
    setLoading(true);
    setNotice(null);

    try {
      await platformApi<{ deleted: boolean }>(token, `${apiEndpoints.platformProducts}/${code}`, {
        method: "DELETE"
      });
      setNotice({ kind: "success", text: "Product deleted." });
      resetProductForm();
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Product delete failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function saveModule(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const path = editingModuleCode ? `${apiEndpoints.platformModules}/${editingModuleCode}` : apiEndpoints.platformModules;
      await platformApi<PlatformModule>(token, path, {
        method: editingModuleCode ? "PUT" : "POST",
        body: {
          ...moduleForm,
          monthlyPrice: Number(moduleForm.monthlyPrice),
          annualPrice: Number(moduleForm.annualPrice)
        }
      });
      setNotice({ kind: "success", text: editingModuleCode ? "Module updated." : "Module created." });
      resetModuleForm();
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Module save failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function deleteModule(code: string) {
    setLoading(true);
    setNotice(null);

    try {
      await platformApi<{ deleted: boolean }>(token, `${apiEndpoints.platformModules}/${code}`, {
        method: "DELETE"
      });
      setNotice({ kind: "success", text: "Module deleted." });
      resetModuleForm();
      await loadPlatformData();
    } catch (error) {
      setNotice({ kind: "error", text: errorMessage(error, "Module delete failed.") });
    } finally {
      setLoading(false);
    }
  }

  function editProduct(product: PlatformProduct) {
    setEditingProductCode(product.code);
    setProductForm({
      code: product.code,
      name: product.name,
      description: product.description ?? "",
      isActive: product.isActive
    });
    setNotice({ kind: "info", text: `Editing product ${product.name}. Update the form and save changes.` });
  }

  function editModule(module: PlatformModule) {
    setEditingModuleCode(module.code);
    setModuleForm({
      productCode: module.product,
      code: module.code,
      name: module.name,
      description: module.description ?? "",
      path: module.path ?? `/${module.code}`,
      icon: module.icon ?? "package",
      monthlyPrice: String(module.monthlyPrice),
      annualPrice: String(module.annualPrice),
      isActive: module.isActive ?? true
    });
    setNotice({ kind: "info", text: `Editing module ${module.name}. Update the form and save changes.` });
  }

  function resetProductForm() {
    setEditingProductCode(null);
    setProductForm(emptyProductForm);
  }

  function resetModuleForm() {
    setEditingModuleCode(null);
    setModuleForm({ ...emptyModuleForm, productCode: products[0]?.code ?? "" });
  }

  function logoutPlatform() {
    localStorage.removeItem("platformAccessToken");
    setToken("");
    setCurrentPlatformUserId(null);
    setCurrentPlatformPermissions([]);
  }

  function toggleModule(code: string) {
    setForm((current) => ({
      ...current,
      moduleCodes: current.moduleCodes.includes(code) ? current.moduleCodes.filter((item) => item !== code) : [...current.moduleCodes, code]
    }));
  }

  function togglePermission(code: string) {
    setStaffForm((current) => ({
      ...current,
      permissionCodes: current.permissionCodes.includes(code)
        ? current.permissionCodes.filter((item) => item !== code)
        : [...current.permissionCodes, code]
    }));
  }

  if (!token) {
    return (
      <AuthScreen
        icon={<ShieldCheck size={24} />}
        title="Platform Admin"
        subtitle={`Sign in as ${appConfig.brandName} staff to provision customers and manage platform users.`}
        email={email}
        password={password}
        loading={loading}
        notice={notice}
        onEmail={setEmail}
        onPassword={setPassword}
        onSubmit={login}
      />
    );
  }

  const platformActions = (
    <button className="icon-button" onClick={logoutPlatform} title="Sign out">
      <LogOut size={18} />
    </button>
  );
  const canViewTenants = currentPlatformPermissions.includes("platform.tenants.view");
  const canProvisionTenants = currentPlatformPermissions.includes("platform.tenants.provision");
  const canViewModules = currentPlatformPermissions.includes("platform.modules.view");
  const canViewStaff = currentPlatformPermissions.includes("platform.users.view");
  const visibleTabs: Array<[PlatformTab, string]> = [
    ["overview", "Overview"],
    ...(canProvisionTenants ? [["provision", "Provision"] as [PlatformTab, string]] : []),
    ...(canViewTenants ? [["customers", "Customers"] as [PlatformTab, string]] : []),
    ...(canViewModules ? [["catalog", "Catalog"] as [PlatformTab, string]] : []),
    ...(canViewStaff ? [["staff", "Staff"] as [PlatformTab, string]] : [])
  ];

  return (
    <DashboardShell
      view="platform"
      platformTab={tab}
      tenantTab="dashboard"
      onPlatformTab={setTab}
      onTenantTab={() => undefined}
      mobileActions={platformActions}
    >
      <div>
      <PageHeader
        eyebrow={appConfig.adminHost}
        title="Platform Admin"
        action={platformActions}
      />
      <Tabs
        items={visibleTabs}
        active={tab}
        onChange={(value) => setTab(value as PlatformTab)}
      />
      {notice ? <NoticeToast notice={notice} /> : null}
      {loading ? <InlineStatus text="Loading platform data..." /> : null}

      {tab === "overview" ? <PlatformOverview tenants={tenants} modules={modules} users={platformUsers} onRefresh={loadPlatformData} onSelectTenant={setSelectedTenant} onTenantStatus={updateTenantStatus} /> : null}
      {tab === "provision" ? (
        <section className="split-grid">
          <form className="panel form-grid" onSubmit={provision}>
            <SectionHeader icon={<Building2 size={20} />} title="Provision Customer" />
            <Field label="Tenant slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: slugify(value) })} placeholder="autospot" />
            <Field label="Business name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Auto Spot" />
            <div className="two-col">
              <SelectField label="Country" value={form.country} options={referenceOptions.countries} onChange={(value) => setForm({ ...form, country: value })} />
              <SelectField label="Currency" value={form.currency} options={referenceOptions.currencies} onChange={(value) => setForm({ ...form, currency: value })} />
            </div>
            <SelectField label="Timezone" value={form.timezone} options={referenceOptions.timezones} onChange={(value) => setForm({ ...form, timezone: value })} />
            <div className="divider" />
            <Field label="Owner name" value={form.ownerName} onChange={(value) => setForm({ ...form, ownerName: value })} />
            <Field label="Owner email" type="email" value={form.ownerEmail} onChange={(value) => setForm({ ...form, ownerEmail: value })} />
            <Field label="Owner password" type="password" value={form.ownerPassword} onChange={(value) => setForm({ ...form, ownerPassword: value })} />
            <CheckList title="Enabled modules" items={modules.map((module) => ({ code: module.code, label: `${module.name} (${module.product})` }))} selected={form.moduleCodes} onToggle={toggleModule} />
            <button className="primary-button" type="submit" disabled={loading || !form.moduleCodes.length}>
              Provision Customer
            </button>
          </form>
          <HelpPanel
            title="Provisioning Flow"
            lines={[
              "Creates the tenant metadata in the platform database.",
              "Creates and migrates the tenant MySQL database automatically.",
              "Creates the first tenant owner account.",
              "Tenant owner then creates tenant managers and staff."
            ]}
          />
        </section>
      ) : null}
      {tab === "customers" ? <TenantTable tenants={tenants} onSelect={setSelectedTenant} onStatus={updateTenantStatus} /> : null}
      {tab === "catalog" ? (
        <CatalogManager
          products={products}
          modules={modules}
          productForm={productForm}
          moduleForm={moduleForm}
          editingProductCode={editingProductCode}
          editingModuleCode={editingModuleCode}
          loading={loading}
          onProductForm={setProductForm}
          onModuleForm={setModuleForm}
          onSaveProduct={saveProduct}
          onSaveModule={saveModule}
          onEditProduct={editProduct}
          onEditModule={editModule}
          onDeleteProduct={deleteProduct}
          onDeleteModule={deleteModule}
          onCancelProduct={resetProductForm}
          onCancelModule={resetModuleForm}
        />
      ) : null}
      {tab === "staff" ? (
        <section className="split-grid">
          <form className="panel form-grid" onSubmit={createStaffUser}>
            <SectionHeader icon={<Users size={20} />} title="Create Platform Staff" />
            <Field label="Name" value={staffForm.name} onChange={(value) => setStaffForm({ ...staffForm, name: value })} />
            <Field label="Email" type="email" value={staffForm.email} onChange={(value) => setStaffForm({ ...staffForm, email: value })} />
            <Field label="Temporary password" type="password" value={staffForm.password} onChange={(value) => setStaffForm({ ...staffForm, password: value })} />
            <label className="field">
              <span>Role</span>
              <select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}>
                <option value="manager">Manager</option>
                <option value="support">Support</option>
                <option value="billing">Billing</option>
              </select>
            </label>
            <CheckList title="Permissions" items={platformPermissions.map((permission) => ({ code: permission.code, label: permission.code }))} selected={staffForm.permissionCodes} onToggle={togglePermission} />
            <button className="primary-button" type="submit" disabled={loading}>
              Create Staff User
            </button>
          </form>
          <UserList users={platformUsers} currentUserId={currentPlatformUserId} onStatus={updatePlatformUserStatus} />
        </section>
      ) : null}
      {selectedTenant ? (
        <TenantDetailModal
          tenant={selectedTenant}
          availableModules={modules}
          onClose={() => setSelectedTenant(null)}
          onScheduleSuspension={scheduleTenantSuspension}
          onImmediateSuspension={suspendTenantImmediately}
          onClearSuspension={clearTenantSuspension}
          onBillingPolicy={updateTenantBillingPolicy}
          onTenantModule={updateTenantModule}
          onDeleteTenant={confirmDeleteTenant}
        />
      ) : null}
      {confirmDialog ? <ConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} onConfirm={() => {
        const action = confirmDialog.onConfirm;
        setConfirmDialog(null);
        action();
      }} /> : null}
      </div>
    </DashboardShell>
  );
}
