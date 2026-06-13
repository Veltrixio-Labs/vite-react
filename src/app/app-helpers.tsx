import { CalendarDays, Globe2, LayoutDashboard, Package, Receipt, Settings, ShoppingCart, type LucideIcon } from "lucide-react";
import type { EnabledModule, TenantWebsiteSettings } from "@veltrixio/shared-types";
import { appConfig } from "../config";
import type { ApiError, PlatformModule, PlatformTenant, TenantSession } from "./types";

const moduleIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  inventory: Package,
  pos: ShoppingCart,
  purchases: Receipt,
  reports: LayoutDashboard,
  slotplay: CalendarDays,
  bookings: CalendarDays,
  calendar: CalendarDays,
  settings: Settings,
  website: Globe2
};

export async function api<T>(path: string, options: { method?: string; token?: string; tenantHost?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.tenantHost) {
    headers["X-Tenant-Host"] = options.tenantHost;
  }

  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}

export function platformApi<T>(token: string, path: string, options: { method?: string; body?: unknown } = {}) {
  return api<T>(path, { ...options, token });
}

export function tenantApi<T>(session: TenantSession, path: string, options: { method?: string; body?: unknown } = {}) {
  return api<T>(path, { ...options, token: session.token, tenantHost: session.host });
}

export function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "string") {
    return error;
  }

  const apiError = error as ApiError;
  const message = typeof apiError.message === "string" ? apiError.message : apiError.message?.message;
  const conflictText = apiError.conflicts?.length ? ` ${apiError.conflicts.join(", ")}` : "";
  return `${message ?? apiError.error ?? fallback}${conflictText}`;
}

export function isUnauthorized(error: unknown) {
  return typeof error === "object" && error !== null && (error as ApiError).statusCode === 401;
}

export function platformUserIdFromPlatformToken(token: string) {
  return platformTokenPayload(token)?.sub ?? null;
}

export function platformPermissionsFromPlatformToken(token: string) {
  return platformTokenPayload(token)?.permissions ?? [];
}

function platformTokenPayload(token: string) {
  try {
    const encodedPayload = token.split(".")[0] ?? "";
    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload)) as { sub?: unknown; permissions?: unknown };

    return {
      sub: typeof payload.sub === "string" ? payload.sub : null,
      permissions: Array.isArray(payload.permissions) && payload.permissions.every((permission) => typeof permission === "string")
        ? payload.permissions
        : []
    };
  } catch {
    return null;
  }
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function tenantSessionKey(host: string) {
  return `tenantSession:${host}`;
}

export function defaultWebsiteSettings(businessName: string): TenantWebsiteSettings {
  return {
    logoUrl: "",
    businessName,
    tagline: "Products, services, and business updates from one trusted place.",
    about: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    youtubeUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    tiktokUrl: "",
    primaryColor: "#0e7c7b",
    iconColor: "#0e7c7b",
    heroBackgroundImageUrl: "",
    heroButtonLabel: "",
    heroButtonUrl: "",
    footerBackgroundImageUrl: "",
    showModules: true,
    showHeroSocialLinks: false,
    seoTitle: businessName,
    seoDescription: "",
    seoKeywords: ""
  };
}

export function emptyModuleScheduleForm() {
  return {
    billingCycle: "monthly",
    startsAt: "",
    expiresAt: "",
    tenantNote: "",
    internalNote: ""
  };
}

export function moduleScheduleForms(availableModules: PlatformModule[], enabledModules: PlatformTenant["enabledModules"]) {
  return Object.fromEntries(
    availableModules.map((module) => {
      const enabled = enabledModules.find((item) => item.code === module.code);

      return [
        module.code,
        {
          billingCycle: enabled?.billingCycle ?? "monthly",
          startsAt: dateInputValue(enabled?.startsAt),
          expiresAt: dateInputValue(enabled?.expiresAt),
          tenantNote: enabled?.tenantNote ?? "",
          internalNote: ""
        }
      ];
    })
  );
}

export function hasModule(modules: EnabledModule[], code: string) {
  return modules.some((module) => module.code === code);
}

export function dateInputValue(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function nextMonthDateInput() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function tenantModuleNotices(tenants: PlatformTenant[]) {
  return tenants
    .flatMap((tenant) =>
      tenant.enabledModules
        .filter((module) => shouldShowSuspensionNotice(module.noticeAt, module.expiresAt))
        .map((module) => ({ tenant, module }))
    )
    .sort((left, right) => new Date(left.module.expiresAt ?? 0).getTime() - new Date(right.module.expiresAt ?? 0).getTime());
}

export function shouldShowSuspensionNotice(noticeAt?: string | Date | null, effectiveAt?: string | Date | null) {
  if (!effectiveAt) {
    return false;
  }

  const effectiveDate = new Date(effectiveAt);
  if (Number.isNaN(effectiveDate.getTime())) {
    return false;
  }

  const noticeDate = noticeAt ? new Date(noticeAt) : new Date(effectiveDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return now >= noticeDate;
}

export function renderIcon(module: { code: string }, size = 18) {
  const Icon = moduleIcons[module.code] ?? LayoutDashboard;
  return <Icon size={size} />;
}
