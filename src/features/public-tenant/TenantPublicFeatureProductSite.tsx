import { Globe2, Menu, MessageCircle, Store, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiEndpoints, appConfig } from "../../config";
import { api, defaultWebsiteSettings, hasModule } from "../../app/app-helpers";
import { EmptyState, InlineStatus } from "../../app/components/ui";
import type { TenantProfile } from "../../app/types";

export function TenantPublicFeatureProductSite() {
  const host = window.location.hostname;
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const result = await api<TenantProfile>(apiEndpoints.tenantProfile, {
          tenantHost: host
        });
        setProfile(result);
        setStatus("ready");
      } catch {
        setProfile(null);
        setStatus("error");
      }
    }

    void loadProfile();
  }, [host]);

  useEffect(() => {
    if (!profile) return;

    const tenant = profile.tenant;
    const website = profile.websiteSettings ?? defaultWebsiteSettings(tenant.name);

    document.title = `Products - ${website.businessName || tenant.name}`;
    setMeta("description", website.seoDescription || website.about || website.tagline);
    setMeta("keywords", website.seoKeywords);
  }, [profile]);

  if (status === "loading") {
    return <InlineStatus text={`Loading products from ${host}...`} />;
  }

  if (!profile) {
    return (
      <main className="tenant-public-page">
        <section className="tenant-public-empty">
          <span className="service-icon">
            <Store size={24} />
          </span>
          <h1>Business Site Not Found</h1>
          <p>No public business website is configured for {host}.</p>
          <a className="secondary-button" href={appConfig.websiteUrl}>
            Visit {appConfig.brandName}
          </a>
        </section>
      </main>
    );
  }

  const modules = profile.modules ?? [];
  const tenant = profile.tenant;
  const websiteModuleEnabled = hasModule(modules, "website");

  if (!websiteModuleEnabled) {
    return <TenantWebsiteDisabled tenantName={tenant.name} host={host} />;
  }

  const website = profile.websiteSettings ?? defaultWebsiteSettings(tenant.name);

  const whatsappHref = website.whatsapp.startsWith("http")
    ? website.whatsapp
    : website.whatsapp
      ? `https://wa.me/${website.whatsapp.replace(/[^0-9]/g, "")}`
      : "";

  const products =
    profile.websiteBuilder?.sections
      .filter((section) => section.isActive && section.type === "products")
      .flatMap((section) => section.products)
      .filter((product) => product.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder) ?? [];

  const publicPageUrl = `${window.location.origin}/all-products`;

  return (
    <main
      className="tenant-public-page"
      id="home"
      style={{
        ["--tenant-accent" as string]: website.primaryColor,
        ["--tenant-icon" as string]: website.iconColor
      }}
    >
      <nav className="tenant-public-nav">
        <div className="tenant-public-brand">
          {website.logoUrl ? (
            <img className="brand-logo" src={website.logoUrl} alt={website.businessName} />
          ) : (
            <span className="brand-mark">
              {website.businessName.slice(0, 1).toUpperCase()}
            </span>
          )}

          <div>
            <strong>{website.businessName}</strong>
            <span>
              {tenant.country} · {tenant.currency}
            </span>
          </div>
        </div>

        <button
          className="tenant-public-menu-button"
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-label="Toggle website menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={menuOpen ? "tenant-public-links open" : "tenant-public-links"}>
          <a href="/" onClick={() => setMenuOpen(false)}>
            Back to Home
          </a>
        </div>
      </nav>

      <section className="tenant-public-band all-products-section">
        <div className="section-heading">
          <h1>All products from {website.businessName}</h1>
          <p>Browse all available products published by this business.</p>
        </div>

        {products.length ? (
          <div className="service-grid all-products-grid">
            {products.map((product) => {
              const productLink = `${publicPageUrl}#${productAnchorId(product.id)}`;

              const message = encodeURIComponent(
                `${product.whatsappMessage || `Hi, I want to order ${product.name}.`}\n\nProduct: ${product.name}${
                  product.priceLabel ? `\nPrice: ${product.priceLabel}` : ""
                }\nLink: ${productLink}`
              );

              const orderHref = whatsappHref
                ? `${whatsappHref}${whatsappHref.includes("?") ? "&" : "?"}text=${message}`
                : "/#contact";

              return (
                <article
                  className="service-card product-showcase-card"
                  id={productAnchorId(product.id)}
                  key={product.id}
                >
                  <div className="product-card-media">
                    {product.imageUrl ? (
                      <img className="product-card-image" src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>

                  <div className="product-card-body">
                    <strong>{product.name}</strong>
                    {product.priceLabel ? <span>{product.priceLabel}</span> : null}
                    {product.description ? <small>{product.description}</small> : null}
                  </div>

                  <a
                    className="secondary-button"
                    href={orderHref}
                    target={whatsappHref ? "_blank" : undefined}
                    rel={whatsappHref ? "noreferrer" : undefined}
                  >
                    {product.orderButtonLabel || "Order on WhatsApp"}
                  </a>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState text="No products are published yet." />
        )}
      </section>
    </main>
  );
}

function setMeta(name: string, content: string) {
  const safeContent = content.trim();
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }

  meta.content = safeContent;
}

function productAnchorId(productId: string) {
  return `product-${productId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function TenantWebsiteDisabled({ tenantName, host }: { tenantName: string; host: string }) {
  return (
    <main className="tenant-public-page">
      <section className="tenant-public-empty">
        <span className="service-icon">
          <Globe2 size={24} />
        </span>

        <h1>{tenantName}</h1>
        <p>
          The public website is not enabled yet. Business owners can sign in to request or
          configure the Website module.
        </p>

        <div className="hero-actions">
          <a className="primary-button" href="/manage">
            Business Login
          </a>
          <a className="secondary-button" href={appConfig.websiteUrl} target="_blank" rel="noreferrer">
            View {appConfig.brandName}
          </a>
        </div>

        <small>{host}</small>
      </section>
    </main>
  );
}