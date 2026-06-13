const appDomain = normalizeHost(import.meta.env.VITE_APP_DOMAIN ?? "veltrixio.com");
const adminSubdomain = import.meta.env.VITE_ADMIN_SUBDOMAIN ?? "admin";
const defaultTenantSlug = optionalEnv(import.meta.env.VITE_DEFAULT_TENANT_SLUG) ?? "";
const websiteUrl = import.meta.env.VITE_WEBSITE_URL ?? `https://${appDomain}`;
const logoUrl = import.meta.env.VITE_LOGO_URL ?? "/logo.png";
const defaultCatalogCodeOptions = [
  "website",
  "inventory",
  "pos",
  "booking",
  "scoreboard",
  "ecommerce",
  "employee_management",
  "school_management",
  "reports",
  "custom"
];

function optionalEnv(value: string | undefined) {
  return value?.trim() || undefined;
}

function normalizeHost(value: string) {
  const trimmed = value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return trimmed.split(":")[0] || trimmed;
}

function parseFooterLinks(value: string | undefined) {
  const fallback = [
    { label: "Products", href: "#products" },
    { label: "Industries", href: "#industries" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
    { label: "Website", href: websiteUrl }
  ];

  if (!value?.trim()) {
    return fallback;
  }

  const links = value
    .split(",")
    .map((item) => {
      const [label, href] = item.split("|").map((part) => part.trim());
      return label && href ? { label, href } : null;
    })
    .filter((link): link is { label: string; href: string } => Boolean(link));

  return links.length ? links : fallback;
}

function parseCsvOptions(value: string | undefined, fallback: string[]) {
  const options = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueOptions = Array.from(new Set(options?.length ? options : fallback));
  return uniqueOptions.includes("custom") ? uniqueOptions : [...uniqueOptions, "custom"];
}

export const appConfig = {
  brandName: import.meta.env.VITE_BRAND_NAME ?? "Veltrixio",
  companyName: import.meta.env.VITE_COMPANY_NAME ?? "Veltrixio Labs",
  websiteUrl,
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? "support@veltrixio.com",
  whatsappUrl: import.meta.env.VITE_WHATSAPP_URL ?? "https://wa.me/94770000000",
  youtubeUrl: import.meta.env.VITE_YOUTUBE_URL ?? "https://www.youtube.com/@veltrixio",
  footerLinks: parseFooterLinks(import.meta.env.VITE_FOOTER_LINKS),
  productTagline:
    import.meta.env.VITE_PRODUCT_TAGLINE ??
    "Business cloud software for shops, bookings, and operations.",
  appDomain,
  adminHost: normalizeHost(import.meta.env.VITE_ADMIN_HOST ?? `${adminSubdomain}.${appDomain}`),
  localAdminHost: normalizeHost(import.meta.env.VITE_LOCAL_ADMIN_HOST ?? "admin.localhost"),
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, ""),
  defaultTenantSlug,
  defaultTenantHost: normalizeHost(optionalEnv(import.meta.env.VITE_DEFAULT_TENANT_HOST) ?? (defaultTenantSlug ? `${defaultTenantSlug}.${appDomain}` : appDomain)),
  defaultCountry: import.meta.env.VITE_DEFAULT_COUNTRY ?? "Sri Lanka",
  defaultCurrency: import.meta.env.VITE_DEFAULT_CURRENCY ?? "LKR",
  defaultTimezone: import.meta.env.VITE_DEFAULT_TIMEZONE ?? "Asia/Colombo",
  logoUrl,
  productCodeOptions: parseCsvOptions(import.meta.env.VITE_PRODUCT_CODE_OPTIONS, defaultCatalogCodeOptions),
  moduleCodeOptions: parseCsvOptions(import.meta.env.VITE_MODULE_CODE_OPTIONS, defaultCatalogCodeOptions)
};

export const apiEndpoints = {
  publicCatalog: "/api/catalog",
  referenceTenantOptions: "/api/reference/tenant-options",
  platformLogin: "/api/platform/auth/login",
  platformTenants: "/api/platform/admin/tenants",
  platformProducts: "/api/platform/admin/products",
  platformModules: "/api/platform/admin/modules",
  platformUsers: "/api/platform/admin/users",
  platformPermissions: "/api/platform/admin/permissions",
  platformProvisionTenant: "/api/platform/admin/tenants/provision",
  platformTenant: (slug: string) => `/api/platform/admin/tenants/${slug}`,
  platformTenantBillingPolicy: (slug: string) => `/api/platform/admin/tenants/${slug}/billing-policy`,
  platformTenantModule: (slug: string, moduleCode: string) => `/api/platform/admin/tenants/${slug}/modules/${moduleCode}`,
  tenantLogin: "/api/auth/login",
  tenantProfile: "/api/tenant/profile",
  tenantDashboard: "/api/tenant/dashboard",
  tenantWebsiteSettings: "/api/tenant/website-settings",
  tenantWebsiteBuilder: "/api/tenant/website-builder",
  tenantBusinessProfile: "/api/tenant/business-profile",
  tenantRoles: "/api/tenant/users/roles",
  tenantUsers: "/api/tenant/users"
};

export function tenantHostForSlug(slug: string) {
  return `${slug}.${appConfig.appDomain}`;
}

export function isLocalHost(hostname = window.location.hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function isLocalSubdomainHost(hostname = window.location.hostname) {
  return hostname.endsWith(".localhost");
}

export function isAdminHost(hostname = window.location.hostname) {
  return hostname === appConfig.adminHost || hostname === appConfig.localAdminHost;
}

export function isTenantHost(hostname = window.location.hostname) {
  return (
    (hostname.endsWith(`.${appConfig.appDomain}`) && hostname !== appConfig.adminHost) ||
    (isLocalSubdomainHost(hostname) && hostname !== appConfig.localAdminHost)
  );
}

export function isTenantManagePath(pathname = window.location.pathname) {
  return pathname === "/manage" || pathname.startsWith("/manage/");
}

export function isTenantProductsPath(pathname = window.location.pathname) {
  return pathname === "/all-products" || pathname.startsWith("/all-products/");
}
