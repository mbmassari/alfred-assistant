'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shell } from '@/components/shell';
import { getSecrets, updateSecret, testSecret, type Secret } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  llm: 'LLM',
  tool: 'Ferramentas',
  channel: 'Canais',
  social: 'Social',
};

export default function SecretsPage() {
  const queryClient = useQueryClient();
  const secretsQuery = useQuery({ queryKey: ['secrets'], queryFn: () => getSecrets() });

  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editScope, setEditScope] = useState('private');
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({});

  const updateMutation = useMutation({
    mutationFn: ({ name, value, scope }: { name: string; value: string; scope: string }) =>
      updateSecret(name, { value, scope }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setEditing(null);
      setEditValue('');
    },
  });

  const testMutation = useMutation({
    mutationFn: (name: string) => testSecret(name),
    onSuccess: (data) => {
      setTestResult((prev) => ({ ...prev, [data.name]: data.is_configured }));
    },
  });

  // Group secrets by category
  const grouped = (secretsQuery.data?.secrets || []).reduce<Record<string, Secret[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  const startEdit = (secret: Secret) => {
    setEditing(secret.name);
    setEditValue('');
    setEditScope(secret.scope);
  };

  const saveEdit = (name: string) => {
    if (editValue.trim()) {
      updateMutation.mutate({ name, value: editValue, scope: editScope });
    }
  };

  return (
    <Shell>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Secrets</h2>

      {secretsQuery.isLoading && <p className="text-gray-500">Carregando...</p>}

      {Object.entries(grouped).map(([category, secrets]) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            {CATEGORY_LABELS[category] || category}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secrets.map((secret) => (
              <div key={secret.name} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{secret.display_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{secret.env_var}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      secret.scope === 'common'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {secret.scope === 'common' ? 'Comum' : 'Privado'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`w-2 h-2 rounded-full ${secret.is_configured ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  <span className="text-sm text-gray-600">
                    {secret.is_configured ? 'Configurado' : 'Não configurado'}
                  </span>
                  {secret.masked_value && (
                    <span className="text-xs text-gray-400 font-mono">{secret.masked_value}</span>
                  )}
                </div>

                {editing === secret.name ? (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Novo valor"
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                    <select
                      value={editScope}
                      onChange={(e) => setEditScope(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="private">Privado</option>
                      <option value="common">Comum</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(secret.name)}
                        disabled={updateMutation.isPending}
                        className="px-3 py-1 bg-gray-900 text-white rounded text-xs"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(secret)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                    >
                      {secret.is_configured ? 'Editar' : 'Configurar'}
                    </button>
                    {secret.is_configured && (
                      <button
                        onClick={() => testMutation.mutate(secret.name)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                      >
                        {testResult[secret.name] === true
                          ? 'OK'
                          : testResult[secret.name] === false
                            ? 'Falhou'
                            : 'Testar'}
                      </button>
                    )}
                  </div>
                )}

                {secret.updated_at && (
                  <p className="text-xs text-gray-400 mt-2">Atualizado: {formatDate(secret.updated_at)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Shell>
  );
}
