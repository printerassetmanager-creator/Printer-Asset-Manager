import React from 'react';

export default function PartCatalogMenu({ items, onSelect }) {
  return (
    <div className="part-picker-menu">
      {items.length ? items.map((part) => (
        <button key={part.code} type="button" className="part-picker-option" onMouseDown={(e) => { e.preventDefault(); onSelect(part); }}>
          <span className="part-picker-name">{part.name}</span>
          <span className="part-picker-code">{part.code}</span>
          <span className="part-picker-category">{part.category}</span>
        </button>
      )) : (
        <div className="part-picker-empty">No matching part found</div>
      )}
    </div>
  );
}
