import { useEffect, useState } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { ModuleHeader } from "../../components/layout/ModuleHeader";
import { deleteProduct, fetchProducts, type ProductRow } from "../../lib/crm";
import { ProductFormModal } from "./ProductFormModal";
import "./Catalog.css";

export function Catalog() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(product: ProductRow) {
    if (!confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;
    await deleteProduct(product.id);
    load();
  }

  return (
    <section>
      <ModuleHeader
        title="Catálogo"
        subtitle="Productos y servicios que el equipo comercial puede ofrecer"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={13} strokeWidth={2} /> Nuevo producto
          </button>
        }
      />

      {loading ? (
        <p className="osint-empty">Cargando catálogo...</p>
      ) : products.length === 0 ? (
        <p className="osint-empty">Aún no hay productos ni servicios registrados.</p>
      ) : (
        <div className="catalog-grid">
          {products.map((product) => (
            <div className="catalog-card panel" key={product.id}>
              <div className="catalog-card__icon">
                <Package size={18} strokeWidth={1.75} />
              </div>
              <div className="catalog-card__info">
                <div className="catalog-card__title">
                  <strong>{product.name}</strong>
                  <span className={`catalog-card__status is-${product.status}`}>
                    {product.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>
                {product.category && <span className="catalog-card__category">{product.category}</span>}
                <p>{product.description ?? "Sin descripción"}</p>
                {product.price != null && <span className="catalog-card__price">S/ {product.price}</span>}
              </div>
              <div className="catalog-card__actions">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(product)}>
                  <Pencil size={12} strokeWidth={2} />
                </button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => handleDelete(product)}>
                  <Trash2 size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <ProductFormModal
          product={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <ProductFormModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </section>
  );
}
