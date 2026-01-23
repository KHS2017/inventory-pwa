'use client';

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
};

export default function QuickPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 빌드/런타임에서 env 없을 때도 "throw"로 터뜨리지 말고 화면 안내로 처리
  if (!url || !anon) {
    return (
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 40, fontWeight: 900 }}>빠른입력</h1>
        <p>Supabase 환경변수가 설정되지 않았습니다.</p>
        <p>NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 Vercel에 등록하세요.</p>
      </div>
    );
  }

  const supabase = useMemo(() => createClient(url, anon), [url, anon]);

  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

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

      if (!mounted) return;

      if (error) {
        setError(
          `${error.message}\n(대부분 RLS 정책/권한 또는 환경변수 문제입니다. items SELECT 정책과 NEXT_PUBLIC_SUPABASE_* 확인)`
        );
        setItems([]);
      } else {
        setItems((data as ItemRow[]) ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 40, fontWeight: 900 }}>빠른입력</h1>

      {loading && <p>불러오는 중...</p>}

      {error && (
        <pre style={{ whiteSpace: 'pre-wrap', color: 'crimson' }}>
          {error}
        </pre>
      )}

      {!loading && !error && (
        <ul>
          {items.map((it) => (
            <li key={it.id} style={{ marginBottom: 8 }}>
              <b>{it.name}</b>{' '}
              {it.unit ? `(${it.unit})` : ''}{' '}
              / 기준:{it.threshold ?? '-'} / 목표:{it.target ?? '-'}{' '}
              / 거래처:{it.suppliers?.name ?? '-'} / 분류:{it.categories?.name ?? '-'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
