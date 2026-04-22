import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Trash2, Save, Building2, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<'global' | 'companies'>('global');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Global Settings State
  const [globalAdmission, setGlobalAdmission] = useState<any[]>([]);
  const [globalDismissal, setGlobalDismissal] = useState<any[]>([]);
  const [newAdmissionItem, setNewAdmissionItem] = useState('');
  const [newDismissalItem, setNewDismissalItem] = useState('');

  // Companies State
  const [companies, setCompanies] = useState<any[]>([]);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [deleteCompany, setDeleteCompany] = useState<any>(null);
  const [companyAdmission, setCompanyAdmission] = useState<any[]>([]);
  const [companyDismissal, setCompanyDismissal] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, companiesRes] = await Promise.all([
        axios.get('http://localhost:3001/api/settings'),
        axios.get('http://localhost:3001/api/employees/companies')
      ]);

      const settings = settingsRes.data;
      setGlobalAdmission(JSON.parse(settings.admissionChecklist || '[]'));
      setGlobalDismissal(JSON.parse(settings.dismissalChecklist || '[]'));
      
      setCompanies(companiesRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      await axios.put('http://localhost:3001/api/settings', {
        admissionChecklist: globalAdmission,
        dismissalChecklist: globalDismissal
      });
      alert('Configurações globais salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const openCompanyEditor = (company: any) => {
    setEditingCompany(company);
    
    // If company has custom checklists, use them. Otherwise, copy global.
    if (company.admissionChecklist) {
      setCompanyAdmission(JSON.parse(company.admissionChecklist));
    } else {
      setCompanyAdmission([...globalAdmission]);
    }

    if (company.dismissalChecklist) {
      setCompanyDismissal(JSON.parse(company.dismissalChecklist));
    } else {
      setCompanyDismissal([...globalDismissal]);
    }
  };

  const saveCompanySettings = async () => {
    if (!editingCompany) return;
    setSaving(true);
    try {
      await axios.put(`http://localhost:3001/api/employees/companies/${editingCompany.id}`, {
        admissionChecklist: companyAdmission,
        dismissalChecklist: companyDismissal
      });
      alert('Checklists da filial salvas!');
      setEditingCompany(null);
      fetchData();
    } catch (error) {
      alert('Erro ao salvar checklists da filial.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteCompany) return;
    try {
      await axios.delete(`http://localhost:3001/api/employees/companies/${deleteCompany.id}`);
      setDeleteCompany(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir filial.');
    }
  };

  const handleAddItem = (list: any[], setList: (l: any[]) => void, label: string, setLabel: (l: string) => void) => {
    if (!label.trim()) return;
    setList([...list, { id: Date.now().toString(), label: label.trim(), checked: false }]);
    setLabel('');
  };

  const handleRemoveItem = (list: any[], setList: (l: any[]) => void, id: string) => {
    setList(list.filter(item => item.id !== id));
  };

  if (loading) return <div className="p-8 text-slate-500">Carregando configurações...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <ConfirmDialog
        isOpen={!!deleteCompany}
        title="Excluir Unidade"
        message={`Tem certeza que deseja excluir a unidade ${deleteCompany?.name}? Se houver colaboradores ativos ou inativos nesta filial, a exclusão será bloqueada.`}
        onConfirm={handleDeleteCompany}
        onCancel={() => setDeleteCompany(null)}
      />

      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight dark:text-white flex items-center gap-2">
          <Settings size={28} className="text-[#10b981]" /> Configurações
        </h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">Gerencie regras padrão e exclusões do sistema</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('global')}
          className={clsx(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'global' ? "border-[#10b981] text-[#10b981]" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          )}
        >
          Checklists Globais
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={clsx(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'companies' ? "border-[#10b981] text-[#10b981]" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          )}
        >
          Unidades e Filiais
        </button>
      </div>

      {activeTab === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Global Admission */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Admissão (Padrão)</h2>
            <div className="space-y-2 mb-4">
              {globalAdmission.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                  <button onClick={() => handleRemoveItem(globalAdmission, setGlobalAdmission, item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Novo item de admissão..."
                value={newAdmissionItem}
                onChange={e => setNewAdmissionItem(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
              />
              <button onClick={() => handleAddItem(globalAdmission, setGlobalAdmission, newAdmissionItem, setNewAdmissionItem)} className="bg-[#10b981] text-white p-2 rounded-lg hover:bg-emerald-600"><Plus size={20} /></button>
            </div>
          </div>

          {/* Global Dismissal */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Demissão (Padrão)</h2>
            <div className="space-y-2 mb-4">
              {globalDismissal.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                  <button onClick={() => handleRemoveItem(globalDismissal, setGlobalDismissal, item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Novo item de demissão..."
                value={newDismissalItem}
                onChange={e => setNewDismissalItem(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
              />
              <button onClick={() => handleAddItem(globalDismissal, setGlobalDismissal, newDismissalItem, setNewDismissalItem)} className="bg-[#10b981] text-white p-2 rounded-lg hover:bg-emerald-600"><Plus size={20} /></button>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button onClick={saveGlobalSettings} disabled={saving} className="bg-[#10b981] text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50">
              <Save size={18} /> Salvar Padrões Globais
            </button>
          </div>
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="space-y-6">
          {!editingCompany ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Empresa / Filial</th>
                    <th className="p-4 font-semibold">CNPJ</th>
                    <th className="p-4 font-semibold">Checklist</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {companies.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                      <td className="p-4 flex items-center gap-3 dark:text-white">
                        <Building2 className="text-slate-400" size={18} />
                        <span className="font-medium">{c.name}</span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{c.cnpj || '-'}</td>
                      <td className="p-4">
                        {c.admissionChecklist || c.dismissalChecklist ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                            <CheckCircle size={12} /> Personalizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                            Global
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button onClick={() => openCompanyEditor(c)} className="text-[#10b981] hover:text-emerald-700 font-medium text-sm">Personalizar Checklists</button>
                        <button onClick={() => setDeleteCompany(c)} className="text-red-500 hover:text-red-700 font-medium text-sm inline-flex items-center gap-1"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Building2 size={24} className="text-slate-400" />
                  Personalizando: {editingCompany.name}
                </h2>
                <button onClick={() => setEditingCompany(null)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-sm">
                  Cancelar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Same layout as Global, but for companyAdmission and companyDismissal */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Admissão (Específico)</h2>
                  <div className="space-y-2 mb-4">
                    {companyAdmission.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                        <button onClick={() => handleRemoveItem(companyAdmission, setCompanyAdmission, item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Novo item..."
                      value={newAdmissionItem}
                      onChange={e => setNewAdmissionItem(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
                    />
                    <button onClick={() => handleAddItem(companyAdmission, setCompanyAdmission, newAdmissionItem, setNewAdmissionItem)} className="bg-[#10b981] text-white p-2 rounded-lg hover:bg-emerald-600"><Plus size={20} /></button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Demissão (Específico)</h2>
                  <div className="space-y-2 mb-4">
                    {companyDismissal.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                        <button onClick={() => handleRemoveItem(companyDismissal, setCompanyDismissal, item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Novo item..."
                      value={newDismissalItem}
                      onChange={e => setNewDismissalItem(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
                    />
                    <button onClick={() => handleAddItem(companyDismissal, setCompanyDismissal, newDismissalItem, setNewDismissalItem)} className="bg-[#10b981] text-white p-2 rounded-lg hover:bg-emerald-600"><Plus size={20} /></button>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button onClick={saveCompanySettings} disabled={saving} className="bg-[#10b981] text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50">
                    <Save size={18} /> Salvar Personalização
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
