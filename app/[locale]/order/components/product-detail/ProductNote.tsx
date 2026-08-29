// components/product-detail/ProductNote.tsx
"use client";

interface ProductNoteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ProductNote({
  label,
  placeholder,
  value,
  onChange,
}: ProductNoteProps) {
  return (
    <div className="modal-section" style={{ marginBottom: "32px" }}>
      <h3 style={{ marginBottom: "10px" }}>{label}</h3>
      <input
        type="text"
        className="note-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}