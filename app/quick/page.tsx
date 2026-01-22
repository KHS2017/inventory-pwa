'use client'

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type ItemRow = {
  id: string;
  name: string;
  unit: string | null;
  threshold: number | null;
  target: number | null;
  note: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  suppliers?: { name: string } | null;
  categories?: { name: string } | null;

  const supabase = useMemo(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error('Supabase env vars are missing');
  }

  return createClient(url, anon);
}, []);

  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    // items + FK로 연결된 suppliers / categories 이름까지 같이 가져옵니다.
    const { data, error } = await supabase
      .from('items')
      .select(
        `
        id,
        name,
        unit,
        threshold,
        target,
        note,
        is_active,
        created_at,
        updated_at,
        suppliers ( name ),
        categories ( name )
      `
      )
      .order('name', { ascending: true });

    if (error) {
      setError(
        `${error.message}\n(대부분 RLS 정책/환경변수 문제입니다. items SELECT 권한과 NEXT_PUBLIC_SUPABASE_* 확인)`
      );
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data as ItemRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 42, margin: '0 0 10px 0' }}>빠른입력</h1>
      <div style={{ marginBottom: 12, color: '#555' }}>
        /quick에서 items 불러오기 (목록이 보이면 성공)
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button
          onClick={() => void load()}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #ddd',
            background: '#fff',
            fontWeight: 700,
          }}
          disabled={loading}
        >
          {loading ? '불러오는 중…' : '새로고침'}
        </button>

        <div style={{ color: '#666' }}>
          {loading ? '로딩 중' : `총 ${items.length}개`}
        </div>
      </div>

      {error && (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            padding: 12,
            borderRadius: 12,
            background: '#fff3f3',
            border: '1px solid #ffd0d0',
            color: '#a40000',
            marginBottom: 12,
          }}
        >
          {error}
        </pre>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={th}>업체</th>
              <th style={th}>분류</th>
              <th style={th}>품목</th>
              <th style={th}>단위</th>
              <th style={th}>기준</th>
              <th style={th}>목표</th>
              <th style={th}>비고</th>
              <th style={th}>활성</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && !error && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: '#777' }}>
                  items가 0개입니다. (seed가 제대로 들어갔는지 / RLS로 막혀있는지 확인)
                </td>
              </tr>
            )}

            {items.map((it) => (
              <tr key={it.id}>
                <td style={td}>{it.suppliers?.name ?? '-'}</td>
                <td style={td}>{it.categories?.name ?? '-'}</td>
                <td style={{ ...td, fontWeight: 800 }}>{it.name}</td>
                <td style={td}>{it.unit ?? '-'}</td>
                <td style={td}>{it.threshold ?? '-'}</td>
                <td style={td}>{it.target ?? '-'}</td>
                <td style={td}>{it.note ?? '-'}</td>
                <td style={td}>{it.is_active === false ? 'N' : 'Y'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, color: '#777', fontSize: 12, lineHeight: 1.4 }}>
        환경변수 필요:
        <br />
        - NEXT_PUBLIC_SUPABASE_URL
        <br />
        - NEXT_PUBLIC_SUPABASE_ANON_KEY
        <br />
        그리고 Supabase RLS가 켜져있으면 items/suppliers/categories에 대해 SELECT 정책이 있어야 목록이 보입니다.
      </div>
    </main>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
  fontSize: 13,
  color: '#666',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #f1f1f1',
  fontSize: 14,
  whiteSpace: 'nowrap',
};
