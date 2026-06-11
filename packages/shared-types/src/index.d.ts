export type ProductCode = "vendorcore" | "slotplay";
export type ModuleCode = "dashboard" | "inventory" | "pos" | "purchases" | "reports" | "slotplay" | "bookings" | "calendar" | "settings";
export type TenantStatus = "active" | "trial" | "suspended" | "cancelled";
export interface TenantSummary {
    id: string;
    slug: string;
    name: string;
    status: TenantStatus;
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
}
