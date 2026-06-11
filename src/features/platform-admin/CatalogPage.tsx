import { Package, Store } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { Badge, EmptyState, Field, NoticeBanner, SectionHeader, StatusBadge, Tabs, TextAreaField, ToggleField } from "../../app/components/ui";
import { slugify } from "../../app/app-helpers";
import type { PlatformModule, PlatformProduct } from "../../app/types";

export function CatalogManager({
  products,
  modules,
  productForm,
  moduleForm,
  editingProductCode,
  editingModuleCode,
  loading,
  onProductForm,
  onModuleForm,
  onSaveProduct,
  onSaveModule,
  onEditProduct,
  onEditModule,
  onDeleteProduct,
  onDeleteModule,
  onCancelProduct,
  onCancelModule
}: {
  products: PlatformProduct[];
  modules: PlatformModule[];
  productForm: { code: string; name: string; description: string; isActive: boolean };
  moduleForm: {
    productCode: string;
    code: string;
    name: string;
    description: string;
    path: string;
    icon: string;
    monthlyPrice: string;
    annualPrice: string;
    isActive: boolean;
  };
  editingProductCode: string | null;
  editingModuleCode: string | null;
  loading: boolean;
  onProductForm: Dispatch<SetStateAction<{ code: string; name: string; description: string; isActive: boolean }>>;
  onModuleForm: Dispatch<
    SetStateAction<{
      productCode: string;
      code: string;
      name: string;
      description: string;
      path: string;
      icon: string;
      monthlyPrice: string;
      annualPrice: string;
      isActive: boolean;
    }>
  >;
  onSaveProduct: (event: FormEvent) => void;
  onSaveModule: (event: FormEvent) => void;
  onEditProduct: (product: PlatformProduct) => void;
  onEditModule: (module: PlatformModule) => void;
  onDeleteProduct: (code: string) => void;
  onDeleteModule: (code: string) => void;
  onCancelProduct: () => void;
  onCancelModule: () => void;
}) {
  const [catalogTab, setCatalogTab] = useState<"products" | "modules">("products");
  const productFormRef = useRef<HTMLFormElement | null>(null);
  const moduleFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!editingProductCode) {
      return;
    }

    setCatalogTab("products");
    window.setTimeout(() => productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }, [editingProductCode]);

  useEffect(() => {
    if (!editingModuleCode) {
      return;
    }

    setCatalogTab("modules");
    window.setTimeout(() => moduleFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }, [editingModuleCode]);

  return (
    <section className="stack">
      <Tabs
        items={[
          ["products", "Products"],
          ["modules", "Modules"]
        ]}
        active={catalogTab}
        onChange={(value) => setCatalogTab(value as "products" | "modules")}
      />

      {catalogTab === "products" ? (
        <section className="catalog-page">
          <form className={editingProductCode ? "panel form-grid edit-active-form" : "panel form-grid"} ref={productFormRef} onSubmit={onSaveProduct}>
            <SectionHeader icon={<Store size={20} />} title={editingProductCode ? "Edit Product" : "Create Product"} />
            {editingProductCode ? <NoticeBanner notice={{ kind: "info", text: `Editing product '${editingProductCode}'. Save changes or cancel to return to create mode.` }} /> : null}
            <Field label="Product code" value={productForm.code} onChange={(value) => onProductForm((current) => ({ ...current, code: slugify(value) }))} placeholder="vendorcore" />
            <Field label="Product name" value={productForm.name} onChange={(value) => onProductForm((current) => ({ ...current, name: value }))} placeholder="VendorCore Business Cloud" />
            <TextAreaField label="Description" value={productForm.description} onChange={(value) => onProductForm((current) => ({ ...current, description: value }))} />
            <ToggleField label="Active product" checked={productForm.isActive} onChange={(value) => onProductForm((current) => ({ ...current, isActive: value }))} />
            <div className="action-row wrap">
              <button className="primary-button" type="submit" disabled={loading}>
                {editingProductCode ? "Update Product" : "Create Product"}
              </button>
              {editingProductCode ? (
                <button className="secondary-button" type="button" onClick={onCancelProduct}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <CatalogProductList products={products} onEdit={onEditProduct} onDelete={onDeleteProduct} />
        </section>
      ) : null}

      {catalogTab === "modules" ? (
        <section className="catalog-page">
          <form className={editingModuleCode ? "panel form-grid edit-active-form" : "panel form-grid"} ref={moduleFormRef} onSubmit={onSaveModule}>
            <SectionHeader icon={<Package size={20} />} title={editingModuleCode ? "Edit Module" : "Create Module"} />
            {editingModuleCode ? <NoticeBanner notice={{ kind: "info", text: `Editing module '${editingModuleCode}'. Save changes or cancel to return to create mode.` }} /> : null}
            <label className="field">
              <span>Product</span>
              <select value={moduleForm.productCode} onChange={(event) => onModuleForm((current) => ({ ...current, productCode: event.target.value }))} required>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.code} value={product.code}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="two-col">
              <Field label="Module code" value={moduleForm.code} onChange={(value) => onModuleForm((current) => ({ ...current, code: slugify(value), path: current.path || `/${slugify(value)}` }))} placeholder="inventory" />
              <Field label="Path" value={moduleForm.path} onChange={(value) => onModuleForm((current) => ({ ...current, path: value }))} placeholder="/inventory" />
            </div>
            <Field label="Module name" value={moduleForm.name} onChange={(value) => onModuleForm((current) => ({ ...current, name: value }))} placeholder="Inventory" />
            <TextAreaField label="Description" value={moduleForm.description} onChange={(value) => onModuleForm((current) => ({ ...current, description: value }))} />
            <div className="two-col">
              <Field label="Icon" value={moduleForm.icon} onChange={(value) => onModuleForm((current) => ({ ...current, icon: value }))} placeholder="package" />
              <Field label="Monthly price" type="number" value={moduleForm.monthlyPrice} onChange={(value) => onModuleForm((current) => ({ ...current, monthlyPrice: value }))} />
            </div>
            <Field label="Annual price" type="number" value={moduleForm.annualPrice} onChange={(value) => onModuleForm((current) => ({ ...current, annualPrice: value }))} />
            <ToggleField label="Active module" checked={moduleForm.isActive} onChange={(value) => onModuleForm((current) => ({ ...current, isActive: value }))} />
            <div className="action-row wrap">
              <button className="primary-button" type="submit" disabled={loading || !products.length}>
                {editingModuleCode ? "Update Module" : "Create Module"}
              </button>
              {editingModuleCode ? (
                <button className="secondary-button" type="button" onClick={onCancelModule}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <CatalogModuleList modules={modules} onEdit={onEditModule} onDelete={onDeleteModule} />
        </section>
      ) : null}
    </section>
  );
}

function CatalogProductList({ products, onEdit, onDelete }: { products: PlatformProduct[]; onEdit: (product: PlatformProduct) => void; onDelete: (code: string) => void }) {
  return (
    <div className="catalog-list">
      <SectionHeader icon={<Store size={20} />} title="Products" />
      {products.length ? (
        products.map((product) => (
          <article className="catalog-row" key={product.code}>
            <div>
              <strong>{product.name}</strong>
              <span>{product.code}</span>
              <small>{product.description || "No description"}</small>
            </div>
            <Badge>{product.isActive ? "active" : "inactive"}</Badge>
            <small>{product.moduleCount} modules</small>
            <div className="action-row">
              <button className="secondary-button" type="button" onClick={() => onEdit(product)}>
                Edit
              </button>
              <button className="secondary-button danger" type="button" onClick={() => window.confirm("Delete this product?") && onDelete(product.code)}>
                Delete
              </button>
            </div>
          </article>
        ))
      ) : (
        <EmptyState text="No products created yet." />
      )}
    </div>
  );
}

function CatalogModuleList({ modules, onEdit, onDelete }: { modules: PlatformModule[]; onEdit: (module: PlatformModule) => void; onDelete: (code: string) => void }) {
  return (
    <div className="catalog-list">
      <SectionHeader icon={<Package size={20} />} title="Modules" />
      {modules.length ? (
        modules.map((module) => (
          <article className="catalog-row" key={module.code}>
            <div>
              <strong>{module.name}</strong>
              <span>{module.product} / {module.code}</span>
              <small>{module.description || "No description"}</small>
            </div>
            <Badge>{module.isActive ? "active" : "inactive"}</Badge>
            <small>{module.monthlyPrice.toLocaleString()} monthly</small>
            <div className="action-row">
              <button className="secondary-button" type="button" onClick={() => onEdit(module)}>
                Edit
              </button>
              <button className="secondary-button danger" type="button" onClick={() => window.confirm("Delete this module?") && onDelete(module.code)}>
                Delete
              </button>
            </div>
          </article>
        ))
      ) : (
        <EmptyState text="No modules created yet." />
      )}
    </div>
  );
}
