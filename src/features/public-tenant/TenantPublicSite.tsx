import { Facebook, Globe2, Instagram, Linkedin, Mail, Menu, MessageCircle, Music2, Phone, Store, X, Youtube } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { apiEndpoints, appConfig } from "../../config";
import { api, defaultWebsiteSettings, hasModule, renderIcon } from "../../app/app-helpers";
import { EmptyState, InlineStatus } from "../../app/components/ui";
import type { TenantProfile } from "../../app/types";
import type { WebsiteSection } from "@veltrixio/shared-types";

type PublicSocialLink = {
  href: string;
  icon: ReactNode;
  label: string;
};

export function TenantPublicSite() {
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
    if (!profile) {
      return;
    }

    const tenant = profile.tenant;
    const website = profile.websiteSettings ?? defaultWebsiteSettings(tenant.name);
    document.title = website.seoTitle || website.businessName || tenant.name;
    setMeta("description", website.seoDescription || website.about || website.tagline);
    setMeta("keywords", website.seoKeywords);
  }, [profile]);

  if (status === "loading") {
    return <InlineStatus text={`Loading ${host}...`} />;
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
  const builder = profile.websiteBuilder;
  const activeMenus = builder?.menus.filter((menu) => menu.isActive).sort((left, right) => left.sortOrder - right.sortOrder) ?? [];
  const customMenus = activeMenus.filter((menu) => !["home", "services", "contact"].includes(menu.slug));
  const activeSections = builder?.sections.filter((section) => section.isActive && section.type !== "hero").sort((left, right) => left.sortOrder - right.sortOrder) ?? [];
  const contentSections = activeSections;
  const defaultSections = contentSections.filter((section) => section.menuId === "default" || !activeMenus.some((menu) => menu.id === section.menuId));
  const hasDefaultProductSections = defaultSections.some((section) => section.type === "products" && section.products.some((product) => product.isActive));
  const publicModules = website.showModules ? modules.filter((module) => module.code !== "website") : [];
  const whatsappHref = website.whatsapp.startsWith("http") ? website.whatsapp : website.whatsapp ? `https://wa.me/${website.whatsapp.replace(/[^0-9]/g, "")}` : "";
  const publicPageUrl = `${window.location.origin}${window.location.pathname}`;
  const heroSocialLinks = website.showHeroSocialLinks ? publicSocialLinks(website, whatsappHref) : [];
  const navItems = [
    { label: "Home", href: "#home", key: "home" },
    ...customMenus.map((menu) => ({ label: menu.label, href: `#${menu.slug}`, key: menu.id })),
    ...(hasDefaultProductSections ? [{ label: "Products", href: "#website-content", key: "products" }] : []),
    ...(publicModules.length ? [{ label: "Services", href: "#services", key: "services" }] : []),
    { label: "Contact", href: "#contact", key: "contact" }
  ];

  return (
    <main className="tenant-public-page" id="home" style={{ ["--tenant-accent" as string]: website.primaryColor, ["--tenant-icon" as string]: website.iconColor }}>
      <nav className="tenant-public-nav">
        <div className="tenant-public-brand">
          {website.logoUrl ? <img className="brand-logo" src={website.logoUrl} alt={website.businessName} /> : <span className="brand-mark">{website.businessName.slice(0, 1).toUpperCase()}</span>}
          <div>
            <strong>{website.businessName}</strong>
            <span>{tenant.country} · {tenant.currency}</span>
          </div>
        </div>
        <button className="tenant-public-menu-button" type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-label="Toggle website menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className={menuOpen ? "tenant-public-links open" : "tenant-public-links"}>
          {navItems.map((item) => <a href={item.href} key={item.key} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
        </div>
      </nav>

      <section
        className={website.heroBackgroundImageUrl ? "tenant-public-hero image-hero" : "tenant-public-hero"}
        style={website.heroBackgroundImageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(20, 12, 6, 0.68), rgba(20, 12, 6, 0.28)), url(${website.heroBackgroundImageUrl})` } : undefined}
      >
        <div>
          <p className="eyebrow">{tenant.country} · {tenant.currency}</p>
          <h1>{website.businessName}</h1>
          <p>
            {website.tagline || "Products, bookings, services, and customer updates from one trusted business profile."}
          </p>
          {website.heroButtonLabel && website.heroButtonUrl ? (
            <div className="hero-actions">
              <a className="primary-button" href={websiteLinkHref(website.heroButtonUrl)} target={isExternalLink(website.heroButtonUrl) ? "_blank" : undefined} rel={isExternalLink(website.heroButtonUrl) ? "noreferrer" : undefined}>
                {website.heroButtonLabel}
              </a>
            </div>
          ) : null}
          {heroSocialLinks.length ? (
            <div className="hero-socials" aria-label="Business social links">
              {heroSocialLinks.map((link) => (
                <HeroSocialLink href={link.href} icon={link.icon} label={link.label} key={link.label} />
              ))}
            </div>
          ) : null}
        </div>
        {!website.heroBackgroundImageUrl ? (
          <div className="tenant-public-summary">
            <span className="service-icon">
              <Store size={24} />
            </span>
            <strong>{publicModules.length || "No"} public modules</strong>
            <p>{website.about || (publicModules.length ? "This business is ready to publish selected services and updates." : "Business information is being prepared.")}</p>
          </div>
        ) : null}
      </section>

      {defaultSections.length ? (
        <WebsiteSectionGroup label={hasDefaultProductSections ? "Products" : "Highlights"} slug="website-content" sections={defaultSections} whatsappHref={whatsappHref} publicPageUrl={publicPageUrl} />
      ) : null}

      {activeMenus.map((menu) => {
        const sections = contentSections.filter((section) => section.menuId === menu.id);
        return sections.length ? (
          <WebsiteSectionGroup label={menu.label} slug={menu.slug} sections={sections} whatsappHref={whatsappHref} publicPageUrl={publicPageUrl} key={menu.id} />
        ) : null;
      })}

      {website.showModules ? <section className="tenant-public-band" id="services">
        <div className="section-heading">
          <p className="eyebrow">Business modules</p>
          <h2>What {website.businessName} can publish</h2>
          <p>Explore the services and digital tools available for this business.</p>
        </div>
        <div className="service-grid">
          {publicModules.length ? (
            publicModules.map((module) => (
              <article className="service-card" key={module.code}>
                <span className="service-icon">{renderIcon(module, 22)}</span>
                <strong>{module.name}</strong>
                <span>{module.description}</span>
              </article>
            ))
          ) : (
            <EmptyState text="No public modules are enabled yet." />
          )}
        </div>
      </section> : null}

      <section className="tenant-public-contact" id="contact">
        <div
          className="tenant-public-contact-inner"
          style={website.footerBackgroundImageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(20, 17, 15, 0.74), rgba(20, 17, 15, 0.42)), url(${website.footerBackgroundImageUrl})` } : undefined}
        >
          <p className="eyebrow">Contact</p>
          <h2>Contact {website.businessName}</h2>
          <p>{website.address || "Contact details, social links, location, and business information will be published here."}</p>
          <div className="contact-socials">
            {website.phone ? <ContactLink href={`tel:${website.phone}`} icon={<Phone size={18} />} label={website.phone} /> : null}
            {website.email ? <ContactLink href={`mailto:${website.email}`} icon={<Mail size={18} />} label={website.email} /> : null}
            {whatsappHref ? <ContactLink href={whatsappHref} icon={<MessageCircle size={18} />} label="WhatsApp" external /> : null}
            {website.youtubeUrl ? <ContactLink href={socialHref(website.youtubeUrl)} icon={<Youtube size={18} />} label="YouTube" external /> : null}
            {website.facebookUrl ? <ContactLink href={socialHref(website.facebookUrl)} icon={<Facebook size={18} />} label="Facebook" external /> : null}
            {website.instagramUrl ? <ContactLink href={socialHref(website.instagramUrl)} icon={<Instagram size={18} />} label="Instagram" external /> : null}
            {website.linkedinUrl ? <ContactLink href={socialHref(website.linkedinUrl)} icon={<Linkedin size={18} />} label="LinkedIn" external /> : null}
            {website.tiktokUrl ? <ContactLink href={socialHref(website.tiktokUrl)} icon={<Music2 size={18} />} label="TikTok" external /> : null}
          </div>
        </div>
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

function WebsiteSectionGroup({ label, slug, sections, whatsappHref, publicPageUrl }: { label: string; slug: string; sections: WebsiteSection[]; whatsappHref: string; publicPageUrl: string }) {
  return (
    <section className="tenant-public-band" id={slug}>
      <div className="stack">
        {sections.map((section) => (
          <article
            className={websiteSectionClass(section)}
            key={section.id}
            style={section.type !== "hero" && section.type !== "image_text" && section.imageUrl ? { backgroundImage: section.type === "products" ? `linear-gradient(90deg, rgba(245, 240, 236, 0.94), rgba(245, 240, 236, 0.82)), url(${section.imageUrl})` : `linear-gradient(90deg, rgba(20, 12, 6, 0.62), rgba(20, 12, 6, 0.34)), url(${section.imageUrl})` } : undefined}
          >
            <div>
              {section.heading ? <h2>{section.heading}</h2> : null}
              {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
              {section.content ? <p>{section.content}</p> : null}
              {section.buttons.length ? (
                <div className="hero-actions">
                  {section.buttons.map((button) => (
                    <a className="secondary-button" href={button.url} key={`${section.id}-${button.label}`} target={button.url.startsWith("http") ? "_blank" : undefined} rel={button.url.startsWith("http") ? "noreferrer" : undefined}>
                      {button.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            {section.imageUrl && section.type === "image_text" ? <img className="website-section-image" src={section.imageUrl} alt={section.heading || label} /> : null}
            {section.type === "products" ? (
              <div className="product-showcase-wrap">
                <div className="product-slider-wrapper">
                  <button
                    className="slider-arrow left"
                    onClick={() =>
                      document
                        .querySelector(".product-slider")
                        ?.scrollBy({ left: -300, behavior: "smooth" })
                    }
                  >
                    ❮
                  </button>
                  <div className="product-slider">
                    {section.products.filter((product) => product.isActive).map((product) => {
                      const productLink = `${publicPageUrl}#${productAnchorId(product.id)}`;
                      const message = encodeURIComponent(`${product.whatsappMessage || `Hi, I want to order ${product.name}.`}\n\nProduct: ${product.name}${product.priceLabel ? `\nPrice: ${product.priceLabel}` : ""}\nLink: ${productLink}`);
                      const orderHref = whatsappHref ? `${whatsappHref}${whatsappHref.includes("?") ? "&" : "?"}text=${message}` : "#contact";

                      return (
                        <article className="service-card product-showcase-card" id={productAnchorId(product.id)} key={product.id}>
                          <div className="product-card-media">
                            {product.imageUrl ? <img className="product-card-image" src={product.imageUrl} alt={product.name} /> : <span>No image</span>}
                          </div>
                          <div className="product-card-body">
                            <strong>{product.name}</strong>
                            {product.priceLabel ? <span>{product.priceLabel}</span> : null}
                            {product.description ? <small>{product.description}</small> : null}
                          </div>
                          <a className="secondary-button" href={orderHref} target={whatsappHref ? "_blank" : undefined} rel={whatsappHref ? "noreferrer" : undefined}>
                            {product.orderButtonLabel || "Order on WhatsApp"}
                          </a>
                        </article>
                      );
                    })}
                  </div>
                  <button
                    className="slider-arrow right"
                    onClick={() =>
                      document
                        .querySelector(".product-slider")
                        ?.scrollBy({ left: 300, behavior: "smooth" })
                    }
                  >
                    ❯
                  </button>
                </div>
                <div className="product-view-more-wrap">
                  <a className="primary-button product-view-more" href="/all-products">
                    View more
                  </a>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function productAnchorId(productId: string) {
  return `product-${productId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function socialHref(value: string) {
  return value.startsWith("http") ? value : `https://${value}`;
}

function publicSocialLinks(website: TenantProfile["websiteSettings"], whatsappHref: string): PublicSocialLink[] {
  if (!website) {
    return [];
  }

  const links: Array<PublicSocialLink | null> = [
    whatsappHref ? { href: whatsappHref, icon: <MessageCircle size={18} />, label: "WhatsApp" } : null,
    website.youtubeUrl ? { href: socialHref(website.youtubeUrl), icon: <Youtube size={18} />, label: "YouTube" } : null,
    website.facebookUrl ? { href: socialHref(website.facebookUrl), icon: <Facebook size={18} />, label: "Facebook" } : null,
    website.instagramUrl ? { href: socialHref(website.instagramUrl), icon: <Instagram size={18} />, label: "Instagram" } : null,
    website.linkedinUrl ? { href: socialHref(website.linkedinUrl), icon: <Linkedin size={18} />, label: "LinkedIn" } : null,
    website.tiktokUrl ? { href: socialHref(website.tiktokUrl), icon: <Music2 size={18} />, label: "TikTok" } : null
  ];

  return links.filter((link): link is PublicSocialLink => Boolean(link));
}

function HeroSocialLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a className="hero-social-link" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
      {icon}
    </a>
  );
}

function ContactLink({ href, icon, label, external = false }: { href: string; icon: ReactNode; label: string; external?: boolean }) {
  return (
    <a className="social-link" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      <span className="social-icon">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

function isExternalLink(value: string) {
  return value.startsWith("http") || value.includes(".");
}

function websiteLinkHref(value: string) {
  if (value.startsWith("http")) {
    return value;
  }

  if (value.includes(".")) {
    return `https://${value}`;
  }

  return value.startsWith("/") || value.startsWith("#") ? value : `/${value}`;
}

function websiteSectionClass(section: WebsiteSection) {
  const classes = ["website-public-section", `website-public-section-${section.type}`];

  if (section.type !== "products") {
    classes.push("split");
  }

  if (section.imageUrl) {
    classes.push("has-image");
  }

  return classes.join(" ");
}

function TenantWebsiteDisabled({ tenantName, host }: { tenantName: string; host: string }) {
  return (
    <main className="tenant-public-page">
      <section className="tenant-public-empty">
        <span className="service-icon">
          <Globe2 size={24} />
        </span>
        <h1>{tenantName}</h1>
        <p>The public website is not enabled yet. Business owners can sign in to request or configure the Website module.</p>
        <div className="hero-actions">
          <a className="primary-button" href="/manage">Business Login</a>
          <a className="secondary-button" href={appConfig.websiteUrl} target="_blank" rel="noreferrer">
            View {appConfig.brandName}
          </a>
        </div>
        <small>{host}</small>
      </section>
    </main>
  );
}

function scrollProducts(event: React.MouseEvent<HTMLButtonElement>, direction: "left" | "right") {
  const carousel = event.currentTarget.parentElement?.querySelector(".product-carousel");

  carousel?.scrollBy({
    left: direction === "left" ? -320 : 320,
    behavior: "smooth"
  });
}
