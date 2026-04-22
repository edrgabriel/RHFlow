import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import axios from 'axios';

const examSchema = z.object({
  employeeId: z.string().min(1, 'Colaborador é obrigatório'),
  lastExamDate: z.string().min(1, 'Data do último exame é obrigatória'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  observations: z.string().optional()
});

type ExamFormData = z.infer<typeof examSchema>;

export function ExamForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => void, initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all active employees to populate the dropdown
    axios.get('http://localhost:3001/api/employees')
      .then(res => {
        setEmployees(res.data.filter((e: any) => e.status === 'ATIVO'));
      })
      .catch(err => console.error('Error fetching employees', err));
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: initialData ? {
      employeeId: initialData.employeeId,
      lastExamDate: new Date(initialData.lastExamDate).toISOString().split('T')[0],
      dueDate: new Date(initialData.dueDate).toISOString().split('T')[0],
      observations: initialData.observations || ''
    } : {}
  });

  const onSubmit = async (data: ExamFormData) => {
    setLoading(true);
    try {
      if (initialData) {
        await axios.put(`http://localhost:3001/api/exams/${initialData.id}`, data);
      } else {
        await axios.post('http://localhost:3001/api/exams', data);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar exame', error);
      alert(`Erro ao salvar exame: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData ? 'Editar Exame Médico' : 'Registrar Exame Médico'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="exam-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Colaborador *</label>
              <select 
                {...register('employeeId')} 
                disabled={!!initialData}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Selecione o Colaborador</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} - {e.cargo}</option>
                ))}
              </select>
              {errors.employeeId && <span className="text-red-500 text-xs mt-1">{errors.employeeId.message}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data do Exame *</label>
                <input 
                  type="date" 
                  {...register('lastExamDate')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.lastExamDate && <span className="text-red-500 text-xs mt-1">{errors.lastExamDate.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento *</label>
                <input 
                  type="date" 
                  {...register('dueDate')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.dueDate && <span className="text-red-500 text-xs mt-1">{errors.dueDate.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
              <textarea 
                {...register('observations')} 
                rows={3} 
                placeholder="Ex: Restrições médicas, recomendações, etc."
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
            form="exam-form"
            disabled={loading}
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Exame'}
          </button>
        </div>
      </div>
    </div>
  );
}
