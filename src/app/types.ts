import type { EnabledModule, TenantWebsiteBuilder, TenantWebsiteSettings } from "@veltrixio/shared-types";

export type View = "marketing" | "platform" | "tenant-public" | "tenant-products" | "tenant-manage";
export type PlatformTab = "overview" | "provision" | "customers" | "catalog" | "staff";
export type TenantTab = "dashboard" | "website" | "users" | "modules";
export type NoticeKind = "info" | "success" | "error";

export interface ReferenceOption {
  value: string;
  label: string;
}

export interface Notice {
  kind: NoticeKind;
  text: string;
}

export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
}

export interface ApiError {
  message?: string | { message?: string };
  error?: string;
  statusCode?: number;
  conflicts?: string[];
}

export interface PlatformModule {
  code: string;
  product: string;
  name: string;
  description?: string;
  path?: string;
  icon?: string;
  monthlyPrice: number;
  annualPrice: number;
  isActive?: boolean;
}

export interface PlatformProduct {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  moduleCount: number;
}

export interface PublicCatalogModule {
  code: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  monthlyPrice: number;
  annualPrice: number;
}

export interface PublicCatalogProduct {
  code: string;
  name: string;
  description?: string | null;
  modules: PublicCatalogModule[];
}

export interface PlatformTenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  billingMode?: string;
  suspensionPolicy?: string;
  country: string;
  currency: string;
  timezone: string;
  suspensionReason?: string | null;
  suspensionEffectiveAt?: string | null;
  suspensionNoticeAt?: string | null;
  ownerName?: string;
  ownerEmail?: string;
  databases?: Array<{ databaseName: string; schemaVersion: string; status: string }>;
  enabledModules: Array<{
    code: string;
    name: string;
    product: string;
    status: string;
    billingCycle?: string;
    startsAt?: string | null;
    expiresAt?: string | null;
    noticeAt?: string | null;
    tenantNote?: string | null;
    monthlyPrice?: number;
    annualPrice?: number;
  }>;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
}

export interface PlatformPermission {
  code: string;
  description: string;
}

export interface TenantRole {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role: {
    id: string;
    code: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface TenantProfile {
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: string;
    country: string;
    currency: string;
    suspensionReason?: string | null;
    suspensionEffectiveAt?: string | null;
    suspensionNoticeAt?: string | null;
  };
  modules?: EnabledModule[];
  websiteSettings?: TenantWebsiteSettings;
  websiteBuilder?: TenantWebsiteBuilder;
  loginTitle: string;
  loginSubtitle: string;
}

export interface TenantSession {
  token: string;
  host: string;
  user: {
    id?: string;
    name: string;
    email: string;
    role: {
      code: string;
      name: string;
      permissions: string[];
    };
  };
}
