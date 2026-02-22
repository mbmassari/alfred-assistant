'use client';

import { useState, useEffect } from 'react';
import { Shell } from '@/components/shell';

export default function SettingsPage() {
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGatewayUrl(process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000');
  }, []);

  const handleRotateToken = () => {
    if (confirm('Tem certeza? Isso vai desconectar esta sessão. Você precisará do novo token para acessar novamente.')) {
      localStorage.removeItem('alfred_token');
      window.location.href = '/login';
    }
  };

  return (
    <Shell>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      <div className="max-w-lg space-y-8">
        {/* Gateway URL */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gateway</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Gateway</label>
              <input
                type="url"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">
                Configurado via variável de ambiente NEXT_PUBLIC_GATEWAY_URL
              </p>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Segurança</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Para rotacionar o token de acesso, execute no servidor:
              </p>
              <code className="block bg-gray-50 px-3 py-2 rounded text-sm font-mono text-gray-700">
                make rotate-token
              </code>
            </div>
            <button
              onClick={handleRotateToken}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
            >
              Desconectar sessão
            </button>
          </div>
        </section>

        {/* Info */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sobre</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Versão</dt>
              <dd className="text-gray-900">0.1.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Stack</dt>
              <dd className="text-gray-900">Nanobot + FastAPI + Next.js</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">LLM Provider</dt>
              <dd className="text-gray-900">OpenRouter</dd>
            </div>
          </dl>
        </section>
      </div>
    </Shell>
  );
}
