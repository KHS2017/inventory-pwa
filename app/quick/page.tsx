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

  // Supabase 관계 select 결과가 배열로 오는 케이스 대응
  suppliers?: { name: string }[] | null;
  categories?: { name: string }[] | null;
};

export default function QuickPage() {
  // Vercel 환경변수
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // env가 없으면 throw로 빌드/런타임을 깨지 않고, 화면에 안내만 표시
  if (!url || !anon) {
    return (
      <main style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>빠른입력</h1>
        <p style={{ marginTop: 10 }}>
          Supabase 환경변수가 설정되지 않았습니다.
        </p>
        <pre style={{ whiteSpace: 'pre-wrap', padding: 12, background: '#f7f7f7', borderRadius: 12 }}>
{`Vercel → Project → Settings → Environment Variables 에 아래 2개를 추가하세요.
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY`}
        </pre>
      </main>
    );
  }

  // Supabase 클라이언트 생성
  const supabase = useMemo(() => createClient(url, anon), [url, anon]);

  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErr(null);

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
        setErr(
          `${error.message}\n\n가능한 원인:\n- (RLS 켜짐) items/suppliers/categories SELECT 정책이 없음\n- Supabase 프로젝트/키가 다른 프로젝트 것임\n- 테이블/관계 이름이 다름(특히 suppliers, categories)`
        );
        setItems([]);
      } else {
        // Supabase 응답 타입이 엄격히 매칭되지 않는 경우가 있어 unknown 경유 캐스팅
        setItems(((data ?? []) as unknown) as ItemRow[]);
      }

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>빠른입력</h1>

      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => location.reload()}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #ddd',
            background: '#fff',
            fontWeight: 800,
          }}
          disabled={loading}
        >
          {loading ? '불러오는 중…' : '새로고침'}
        </button>

        <div style={{ color: '#666' }}>
          {loading ? '로딩 중' : `총 ${items.length}개`}
        </div>
      </div>

      {err && (
        <pre
          style={{
            marginTop: 12,
            whiteSpace: 'pre-wrap',
            padding: 12,
            borderRadius: 12,
            background: '#fff3f3',
            border: '1px solid #ffd0d0',
            color: '#a40000',
          }}
        >
          {err}
        </pre>
      )}

      {!loading && !err && (
        <div style={{ marginTop: 14, border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#fafafa', padding: '10px 12px', fontWeight: 800, color: '#555' }}>
            품목 목록
          </div>

          {items.length === 0 ? (
            <div style={{ padding: 12, color: '#777' }}>
              items가 0개입니다. (Supabase에 품목 데이터가 있는지 확인)
            </div>
          ) : (
            <div>
              {items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    padding: 12,
                    borderTop: '1px solid #f1f1f1',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 0.8fr 0.8fr',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                      {it.name}{' '}
                      <span style={{ fontWeight: 700, color: '#666', fontSize: 13 }}>
                        {it.unit ? `(${it.unit})` : ''}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                      거래처: {it.suppliers?.[0]?.name ?? '-'} / 분류: {it.categories?.[0]?.name ?? '-'}
                    </div>
                    <div style={{ marginTop: 2, color: '#666', fontSize: 13 }}>
                      기준: {it.threshold ?? '-'} / 목표: {it.target ?? '-'} / 활성: {it.is_active === false ? 'N' : 'Y'}
                    </div>
                    {it.note ? (
                      <div style={{ marginTop: 2, color: '#777', fontSize: 13 }}>
                        비고: {it.note}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ color: '#555', fontSize: 13 }}>
                    created: {it.created_at ? it.created_at.slice(0, 10) : '-'}
                  </div>

                  <div style={{ color: '#555', fontSize: 13 }}>
                    updated: {it.updated_at ? it.updated_at.slice(0, 10) : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
