'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '⌂' },
  { href: '/secrets', label: 'Secrets', icon: '🔑' },
  { href: '/audit', label: 'Audit Log', icon: '📋' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Alfred</h1>
        <p className="text-xs text-gray-500">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => {
          localStorage.removeItem('alfred_token');
          window.location.href = '/login';
        }}
        className="mt-auto text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
      >
        Sair
      </button>
    </aside>
  );
}
