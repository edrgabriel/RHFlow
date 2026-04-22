import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';
import { API_URL } from '../config';

const employeeSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  rg: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  pixKey: z.string().optional(),
  leader: z.string().optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  hasChildren: z.boolean().default(false),
  companyId: z.string().min(1, 'Empregador é obrigatório'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export function EmployeeForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState<'dados' | 'checklist'>('dados');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  
  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');

  // New Company State
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [compRes, setRes] = await Promise.all([
        axios.get(`${API_URL}/employees/companies`),
        axios.get(`${API_URL}/settings`)
      ]);
      setCompanies(compRes.data);
      setGlobalSettings(setRes.data);
    } catch (error) {
      console.error('Failed to fetch initial data', error);
    }
  };

  const { register, handleSubmit, formState: { errors }, watch } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      hasChildren: false,
    }
  });

  const selectedCompanyId = watch('companyId');

  // Load correct checklist when company changes
  useEffect(() => {
    if (!globalSettings) return;

    let targetChecklistStr = globalSettings.admissionChecklist;

    if (selectedCompanyId) {
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      if (selectedCompany && selectedCompany.admissionChecklist) {
        targetChecklistStr = selectedCompany.admissionChecklist;
      }
    }

    try {
      const parsed = JSON.parse(targetChecklistStr || '[]');
      // Ensure they all start as unchecked for a new admission
      const newProcessChecklist = parsed.map((item: any) => ({ ...item, checked: false }));
      setChecklist(newProcessChecklist);
    } catch (e) {
      setChecklist([]);
    }
  }, [selectedCompanyId, globalSettings, companies]);

  const handleCreateCompany = async () => {
    if (!newCompanyName) return alert('Nome da empresa é obrigatório');
    setCreatingCompany(true);
    try {
      const res = await axios.post(`${API_URL}/employees/companies`, {
        name: newCompanyName,
        cnpj: newCompanyCnpj
      });
      const newComps = await axios.get(`${API_URL}/employees/companies`);
      setCompanies(newComps.data);
      register('companyId').onChange({ target: { name: 'companyId', value: res.data.id } });
      
      setIsAddingCompany(false);
      setNewCompanyName('');
      setNewCompanyCnpj('');
    } catch (err: any) {
      console.error('Erro ao criar empresa', err);
      alert(`Erro ao criar empresa: ${err.response?.data?.details || err.message}`);
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleToggleItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleRemoveItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    if (!newItemLabel.trim()) return;
    setChecklist([...checklist, { id: Date.now().toString(), label: newItemLabel.trim(), checked: false }]);
    setNewItemLabel('');
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    try {
      const is100Percent = checklist.length > 0 && checklist.every(i => i.checked);
      
      await axios.post(`${API_URL}/employees`, {
        ...data,
        admissionProcess: {
          checklist: JSON.stringify(checklist),
          status: is100Percent ? 'CONCLUIDO' : 'EM_ANDAMENTO'
        }
      });
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar', error);
      alert('Erro ao salvar colaborador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Nova Admissão</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('dados')}
            className={clsx(
              "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'dados' ? "border-[#10b981] text-[#10b981]" : "border-transparent text-slate-500 hover:bg-slate-50"
            )}
          >
            Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={clsx(
              "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'checklist' ? "border-[#10b981] text-[#10b981]" : "border-transparent text-slate-500 hover:bg-slate-50"
            )}
          >
            Checklist de Admissão
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <form id="employee-form" onSubmit={handleSubmit(onSubmit)}>
            <div className={activeTab === 'dados' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo *</label>
                  <input {...register('name')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                  {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" {...register('email')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                  {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">RG</label>
                  <input {...register('rg')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF *</label>
                  <input {...register('cpf')} placeholder="Apenas números" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                  {errors.cpf && <span className="text-red-500 text-xs mt-1">{errors.cpf.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo *</label>
                  <input {...register('cargo')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                  {errors.cargo && <span className="text-red-500 text-xs mt-1">{errors.cargo.message}</span>}
                </div>

                <div className="col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">Contratante (Empregador) *</label>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingCompany(!isAddingCompany)}
                      className="text-xs font-semibold text-[#10b981] hover:text-emerald-700"
                    >
                      {isAddingCompany ? 'Cancelar e Selecionar Existente' : '+ Cadastrar Nova Empresa'}
                    </button>
                  </div>

                  {isAddingCompany ? (
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Nome da Empresa *" 
                          value={newCompanyName} 
                          onChange={e => setNewCompanyName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] bg-white" 
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="CNPJ (opcional)" 
                          value={newCompanyCnpj} 
                          onChange={e => setNewCompanyCnpj(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] bg-white" 
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleCreateCompany}
                        disabled={creatingCompany}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {creatingCompany ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <select {...register('companyId')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all bg-white">
                        <option value="">Selecione o Empregador</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.cnpj ? `(${c.cnpj})` : ''}</option>
                        ))}
                      </select>
                      {errors.companyId && <span className="text-red-500 text-xs mt-1">{errors.companyId.message}</span>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chave PIX</label>
                  <input {...register('pixKey')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Líder Direto</label>
                  <input {...register('leader')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sexo</label>
                  <select {...register('gender')} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all bg-white">
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>

                <div className="flex items-center mt-6">
                  <input type="checkbox" id="hasChildren" {...register('hasChildren')} className="w-4 h-4 text-[#10b981] rounded border-slate-300 focus:ring-[#10b981]" />
                  <label htmlFor="hasChildren" className="ml-2 text-sm font-medium text-slate-700">Possui Filhos?</label>
                </div>
              </div>
            </div>

            <div className={activeTab === 'checklist' ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-4">Marque os itens já concluídos no processo de admissão. A checklist carrega as regras da Filial ou Global.</p>
                
                {checklist.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 bg-white rounded-lg border border-slate-200">Nenhum item configurado.</p>
                ) : (
                  checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-[#10b981]/50 transition-colors group">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleItem(item.id)}
                          className="w-4 h-4 text-[#10b981] rounded border-slate-300 focus:ring-[#10b981]"
                        />
                        <span className={clsx("text-sm transition-all", item.checked ? "text-slate-400 line-through" : "text-slate-700 font-medium")}>
                          {item.label}
                        </span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}

                <div className="flex items-center gap-2 pt-2 mt-4 border-t border-slate-200">
                  <input
                    type="text"
                    placeholder="Adicionar item extra nesta admissão..."
                    value={newItemLabel}
                    onChange={e => setNewItemLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="p-2 bg-slate-200 text-slate-600 hover:bg-[#10b981] hover:text-white rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="employee-form"
            disabled={loading}
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Admissão'}
          </button>
        </div>
      </div>
    </div>
  );
}
