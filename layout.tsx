export const metadata = {
  title: "재고/발주",
  description: "매장 재고관리 및 발주 (로그인 없이 공용 사용)",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
