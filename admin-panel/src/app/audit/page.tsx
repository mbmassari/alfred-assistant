'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shell } from '@/components/shell';
import { getAuditLogs } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 25;

  const logsQuery = useQuery({
    queryKey: ['audit', actionFilter, page],
    queryFn: () =>
      getAuditLogs({
        action: actionFilter || undefined,
        limit,
        offset: page * limit,
      }),
  });

  return (
    <Shell>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          placeholder="Filtrar por ação (ex: POST /api/v1/agent/message)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ação</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Detalhe</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logsQuery.data?.logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                <td className="px-4 py-3 font-mono text-gray-900">{log.action}</td>
                <td className="px-4 py-3 text-gray-600">{log.detail || '—'}</td>
                <td className="px-4 py-3 text-gray-400 font-mono">{log.ip_address || '—'}</td>
              </tr>
            ))}
            {logsQuery.data?.logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Nenhum log encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-500">Página {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={(logsQuery.data?.count || 0) < limit}
          className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </Shell>
  );
}
