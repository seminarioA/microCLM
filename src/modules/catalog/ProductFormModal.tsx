import { useState } from "react";
import { X } from "lucide-react";
import { createProduct, updateProduct, type ProductRow } from "../../lib/crm";
import "../profile/EditProfileModal.css";

interface ProductFormModalProps {
  product: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [status, setStatus] = useState(product?.status ?? "active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        price: price.trim() ? Number(price) : null,
        status,
      };
      if (product) {
        await updateProduct(product.id, input);
      } else {
        await createProduct(input);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-card__header">
          <h3>{product ? "Editar producto/servicio" : "Nuevo producto/servicio"}</h3>
          <button type="button" className="modal-card__close" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="product-name">Nombre</label>
          <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="product-description">Descripción</label>
          <textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="product-category">Categoría / rubro</label>
          <input id="product-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div className="form-group">
          <label htmlFor="product-price">Precio (S/)</label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="product-status">Estado</label>
          <select id="product-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        {error && <span className="field-error">{error}</span>}

        <div className="modal-card__actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
