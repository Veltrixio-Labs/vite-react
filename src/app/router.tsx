import { useState } from "react";
import { isAdminHost, isLocalHost, isTenantHost, isTenantManagePath, isTenantProductsPath } from "../config";
import { MarketingSite } from "../features/marketing/MarketingPage";
import { PlatformAdminApp } from "../features/platform-admin/PlatformAdminApp";
import { TenantPublicSite } from "../features/public-tenant/TenantPublicSite";
import { TenantWorkspace } from "../features/tenant/TenantManageApp";
import { TenantPublicFeatureProductSite } from "../features/public-tenant/TenantPublicFeatureProductSite";
import type { View } from "./types";

export function AppRouter() {
  const [view] = useState<View>(() => {
    if (isAdminHost()) {
      return "platform";
    }

    if (isTenantHost()) {
      if (isTenantManagePath()) return "tenant-manage";
      if (isTenantProductsPath()) return "tenant-products";
      return "tenant-public";
    }

    if (isLocalHost() && isTenantManagePath()) {
      return "tenant-manage";
    }

    return "marketing";
  });

  if (view === "marketing") {
    return <MarketingSite />;
  }

  if (view === "platform") {
    return <PlatformAdminApp />;
  }

  if (view === "tenant-products") {
    return <TenantPublicFeatureProductSite />;
  }

  return view === "tenant-public" ? <TenantPublicSite /> : <TenantWorkspace />;
}
