import { Package } from 'lucide-react';

export function CompactProductCard({ name, sku, price, stock, image, onClick, lowStock }: { name: string; sku: string; price: string; stock: number; image?: string; onClick?: () => void; lowStock?: boolean }) {
  return (
    <button type="button" className="compact-product-card" onClick={onClick}>
      <div className="compact-product-card__img">
        {image ? <img src={image} alt={name} /> : <Package size={16} />}
      </div>
      <div className="compact-product-card__body">
        <div className="compact-product-card__name">{name}</div>
        <div className="compact-product-card__sku">{sku}</div>
        <div className="compact-product-card__row">
          <span className="compact-product-card__price">{price}</span>
          <span className={`compact-product-card__stock ${lowStock ? 'is-low' : ''}`}>{stock}</span>
        </div>
      </div>
    </button>
  );
}
