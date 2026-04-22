import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const loanSchema = z.object({
  employeeId: z.string().min(1, 'Colaborador é obrigatório'),
  source: z.string().min(1, 'Fonte/Banco é obrigatório'),
  loanDate: z.string().min(1, 'Data do empréstimo é obrigatória'),
  totalAmount: z.preprocess((val) => Number(val), z.number().min(0.01, 'Valor deve ser maior que zero')),
  totalInstallments: z.preprocess((val) => Number(val), z.number().int().min(1, 'Mínimo de 1 parcela')),
  paidInstallments: z.preprocess((val) => Number(val), z.number().int().min(0, 'Não pode ser negativo')).optional(),
  startDiscountDate: z.string().min(1, 'Início do desconto é obrigatório'),
  observations: z.string().optional()
}).refine((data) => {
  if (data.paidInstallments !== undefined) {
    return data.paidInstallments <= data.totalInstallments;
  }
  return true;
}, {
  message: "Parcelas pagas não podem exceder o total de parcelas",
  path: ["paidInstallments"]
});

type LoanFormData = z.infer<typeof loanSchema>;

export function LoanForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => void, initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API_URL}/employees`)
      .then(res => setEmployees(res.data.filter((e: any) => e.status === 'ATIVO')))
      .catch(err => console.error('Error fetching employees', err));
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema) as any,
    defaultValues: initialData ? {
      employeeId: initialData.employeeId,
      source: initialData.source,
      loanDate: new Date(initialData.loanDate).toISOString().split('T')[0],
      totalAmount: initialData.totalAmount,
      totalInstallments: initialData.totalInstallments,
      paidInstallments: initialData.paidInstallments,
      startDiscountDate: new Date(initialData.startDiscountDate).toISOString().split('T')[0],
      observations: initialData.observations || ''
    } : {
      paidInstallments: 0
    }
  });

  const onSubmit = async (data: LoanFormData) => {
    setLoading(true);
    try {
      if (initialData) {
        await axios.put(`${API_URL}/loans/${initialData.id}`, data);
      } else {
        await axios.post(`${API_URL}/loans`, data);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar empréstimo', error);
      alert(`Erro ao salvar empréstimo: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData ? 'Editar Empréstimo' : 'Novo Empréstimo'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="loan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Colaborador *</label>
                <select 
                  {...register('employeeId')} 
                  disabled={!!initialData}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Selecione o Colaborador</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} - {e.cpf.replace(/(d{3})(d{3})(d{3})(d{2})/, '$1.$2.$3-$4')}</option>
                  ))}
                </select>
                {errors.employeeId && <span className="text-red-500 text-xs mt-1">{errors.employeeId.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fonte / Banco *</label>
                <input 
                  type="text" 
                  {...register('source')} 
                  placeholder="Ex: Caixa Econômica"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.source && <span className="text-red-500 text-xs mt-1">{errors.source.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data do Empréstimo *</label>
                <input 
                  type="date" 
                  {...register('loanDate')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.loanDate && <span className="text-red-500 text-xs mt-1">{errors.loanDate.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('totalAmount')} 
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.totalAmount && <span className="text-red-500 text-xs mt-1">{errors.totalAmount.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total de Parcelas *</label>
                <input 
                  type="number" 
                  {...register('totalInstallments')} 
                  placeholder="Ex: 48"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.totalInstallments && <span className="text-red-500 text-xs mt-1">{errors.totalInstallments.message}</span>}
              </div>

              {initialData && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parcelas Pagas *</label>
                  <input 
                    type="number" 
                    {...register('paidInstallments')} 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                  />
                  {errors.paidInstallments && <span className="text-red-500 text-xs mt-1">{errors.paidInstallments.message}</span>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Início do Desconto *</label>
                <input 
                  type="date" 
                  {...register('startDiscountDate')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.startDiscountDate && <span className="text-red-500 text-xs mt-1">{errors.startDiscountDate.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
              <textarea 
                {...register('observations')} 
                rows={2} 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="loan-form"
            disabled={loading}
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Empréstimo'}
          </button>
        </div>
      </div>
    </div>
  );
}
