'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-gray-100 p-4">
      <ul className="flex gap-6">
        <li><Link href="/" className="text-blue-600 hover:underline">대시보드</Link></li>
        <li><Link href="/health" className="text-blue-600 hover:underline">건강 기록</Link></li>
        <li><Link href="/medication" className="text-blue-600 hover:underline">복약 관리</Link></li>
      </ul>
    </nav>
  );
}