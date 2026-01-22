"use client";

import { useState } from "react";

export default function ManagePage() {
  const [items, setItems] = useState<any[]>([]);
  const [supplier, setSupplier] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [threshold, setThreshold] = useState("");

  const addItem = () => {
    if (!name) return;

    setItems([
      ...items,
      { supplier, name, unit, threshold }
    ]);

    setName("");
    setUnit("");
    setThreshold("");
  };

  return (
    <main style={{ padding: 16 }}>
      <h1>품목관리</h1>

      <input placeholder="업체명" value={supplier} onChange={e=>setSupplier(e.target.value)} /><br/>
      <input placeholder="품목명" value={name} onChange={e=>setName(e.target.value)} /><br/>
      <input placeholder="단위" value={unit} onChange={e=>setUnit(e.target.value)} /><br/>
      <input placeholder="기준수량" value={threshold} onChange={e=>setThreshold(e.target.value)} /><br/>

      <button onClick={addItem}>추가</button>

      <hr/>

      {items.map((it, i) => (
        <div key={i}>
          ■ {it.supplier} / {it.name} / {it.threshold}{it.unit}
        </div>
      ))}
    </main>
  );
}
