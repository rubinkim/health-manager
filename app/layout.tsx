import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '시니어 건강 관리',
  description: '시니어를 위한 건강 관리 및 복약 알림 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">시니어 건강 관리</h1>
          </div>
        </header>

        {/* 네비게이션 */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <ul className="space-y-2 md:space-y-0 md:flex md:gap-6">
              <li><Link href="/" className="text-blue-600 hover:underline font-medium">📊 대시보드</Link></li>
              <li><Link href="/health-records" className="text-blue-600 hover:underline font-medium">📈 건강 기록</Link></li>
              <li><Link href="/medication" className="text-blue-600 hover:underline font-medium">💊 복약 관리</Link></li>
            </ul>
          </div>
        </nav>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-600 text-sm">
            © 2026 시니어 건강 관리. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}