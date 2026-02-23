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

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
}

interface SecretWithFields extends Secret {
  fields_config?: FieldConfig[];
}

function parseFieldsConfig(masked_value: string | null): Record<string, string> {
  if (!masked_value) return {};
  try {
    return JSON.parse(masked_value);
  } catch {
    return { valor: masked_value };
  }
}

function parseSecretValue(value: string | null): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.fields && parsed.fields_config) {
        return parsed.fields;
      }
      return parsed;
    }
    return { valor: value };
  } catch {
    return { valor: value };
  }
}

function getDisplayValue(secret: Secret): string {
  const data = parseFieldsConfig(secret.masked_value);
  const keys = Object.keys(data);
  if (keys.length === 0) return '';
  if (keys.length === 1) {
    const v = data[keys[0]];
    if (v && v.length > 12) return `${v.substring(0, 6)}...${v.substring(v.length - 4)}`;
    return v || '';
  }
  return keys.map(k => {
    const v = data[k];
    if (v && v.length > 8) return `${k}: ${v.substring(0, 4)}...`;
    return `${k}: ${v}`;
  }).join(' | ');
}

function inferFieldType(fieldName: string): 'text' | 'password' {
  const lower = fieldName.toLowerCase();
  if (lower.includes('pass') || lower.includes('secret') || lower.includes('token') || lower.includes('key')) {
    return 'password';
  }
  return 'text';
}

export default function SecretsPage() {
  const queryClient = useQueryClient();
  const secretsQuery = useQuery({ queryKey: ['secrets'], queryFn: () => getSecrets() });

  const [editingName, setEditingName] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newSecret, setNewSecret] = useState({
    display_name: '',
    category: 'custom',
    fields: [{ name: 'valor', label: 'Valor', type: 'password' as 'text' | 'password', placeholder: '' }],
  });
  const [newFieldValues, setNewFieldValues] = useState<Record<string, string>>({});

  const updateMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      updateSecret(name, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setEditingName(null);
      setEditFields({});
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; display_name: string; category: string; value: string }) =>
      createSecret({
        name: data.name,
        display_name: data.display_name,
        category: data.category,
        secret_type: 'custom',
        value: data.value,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secrets'] });
      setShowAddModal(false);
      setNewSecret({
        display_name: '',
        category: 'custom',
        fields: [{ name: 'valor', label: 'Valor', type: 'password', placeholder: '' }],
      });
      setNewFieldValues({});
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
    const currentValue = secret.masked_value ? parseFieldsConfig(secret.masked_value) : {};
    setEditFields(currentValue);
  };

  const saveEdit = (secret: Secret) => {
    const hasValue = Object.values(editFields).some(v => v?.trim());
    if (hasValue) {
      const value = JSON.stringify(editFields);
      updateMutation.mutate({ name: secret.name, value });
    }
  };

  const addFieldToNewSecret = () => {
    const fieldName = `campo_${newSecret.fields.length + 1}`;
    setNewSecret({
      ...newSecret,
      fields: [...newSecret.fields, { name: fieldName, label: fieldName, type: 'text', placeholder: '' }],
    });
  };

  const updateNewSecretField = (index: number, updates: Partial<FieldConfig>) => {
    const newFields = [...newSecret.fields];
    const oldName = newFields[index].name;
    const newName = updates.name || oldName;
    
    newFields[index] = { ...newFields[index], ...updates };
    
    if (updates.name && oldName !== newName) {
      const newValues = { ...newFieldValues };
      newValues[newName] = newValues[oldName] || '';
      delete newValues[oldName];
      setNewFieldValues(newValues);
    }
    
    setNewSecret({ ...newSecret, fields: newFields });
  };

  const removeNewSecretField = (index: number) => {
    if (newSecret.fields.length > 1) {
      const fieldName = newSecret.fields[index].name;
      const newValues = { ...newFieldValues };
      delete newValues[fieldName];
      setNewFieldValues(newValues);
      setNewSecret({
        ...newSecret,
        fields: newSecret.fields.filter((_, i) => i !== index),
      });
    }
  };

  const handleCreate = () => {
    const name = newSecret.display_name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const hasValue = Object.values(newFieldValues).some(v => v?.trim());
    
    if (name && newSecret.display_name && hasValue) {
      createMutation.mutate({
        name,
        display_name: newSecret.display_name,
        category: newSecret.category,
        value: JSON.stringify(newFieldValues),
      });
    }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credenciais</h2>
          <p className="text-sm text-gray-500 mt-1">APIs, senhas e configurações do Alfred</p>
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
                const isEditing = editingName === secret.name;
                const existingFields = secret.masked_value ? Object.keys(parseFieldsConfig(secret.masked_value)) : ['valor'];

                return (
                  <div
                    key={secret.name}
                    className={`bg-white rounded-lg border p-4 ${
                      secret.is_configured ? 'border-gray-200' : 'border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <p className="font-medium text-gray-900">{secret.display_name}</p>
                        
                        {existingFields.map((fieldName) => (
                          <div key={fieldName} className="flex gap-2 items-center">
                            <span className="text-sm text-gray-600 w-24 truncate">{fieldName}:</span>
                            <input
                              type={inferFieldType(fieldName)}
                              value={editFields[fieldName] || ''}
                              onChange={(e) => setEditFields({ ...editFields, [fieldName]: e.target.value })}
                              className="flex-1 px-3 py-2 border rounded-lg text-sm"
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
                            onClick={() => { setEditingName(null); setEditFields({}); }}
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
                            <p className="font-medium text-gray-900">{secret.display_name}</p>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Nova Credencial</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={newSecret.display_name}
                  onChange={(e) => setNewSecret({ ...newSecret, display_name: e.target.value })}
                  placeholder="Ex: Email do Alfred"
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Campos</label>
                  <button
                    onClick={addFieldToNewSecret}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    + Adicionar campo
                  </button>
                </div>
                
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                  {newSecret.fields.map((field, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateNewSecretField(index, { name: e.target.value, label: e.target.value })}
                          placeholder="Nome do campo"
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateNewSecretField(index, { type: e.target.value as 'text' | 'password' })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="text">Texto</option>
                          <option value="password">Senha</option>
                        </select>
                        {newSecret.fields.length > 1 && (
                          <button
                            onClick={() => removeNewSecretField(index)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <input
                        type={field.type}
                        value={newFieldValues[field.name] || ''}
                        onChange={(e) => setNewFieldValues({ ...newFieldValues, [field.name]: e.target.value })}
                        placeholder={`Valor para ${field.name}`}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
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
