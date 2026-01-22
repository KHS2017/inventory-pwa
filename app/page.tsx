'use client';

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Row = {
  item_id: string;
  name: string;
  category: string | null;
  supplier: string | null;
  unit: string;
  threshold: number;
  note: string | null;
  current_qty: number | null;
  last_counted_at: string | null;
  needs_reorder: boolean;
};

export default function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyReorder, setOnlyReorder] = useState(false);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("v_inventory_status")
      .select("*")
      .order("supplier", { ascending: true, nullsFirst: true })
      .order("category", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      alert("재고 로드 실패 (콘솔 확인)");
      setRows([]);
    } else {
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (onlyReorder && !r.needs_reorder) return false;
      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        const hay = `${r.name} ${r.category ?? ""} ${r.supplier ?? ""}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [rows, onlyReorder, q]);

  async function saveCount(item_id: string, qtyRaw: string) {
    const qty = Number(qtyRaw);
    if (Number.isNaN(qty)) return alert("수량은 숫자로 입력하세요.");
    const { error } = await supabase.from("stock_counts").insert({ item_id, qty });
    if (error) {
      console.error(error);
      return alert("저장 실패 (콘솔 확인).");
    }
    await load();
  }

  function buildOrderText() {
    const needs = rows.filter(r => r.needs_reorder);
    const lines = [
      "발주 리스트 (자동)",
      `생성: ${new Date().toLocaleString()}`,
      "",
    ];
    const map = new Map<string, Row[]>();
    for (const r of needs) {
      const key = r.supplier ?? "미지정";
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    for (const [supplier, items] of map.entries()) {
      lines.push(`■ ${supplier}`);
      for (const it of items) {
        lines.push(`- ${it.name} : 현재 ${it.current_qty ?? 0}${it.unit} / 기준 ${it.threshold}${it.unit}${it.note ? " ("+it.note+")" : ""}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  async function copyOrder() {
    await navigator.clipboard.writeText(buildOrderText());
    alert("발주 리스트 복사 완료");
  }

  return (
    <main style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>재고/발주</div>
          <div style={{ color: "#555", fontSize: 12 }}>AA: 로그인 없이 공용 사용 · 현재수량 입력 → 자동 발주</div>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          <a href="/quick" style={linkBtn}>빠른입력</a>
          <a href="/manage" style={linkBtn}>품목관리</a>
          <button onClick={copyOrder} style={btn}>발주리스트 복사</button>
        </nav>
      </header>

      <section style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="검색 (품목/분류/업체)" style={input} />
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
          <input type="checkbox" checked={onlyReorder} onChange={e => setOnlyReorder(e.target.checked)} />
          발주필요만
        </label>
        <button onClick={load} style={btn}>새로고침</button>
      </section>

      <section style={{ marginTop: 12 }}>
        {loading ? (
          <div>로딩중…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr>
                  {["업체","분류","품목","단위","기준","현재","발주","최근","현재수량 입력"].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.item_id} style={{ background: r.needs_reorder ? "#fff2f2" : "transparent" }}>
                    <td style={td}>{r.supplier ?? "-"}</td>
                    <td style={td}>{r.category ?? "-"}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                      {r.note ? <div style={{ fontSize: 12, color: "#666" }}>{r.note}</div> : null}
                    </td>
                    <td style={td}>{r.unit}</td>
                    <td style={td}>{r.threshold}</td>
                    <td style={td}>{r.current_qty ?? "-"}</td>
                    <td style={{ ...td, fontWeight: 900 }}>{r.needs_reorder ? "발주" : "OK"}</td>
                    <td style={{ ...td, fontSize: 12, color: "#666" }}>
                      {r.last_counted_at ? new Date(r.last_counted_at).toLocaleString() : "-"}
                    </td>
                    <td style={td}>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        saveCount(r.item_id, String(fd.get("qty") ?? ""));
                        e.currentTarget.reset();
                      }}>
                        <input name="qty" inputMode="decimal" placeholder="예: 2" style={{ ...input, width: 100, marginRight: 8 }} />
                        <button type="submit" style={btnSmall}>저장</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer style={{ marginTop: 14, color: "#666", fontSize: 12 }}>
        설치: 크롬 메뉴 → “홈 화면에 추가” (PWA)
      </footer>
    </main>
  );
}

const th: React.CSSProperties = { textAlign: "left", borderBottom: "1px solid #ddd", padding: 8, fontSize: 12, color: "#444", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: 8, borderBottom: "1px solid #f0f0f0", verticalAlign: "top" };
const input: React.CSSProperties = { padding: 8, border: "1px solid #ddd", borderRadius: 8, minWidth: 220 };
const btn: React.CSSProperties = { padding: "8px 10px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", cursor: "pointer" };
const btnSmall: React.CSSProperties = { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", cursor: "pointer" };
const linkBtn: React.CSSProperties = { ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" };
// app/quick/page.tsx
export default function QuickPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>빠른입력</h1>
      <p>빠른 입력 페이지 정상 연결됨</p>
    </div>
  );
}
