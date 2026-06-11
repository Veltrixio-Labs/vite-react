export type ProductCode = "vendorcore" | "slotplay" | "websuite";

export type ModuleCode =
  | "dashboard"
  | "inventory"
  | "pos"
  | "purchases"
  | "reports"
  | "slotplay"
  | "bookings"
  | "calendar"
  | "website"
  | "settings";

export type TenantStatus = "active" | "trial" | "suspended" | "cancelled";
export type TenantBillingMode = "trial" | "paid" | "internal" | "partner";
export type TenantSuspensionPolicy = "standard" | "manual_only" | "disabled";

export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  billingMode?: TenantBillingMode;
  suspensionPolicy?: TenantSuspensionPolicy;
  country: string;
  currency: string;
  suspensionReason?: string | null;
  suspensionEffectiveAt?: string | Date | null;
  suspensionNoticeAt?: string | Date | null;
}

export interface EnabledModule {
  code: ModuleCode;
  product: ProductCode;
  name: string;
  description: string;
  path: string;
  icon: string;
  startsAt?: string | Date | null;
  expiresAt?: string | Date | null;
  noticeAt?: string | Date | null;
  tenantNote?: string | null;
}

export interface TenantDashboardResponse {
  tenant: TenantSummary;
  modules: EnabledModule[];
}

export interface TenantWebsiteSettings {
  logoUrl: string;
  businessName: string;
  tagline: string;
  about: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  youtubeUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  tiktokUrl: string;
  primaryColor: string;
  iconColor: string;
  heroBackgroundImageUrl: string;
  heroButtonLabel: string;
  heroButtonUrl: string;
  footerBackgroundImageUrl: string;
  showModules: boolean;
  showHeroSocialLinks: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

export type WebsiteSectionType = "hero" | "text" | "image_text" | "products" | "contact" | "gallery" | "links" | "youtube";

export interface WebsiteButton {
  label: string;
  url: string;
}

export interface WebsiteMenu {
  id: string;
  label: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface WebsiteManualProduct {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  imageUrl: string;
  orderButtonLabel: string;
  whatsappMessage: string;
  sortOrder: number;
  isActive: boolean;
}

export interface WebsiteSection {
  id: string;
  menuId: string;
  type: WebsiteSectionType;
  heading: string;
  subheading: string;
  content: string;
  imageUrl: string;
  buttons: WebsiteButton[];
  products: WebsiteManualProduct[];
  sortOrder: number;
  isActive: boolean;
}

export interface TenantWebsiteBuilder {
  menus: WebsiteMenu[];
  sections: WebsiteSection[];
}
