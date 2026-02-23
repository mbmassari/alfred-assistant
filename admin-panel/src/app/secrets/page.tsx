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

const SECRET_TYPES = {
  api_key: { label: 'API Key', icon: '🔑', fields: [{ name: 'value', label: 'Chave', placeholder: 'sk-...' }] },
  token: { label: 'Token', icon: '🎫', fields: [{ name: 'value', label: 'Token', placeholder: 'Token de acesso' }] },
  password: { label: 'Senha', icon: '🔒', fields: [{ name: 'value', label: 'Senha', placeholder: '••••••••' }] },
  variable: { label: 'Variável', icon: '📝', fields: [{ name: 'value', label: 'Valor', placeholder: 'Valor livre' }] },
  login_password: { label: 'Login e Senha', icon: '👤', fields: [{ name: 'username', label: 'Usuário/Email', placeholder: 'usuario@email.com' }, { name: 'password', label: 'Senha', placeholder: '••••••••' }] },
  email_smtp: { label: 'Email SMTP', icon: '📧', fields: [{ name: 'email', label: 'Email', placeholder: 'alfred@gmail.com' }, { name: 'password', label: 'Senha de App', placeholder: 'xxxx xxxx xxxx xxxx' }] },
  oauth: { label: 'OAuth', icon: '🔐', fields: [{ name: 'client_id', label: 'Client ID', placeholder: '...' }, { name: 'client_secret', label: 'Client Secret', placeholder: '...' }] },
  webhook: { label: 'Webhook', icon: '🪝', fields: [{ name: 'value', label: 'URL', placeholder: 'https://...' }] },
};

function parseSecretValue(value: string | null, type: string): Record<string, string> {
  if (!value) return {};
  if (['login_password', 'email_smtp', 'oauth'].includes(type)) {
    try {
      return JSON.parse(value);
    } catch {
      return { value };
    }
  }
  return { value };
}

function serializeSecretValue(data: Record<string, string>, type: string): string {
  if (['login_password', 'email_smtp', 'oauth'].includes(type)) {
    return JSON.stringify(data);
  }
  return data.value || '';
}

function getDisplayValue(secret: Secret): string {
  const data = parseSecretValue(secret.masked_value, secret.secret_type);
  if (data.username) return `${data.username}:***`;
  if (data.email) return `${data.email}`;
  if (data.client_id) return `${data.client_id?.substring(0, 8)}...`;
  return secret.masked_value || '';
}

export default function SecretsPage() {
  const queryClient = useQueryClient();
  const secretsQuery = useQuery({ queryKey: ['secrets'], queryFn: () => getSecrets() });

  const [editingName, setEditingName] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newSecret, setNewSecret] = useState({
    display_name: '',
    category: 'custom',
    secret_type: 'api_key',
    fields: {} as Record<string, string>,
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      updateSecret(name, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setEditingName(null);
      setEditData({});
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newSecret & { name: string; value: string }) =>
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
      setNewSecret({ display_name: '', category: 'custom', secret_type: 'api_key', fields: {} });
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
    setEditData({});
  };

  const saveEdit = (secret: Secret) => {
    const typeInfo = SECRET_TYPES[secret.secret_type as keyof typeof SECRET_TYPES] || SECRET_TYPES.api_key;
    const hasValue = typeInfo.fields.every(f => editData[f.name]?.trim());
    if (hasValue) {
      const value = serializeSecretValue(editData, secret.secret_type);
      updateMutation.mutate({ name: secret.name, value });
    }
  };

  const handleCreate = () => {
    const name = newSecret.display_name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const typeInfo = SECRET_TYPES[newSecret.secret_type as keyof typeof SECRET_TYPES] || SECRET_TYPES.api_key;
    const hasValue = typeInfo.fields.every(f => newSecret.fields[f.name]?.trim());
    
    if (name && newSecret.display_name && hasValue) {
      const value = serializeSecretValue(newSecret.fields, newSecret.secret_type);
      createMutation.mutate({ ...newSecret, name, value });
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
                const typeInfo = SECRET_TYPES[secret.secret_type as keyof typeof SECRET_TYPES] || SECRET_TYPES.api_key;
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
                          <span className="text-xs text-gray-400">({typeInfo.label})</span>
                        </div>
                        {typeInfo.fields.map((field) => (
                          <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                            <input
                              type={field.name.includes('password') || field.name.includes('secret') ? 'password' : 'text'}
                              value={editData[field.name] || ''}
                              onChange={(e) => setEditData({ ...editData, [field.name]: e.target.value })}
                              placeholder={field.placeholder}
                              autoFocus={field.name === typeInfo.fields[0].name}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => saveEdit(secret)}
                            disabled={updateMutation.isPending}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => { setEditingName(null); setEditData({}); }}
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
                              <span className="text-xs text-gray-400">({typeInfo.label})</span>
                            </div>
                            {secret.is_configured && (
                              <p className="text-xs text-gray-400 font-mono">{getDisplayValue(secret)}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Nova Credencial</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={newSecret.display_name}
                  onChange={(e) => setNewSecret({ ...newSecret, display_name: e.target.value })}
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
                  onChange={(e) => setNewSecret({ ...newSecret, secret_type: e.target.value, fields: {} })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {Object.entries(SECRET_TYPES).map(([key, info]) => (
                    <option key={key} value={key}>{info.icon} {info.label}</option>
                  ))}
                </select>
              </div>
              {SECRET_TYPES[newSecret.secret_type as keyof typeof SECRET_TYPES]?.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type={field.name.includes('password') || field.name.includes('secret') ? 'password' : 'text'}
                    value={newSecret.fields[field.name] || ''}
                    onChange={(e) => setNewSecret({ ...newSecret, fields: { ...newSecret.fields, [field.name]: e.target.value } })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newSecret.display_name}
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
