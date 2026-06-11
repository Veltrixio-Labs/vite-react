import { Building2, CalendarDays, CheckCircle2, Menu, MessageCircle, Package, Settings, ShoppingCart, Store, Users, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { apiEndpoints, appConfig } from "../../config";
import { api, renderIcon } from "../../app/app-helpers";
import { Brand, EmptyState, InlineStatus, Metric, NoticeBanner, SectionHeader } from "../../app/components/ui";
import type { PublicCatalogProduct } from "../../app/types";

export function MarketingSite() {
  const [catalog, setCatalog] = useState<PublicCatalogProduct[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [menuOpen, setMenuOpen] = useState(false);
  const industries = ["Hardware shops", "Supermarkets", "Restaurants", "Vegetable stores", "Salons", "Vehicle services"];
  const outcomes = [
    "Know stock levels before customers ask.",
    "Bill faster with fewer manual mistakes.",
    "See sales, expenses, and profit in one place.",
    "Enable only the modules each business needs."
  ];
  const activeModuleCount = catalog.reduce((total, product) => total + product.modules.length, 0);
  const firstBookingProduct = catalog.find((product) => product.modules.some((module) => module.code.includes("slot") || module.code.includes("booking")));

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        const result = await api<{ products: PublicCatalogProduct[] }>(apiEndpoints.publicCatalog);
        if (mounted) {
          setCatalog(result.products);
          setCatalogStatus("ready");
        }
      } catch {
        if (mounted) {
          setCatalogStatus("error");
        }
      }
    }

    void loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="marketing-page">
      <nav className="marketing-nav">
        <Brand />
        <button className="marketing-menu-toggle" type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-label="Toggle menu">
          <Menu size={18} />
        </button>
        <div className={menuOpen ? "marketing-links open" : "marketing-links"}>
          <div className="marketing-link-list">
            <a href="#products" onClick={() => setMenuOpen(false)}>Products</a>
            <a href="#industries" onClick={() => setMenuOpen(false)}>Industries</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </div>
          <div className="marketing-social-list">
            {appConfig.whatsappUrl ? (
              <a className="nav-social-link whatsapp" href={appConfig.whatsappUrl} target="_blank" rel="noreferrer" title="WhatsApp">
                <MessageCircle size={18} />
              </a>
            ) : null}
            {appConfig.youtubeUrl ? (
              <a className="nav-social-link youtube" href={appConfig.youtubeUrl} target="_blank" rel="noreferrer" title="YouTube">
                <Youtube size={18} />
              </a>
            ) : null}
          </div>
        </div>
      </nav>

      <section className="marketing-hero">
        <div className="hero-copy">
          <p className="eyebrow">{appConfig.companyName}</p>
          <h1>{appConfig.productTagline}</h1>
          <p>
            {appConfig.brandName} helps growing businesses run inventory, POS, bookings, users, and reports from one secure SaaS platform.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#products">
              Explore Products
            </a>
            <a className="secondary-button" href="#contact">
              Talk to Us
            </a>
          </div>
        </div>
        <div className="hero-panel">
          <div className="mini-window">
            <div className="window-top">
              <span />
              <span />
              <span />
            </div>
            <div className="module-orbit" aria-hidden="true">
              <span>Inventory</span>
              <span>POS</span>
              <span>SlotPlay</span>
              <span>Reports</span>
            </div>
            <div className="window-grid">
              <Metric icon={<Package size={20} />} label="Active modules" value={catalogStatus === "ready" ? activeModuleCount : "..."} />
              <Metric icon={<ShoppingCart size={20} />} label="Products" value={catalogStatus === "ready" ? catalog.length : "..."} />
              <Metric icon={<CalendarDays size={20} />} label="Booking suite" value={firstBookingProduct ? "Live" : "Optional"} />
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-band" id="products">
        <SectionHeader icon={<Store size={20} />} title="Product Catalog" />
        {catalogStatus === "loading" ? <InlineStatus text="Loading product catalog..." /> : null}
        {catalogStatus === "error" ? <NoticeBanner notice={{ kind: "error", text: "Product catalog is temporarily unavailable." }} /> : null}
        {catalog.length ? <MarketingCatalog products={catalog} /> : null}
      </section>

      <section className="marketing-band alt" id="industries">
        <SectionHeader icon={<Building2 size={20} />} title="Industries" />
        <div className="pill-grid">
          {industries.map((industry) => (
            <span className="industry-pill" key={industry}>
              {industry}
            </span>
          ))}
        </div>
      </section>

      <section className="marketing-split" id="about">
        <div>
          <SectionHeader icon={<CheckCircle2 size={20} />} title="How Businesses Win" />
          <div className="outcome-list">
            {outcomes.map((outcome) => (
              <div className="outcome-row" key={outcome}>
                <CheckCircle2 size={18} />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="support-panel about-panel">
          <SectionHeader icon={<Users size={20} />} title="About" />
          <p>
            {appConfig.companyName} builds practical cloud software for shops, service teams, and growing businesses that need clear operations without heavy complexity.
          </p>
          <p>
            Each customer gets a dedicated workspace, enabled modules, and onboarding support shaped around their business process.
          </p>
        </div>
      </section>

      <section className="marketing-contact" id="contact">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>Ready to organize your business cloud?</h2>
          <p>Tell us your business type, required modules, and preferred rollout timeline. We will help you choose the right package.</p>
          <div className="contact-socials">
            {appConfig.whatsappUrl ? (
              <a className="social-link whatsapp" href={appConfig.whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={18} />
                WhatsApp
              </a>
            ) : null}
            {appConfig.youtubeUrl ? (
              <a className="social-link youtube" href={appConfig.youtubeUrl} target="_blank" rel="noreferrer">
                <Youtube size={18} />
                YouTube
              </a>
            ) : null}
          </div>
        </div>
        <div className="contact-card-grid">
          <article className="contact-card">
            <span className="mini-icon">
              <Store size={18} />
            </span>
            <strong>Sales and onboarding</strong>
            <span>Discuss module packages, tenant setup, and pricing.</span>
          </article>
          <article className="contact-card">
            <span className="mini-icon">
              <Users size={18} />
            </span>
            <strong>Customer support</strong>
            <span>Get help with users, modules, access, and business setup.</span>
          </article>
          <article className="contact-card">
            <span className="mini-icon">
              <Settings size={18} />
            </span>
            <strong>Custom solutions</strong>
            <span>Plan future integrations for payments, staff, vehicles, or schools.</span>
          </article>
        </div>
      </section>

      <footer className="marketing-footer">
        <div>
          <Brand />
          <p>{appConfig.companyName} builds modular cloud software for business operations, bookings, inventory, POS, and future industry-specific systems.</p>
        </div>
        <div className="footer-links">
          {appConfig.footerLinks.map((link) => (
            <a href={link.href} key={`${link.label}-${link.href}`}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="footer-note">
          <strong>Customer access</strong>
          <span>Each business signs in from its own secure subdomain.</span>
          <a href={appConfig.websiteUrl}>{appConfig.websiteUrl}</a>
          <a href={`mailto:${appConfig.supportEmail}`}>{appConfig.supportEmail}</a>
          <small>© {new Date().getFullYear()} {appConfig.companyName}. All rights reserved.</small>
        </div>
      </footer>
    </main>
  );
}

function MarketingCatalog({ products }: { products: PublicCatalogProduct[] }) {
  return (
    <div className="marketing-catalog-grid">
      {products.map((product) => (
        <article className="marketing-product-card" key={product.code}>
          <div className="marketing-product-head">
            <span className="service-icon">
              {product.modules.some((module) => module.icon.includes("calendar") || module.code.includes("slot")) ? <CalendarDays size={22} /> : <Package size={22} />}
            </span>
            <div>
              <h2>{product.name}</h2>
              <p>{product.description || "Configurable modules for growing business operations."}</p>
            </div>
          </div>
          <div className="marketing-module-grid">
            {product.modules.length ? (
              product.modules.map((module) => (
                <div className="marketing-module-chip" key={module.code}>
                  <span className="mini-icon">{renderIcon(module, 18)}</span>
                  <div>
                    <strong>{module.name}</strong>
                    <small>{module.description}</small>
                    <span>{module.monthlyPrice ? `From ${module.monthlyPrice.toLocaleString()} monthly` : "Package pricing"}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No active modules published for this product yet." />
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
