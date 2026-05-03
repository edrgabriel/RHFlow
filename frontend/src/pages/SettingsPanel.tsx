import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Trash2, Save, Building2, CheckCircle, Link as LinkIcon, Edit, Copy } from 'lucide-react';
import { clsx } from 'clsx';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { API_URL } from '../config';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<'global' | 'companies' | 'recruitment'>('global');
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

  // Recruitment Links State
  const [recruitmentLinks, setRecruitmentLinks] = useState<any[]>([]);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [newLink, setNewLink] = useState({
    title: '', companyId: '', requireDocuments: false, requireMbti: false,
    description: '', salaryInfo: '', customQuestions: [] as any[]
  });
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('text');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, companiesRes, linksRes] = await Promise.all([
        axios.get(`${API_URL}/settings`),
        axios.get(`${API_URL}/employees/companies`),
        axios.get(`${API_URL}/recruitment`)
      ]);

      const settings = settingsRes.data;
      setGlobalAdmission(JSON.parse(settings.admissionChecklist || '[]'));
      setGlobalDismissal(JSON.parse(settings.dismissalChecklist || '[]'));
      
      setCompanies(companiesRes.data);
      setRecruitmentLinks(linksRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/settings`, {
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
      await axios.put(`${API_URL}/employees/companies/${editingCompany.id}`, {
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
      await axios.delete(`${API_URL}/employees/companies/${deleteCompany.id}`);
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

  // --- Recruitment Link Functions ---
  const handleSaveLink = async () => {
    if (!newLink.title || !newLink.companyId) {
      return alert('Título e Empresa são obrigatórios.');
    }
    
    try {
      if (editingLink) {
        await axios.put(`${API_URL}/recruitment/${editingLink.id}`, { ...newLink, active: editingLink.active });
      } else {
        await axios.post(`${API_URL}/recruitment`, newLink);
      }
      setIsCreatingLink(false);
      setEditingLink(null);
      setNewLink({ title: '', companyId: '', requireDocuments: false, requireMbti: false, description: '', salaryInfo: '', customQuestions: [] });
      fetchData();
    } catch (error) {
      alert('Erro ao salvar link de recrutamento.');
    }
  };

  const handleToggleLinkActive = async (link: any) => {
    try {
      await axios.put(`${API_URL}/recruitment/${link.id}`, { ...link, active: !link.active });
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status do link.');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta vaga?')) return;
    try {
      await axios.delete(`${API_URL}/recruitment/${id}`);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir vaga.');
    }
  };

  const addCustomQuestion = () => {
    if (!newQuestionText.trim()) return;
    setNewLink(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, { id: Date.now().toString(), question: newQuestionText, type: newQuestionType }]
    }));
    setNewQuestionText('');
  };

  const removeCustomQuestion = (id: string) => {
    setNewLink(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(q => q.id !== id)
    }));
  };

  const openEditLink = (link: any) => {
    setEditingLink(link);
    setNewLink({
      title: link.title,
      companyId: link.companyId,
      requireDocuments: link.requireDocuments,
      requireMbti: link.requireMbti,
      description: link.description || '',
      salaryInfo: link.salaryInfo || '',
      customQuestions: link.customQuestions ? JSON.parse(link.customQuestions) : []
    });
    setIsCreatingLink(true);
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/candidatura/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
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
        <button
          onClick={() => setActiveTab('recruitment')}
          className={clsx(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'recruitment' ? "border-[#10b981] text-[#10b981]" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          )}
        >
          Links de Recrutamento
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

      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          {!isCreatingLink ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <LinkIcon className="text-[#10b981]" /> Vagas Abertas
                </h2>
                <button 
                  onClick={() => setIsCreatingLink(true)} 
                  className="bg-[#10b981] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> Nova Vaga
                </button>
              </div>

              {recruitmentLinks.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nenhum link de recrutamento criado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recruitmentLinks.map(link => (
                    <div key={link.id} className={clsx("border rounded-xl p-4 transition-colors", link.active ? "border-[#10b981]/30 bg-emerald-50/30" : "border-slate-200 bg-slate-50 opacity-75")}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-slate-800">{link.title}</h3>
                          <p className="text-xs text-slate-500">{link.company?.name}</p>
                        </div>
                        <span className={clsx("text-xs font-semibold px-2 py-1 rounded-full", link.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>
                          {link.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                        <span className="bg-white px-2 py-1 rounded shadow-sm text-xs border border-slate-100">
                          {link._count?.candidates || 0} candidatos
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <div className="flex gap-2">
                          <button onClick={() => handleToggleLinkActive(link)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
                            {link.active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button onClick={() => openEditLink(link)} className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Edit size={12}/> Editar
                          </button>
                          <button onClick={() => handleDeleteLink(link.id)} className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                            <Trash2 size={12}/> Excluir
                          </button>
                        </div>
                        {link.active && (
                          <button onClick={() => copyToClipboard(link.id)} className="text-[#10b981] hover:text-emerald-700 bg-white border border-emerald-100 shadow-sm px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                            <Copy size={14} /> Copiar Link
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                {editingLink ? 'Editar Vaga' : 'Criar Novo Link de Vaga'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título da Vaga *</label>
                  <input type="text" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" placeholder="Ex: Desenvolvedor Senior" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa / Filial *</label>
                  <select value={newLink.companyId} onChange={e => setNewLink({...newLink, companyId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] bg-white">
                    <option value="">Selecione a empresa...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Informação Salarial</label>
                  <input type="text" value={newLink.salaryInfo} onChange={e => setNewLink({...newLink, salaryInfo: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" placeholder="Ex: R$ 5.000 ou 'A combinar'" />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição da Vaga</label>
                  <textarea rows={4} value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" placeholder="Requisitos, benefícios, modelo de trabalho..."></textarea>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <h3 className="font-semibold text-slate-700">O que exigir na candidatura?</h3>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={newLink.requireDocuments} onChange={e => setNewLink({...newLink, requireDocuments: e.target.checked})} className="w-4 h-4 text-[#10b981] rounded focus:ring-[#10b981]" />
                    <span className="text-sm text-slate-700">Upload de Currículo / Documentos (PDF, JPG)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={newLink.requireMbti} onChange={e => setNewLink({...newLink, requireMbti: e.target.checked})} className="w-4 h-4 text-[#10b981] rounded focus:ring-[#10b981]" />
                    <span className="text-sm text-slate-700">Teste de Personalidade (MBTI)</span>
                  </label>
                </div>

                <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <h3 className="font-semibold text-slate-700 mb-3">Perguntas Personalizadas</h3>
                  <div className="space-y-3 mb-4">
                    {newLink.customQuestions.map(q => (
                      <div key={q.id} className="flex justify-between items-center bg-white p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{q.question}</p>
                          <p className="text-xs text-slate-500">Tipo: {q.type === 'text' ? 'Texto Livre' : 'Sim / Não'}</p>
                        </div>
                        <button onClick={() => removeCustomQuestion(q.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </div>
                    ))}
                    {newLink.customQuestions.length === 0 && <p className="text-xs text-slate-500">Nenhuma pergunta customizada.</p>}
                  </div>

                  <div className="flex gap-2">
                    <input type="text" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} placeholder="Ex: Qual sua pretensão salarial?" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <select value={newQuestionType} onChange={e => setNewQuestionType(e.target.value)} className="w-32 px-3 py-2 border rounded-lg text-sm bg-white">
                      <option value="text">Texto Livre</option>
                      <option value="yes_no">Sim / Não</option>
                    </select>
                    <button onClick={addCustomQuestion} className="bg-[#10b981] text-white px-4 py-2 rounded-lg hover:bg-emerald-600">Adicionar</button>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button onClick={() => { setIsCreatingLink(false); setEditingLink(null); }} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveLink} className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-sm">
                  Salvar Vaga
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
