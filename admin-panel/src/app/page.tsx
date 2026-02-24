'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Shell } from '@/components/shell';
import { getHealth, getAgentStatus, sendMessage } from '@/lib/api';

export default function DashboardPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);

  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth, refetchInterval: 30_000 });
  const statusQuery = useQuery({ queryKey: ['agent-status'], queryFn: getAgentStatus, refetchInterval: 30_000 });

  const messageMutation = useMutation({
    mutationFn: (msg: string) => sendMessage(msg),
    onSuccess: (data: Record<string, unknown>) => {
      const text = typeof data.response === 'string' ? data.response : JSON.stringify(data, null, 2);
      setResponse(text);
      setMessage('');
    },
    onError: (err) => {
      setResponse(`Erro: ${err.message}`);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      messageMutation.mutate(message.trim());
    }
  };

  return (
    <Shell>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusCard
          title="Gateway"
          status={healthQuery.data?.gateway || 'loading...'}
          ok={healthQuery.data?.gateway === 'running'}
        />
        <StatusCard
          title="Nanobot"
          status={statusQuery.data?.status || healthQuery.data?.nanobot || 'loading...'}
          ok={statusQuery.data?.status === 'online' || healthQuery.data?.nanobot === 'connected'}
        />
        <StatusCard
          title="Conexão"
          status={healthQuery.isError ? 'erro' : 'ok'}
          ok={!healthQuery.isError}
        />
      </div>

      {/* Quick message */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mensagem rápida</h3>
        <form onSubmit={handleSend} className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Envie uma mensagem para o Alfred..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            disabled={messageMutation.isPending || !message.trim()}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {messageMutation.isPending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>

        {response && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm whitespace-pre-wrap border border-gray-200">
            {response}
          </div>
        )}
      </div>
    </Shell>
  );
}

function StatusCard({ title, status, ok }: { title: string; status: string; ok: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium text-gray-900 capitalize">{status}</span>
      </div>
    </div>
  );
}
