import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { AlertCircle, Building2, Check, Loader2 } from 'lucide-react';

const CompanySelectionScreen = () => {
  const { companies, selectCompanyAndUnit, loading } = useAuth();
  const { translations = {} } = useTranslation();
  
  // ✅ Função de tradução melhorada com fallbacks
  const t = useCallback((key) => {
    if (!key) return '';
    
    // Tentar encontrar a tradução
    if (translations[key]) return translations[key];
    
    // Fallbacks em português para campos conhecidos
    const fallbacks = {
      'empresa.selecionar_local': 'Selecione o Local',
      'empresa.escolher_empresa_unidade': 'Escolha a empresa e unidade para continuar',
      'empresa.empresa': 'Empresa',
      'empresa.unidade': 'Unidade',
      'empresa.selecione_empresa': 'Selecione uma empresa...',
      'empresa.selecione_unidade': 'Selecione uma unidade...',
      'empresa.continuar': 'Continuar',
      'empresa.selecionando': 'Selecionando...',
      'empresa.erro_selecionar_empresa': 'Selecione uma empresa',
      'empresa.erro_selecionar_unidade': 'Selecione uma unidade',
      'erro.geral': 'Ocorreu um erro. Tente novamente.'
    };
    
    return fallbacks[key] || key;
  }, [translations]);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [errors, setErrors] = useState({});
  const [autoRedirected, setAutoRedirected] = useState(false);

  const selectedCompanyData = companies.find(c => c.id === parseInt(selectedCompanyId));
  const availableUnits = selectedCompanyData?.units || [];

  useEffect(() => {
    if (
      companies.length === 1 &&
      companies[0].units &&
      companies[0].units.length === 1 &&
      !autoRedirected
    ) {
      const companyId = companies[0].id;
      const unitId = companies[0].units[0].id;
      setSelectedCompanyId(companyId);
      setSelectedUnitId(unitId);
      setAutoRedirected(true);
      selectCompanyAndUnit(companyId, unitId);
    }
  }, [companies, autoRedirected, selectCompanyAndUnit]);

  const handleCompanyChange = (e) => {
    setSelectedCompanyId(e.target.value);
    setSelectedUnitId('');
    if (errors.company) setErrors(prev => ({ ...prev, company: '' }));
  };

  const handleUnitChange = (e) => {
    setSelectedUnitId(e.target.value);
    if (errors.unit) setErrors(prev => ({ ...prev, unit: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedCompanyId) newErrors.company = t('empresa.erro_selecionar_empresa');
    if (!selectedUnitId) newErrors.unit = t('empresa.erro_selecionar_unidade');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await selectCompanyAndUnit(selectedCompanyId, selectedUnitId);
    } catch (error) {
      setErrors({ general: error.message || t('erro.geral') });
    }
  };

  const showSelectors = !(companies.length === 1 && companies[0].units.length === 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('empresa.selecionar_local')}
          </h1>
          <p className="text-gray-600">
            {t('empresa.escolher_empresa_unidade')}
          </p>
        </div>

        {showSelectors && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  {t('empresa.empresa')}
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={handleCompanyChange}
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.company ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{t('empresa.selecione_empresa')}</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.description || c.nome || `Empresa ${c.id}`}
                    </option>
                  ))}
                </select>
                {errors.company && (
                  <p className="text-sm text-red-600">{errors.company}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  {t('empresa.unidade')}
                </label>
                <select
                  value={selectedUnitId}
                  onChange={handleUnitChange}
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.unit ? 'border-red-500' : 'border-gray-300'
                  } ${!selectedCompanyId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={!selectedCompanyId}
                >
                  <option value="">{t('empresa.selecione_unidade')}</option>
                  {availableUnits.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.description || u.nome || `Unidade ${u.id}`}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="text-sm text-red-600">{errors.unit}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedCompanyId || !selectedUnitId}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>{t('empresa.selecionando')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Check className="h-5 w-5" />
                    <span>{t('empresa.continuar')}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {loading && !showSelectors && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Loader2 className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">{t('empresa.selecionando')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySelectionScreen;