'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shell } from '@/components/shell';
import { getSecrets, updateSecret, createSecret, deleteSecret, type Secret } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const CATEGORY_INFO: Record<string, { label: string; icon: string }> = {
  llm: { label: 'Inteligência Artificial', icon: '🧠' },
  email: { label: 'Email', icon: '📧' },
  channel: { label: 'Canais', icon: '💬' },
  tool: { label: 'Ferramentas', icon: '🔧' },
  social: { label: 'Redes Sociais', icon: '📱' },
  custom: { label: 'Outros', icon: '📁' },
};

const CATEGORY_ORDER = ['llm', 'email', 'channel', 'tool', 'social', 'custom'];

const SECRET_TYPE_INFO: Record<string, { label: string; placeholder: string; icon: string }> = {
  api_key: { label: 'API Key', placeholder: 'sk-...', icon: '🔑' },
  token: { label: 'Token', placeholder: 'Token de acesso', icon: '🎫' },
  password: { label: 'Senha', placeholder: '••••••••', icon: '🔒' },
  login: { label: 'Login/Senha', placeholder: 'usuário:senha', icon: '👤' },
  variable: { label: 'Variável', placeholder: 'Valor livre', icon: '📝' },
};

export default function SecretsPage() {
  const queryClient = useQueryClient();
  const secretsQuery = useQuery({ queryKey: ['secrets'], queryFn: () => getSecrets() });

  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newSecret, setNewSecret] = useState({
    name: '',
    display_name: '',
    category: 'custom',
    secret_type: 'api_key',
    value: '',
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      updateSecret(name, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setEditingName(null);
      setEditValue('');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newSecret) =>
      createSecret({
        name: data.name,
        display_name: data.display_name,
        category: data.category,
        secret_type: data.secret_type,
        value: data.value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setShowAddModal(false);
      setNewSecret({ name: '', display_name: '', category: 'custom', secret_type: 'api_key', value: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteSecret(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setDeleteConfirm(null);
    },
  });

  const grouped = (secretsQuery.data?.secrets || []).reduce<Record<string, Secret[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  const startEdit = (secret: Secret) => {
    setEditingName(secret.name);
    setEditValue('');
    setShowPassword(false);
  };

  const saveEdit = (name: string) => {
    if (editValue.trim()) {
      updateMutation.mutate({ name, value: editValue });
    }
  };

  const handleCreate = () => {
    if (newSecret.name && newSecret.display_name && newSecret.value) {
      createMutation.mutate(newSecret);
    }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credenciais</h2>
          <p className="text-sm text-gray-500 mt-1">APIs, senhas e tokens do Alfred</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          + Adicionar
        </button>
      </div>

      {secretsQuery.isLoading && (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      )}

      {CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0).map((category) => {
        const secrets = grouped[category];
        const info = CATEGORY_INFO[category] || { label: category, icon: '📦' };
        const configured = secrets.filter(s => s.is_configured).length;

        return (
          <div key={category} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{info.icon}</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{info.label}</h3>
              </div>
              <div className="text-sm">
                <span className="text-green-600 font-medium">{configured}</span>
                <span className="text-gray-400">/{secrets.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              {secrets.map((secret) => {
                const typeInfo = SECRET_TYPE_INFO[secret.secret_type || 'api_key'] || SECRET_TYPE_INFO.api_key;
                const isEditing = editingName === secret.name;

                return (
                  <div
                    key={secret.name}
                    className={`bg-white rounded-lg border p-4 ${
                      secret.is_configured ? 'border-gray-200' : 'border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span>{typeInfo.icon}</span>
                          <p className="font-medium text-gray-900">{secret.display_name}</p>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={typeInfo.placeholder}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(secret.name)}
                            className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? '🙈' : '👁️'}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(secret.name)}
                            disabled={updateMutation.isPending || !editValue.trim()}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => { setEditingName(null); setEditValue(''); }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${secret.is_configured ? 'bg-green-500' : 'bg-amber-400'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{typeInfo.icon}</span>
                              <p className="font-medium text-gray-900">{secret.display_name}</p>
                            </div>
                            {secret.is_configured && secret.masked_value && (
                              <p className="text-xs text-gray-400 font-mono">{secret.masked_value}</p>
                            )}
                            {secret.updated_at && (
                              <p className="text-xs text-gray-400">{formatDate(secret.updated_at)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {deleteConfirm === secret.name ? (
                            <>
                              <button
                                onClick={() => deleteMutation.mutate(secret.name)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(secret)}
                                className={`px-3 py-1 rounded text-xs ${
                                  secret.is_configured
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-amber-500 text-white hover:bg-amber-600'
                                }`}
                              >
                                {secret.is_configured ? 'Alterar' : 'Configurar'}
                              </button>
                              {secret.category === 'custom' && (
                                <button
                                  onClick={() => setDeleteConfirm(secret.name)}
                                  className="px-3 py-1 bg-gray-100 text-red-600 rounded text-xs hover:bg-red-50"
                                >
                                  Excluir
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Nova Credencial</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={newSecret.display_name}
                  onChange={(e) => {
                    const name = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    setNewSecret({ ...newSecret, display_name: e.target.value, name: name || newSecret.name });
                  }}
                  placeholder="Ex: Minha API"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={newSecret.category}
                  onChange={(e) => setNewSecret({ ...newSecret, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="custom">Outros</option>
                  <option value="llm">IA</option>
                  <option value="email">Email</option>
                  <option value="channel">Canais</option>
                  <option value="tool">Ferramentas</option>
                  <option value="social">Redes Sociais</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={newSecret.secret_type}
                  onChange={(e) => setNewSecret({ ...newSecret, secret_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {Object.entries(SECRET_TYPE_INFO).map(([key, info]) => (
                    <option key={key} value={key}>{info.icon} {info.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor</label>
                <input
                  type="password"
                  value={newSecret.value}
                  onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                  placeholder={SECRET_TYPE_INFO[newSecret.secret_type]?.placeholder}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newSecret.display_name || !newSecret.value}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
