import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const periodSchema = z.object({
  days: z.preprocess((val) => Number(val), z.number().int().min(1, 'Mínimo 1 dia')),
  startDate: z.string().min(1, 'Início obrigatório'),
  endDate: z.string().min(1, 'Fim obrigatório')
});

const vacationSchema = z.object({
  employeeId: z.string().min(1, 'Colaborador é obrigatório'),
  noticeDate: z.string().optional(),
  aquisitiveStart: z.string().min(1, 'Início do período aquisitivo é obrigatório'),
  aquisitiveEnd: z.string().min(1, 'Fim do período aquisitivo é obrigatório'),
  limitDate: z.string().min(1, 'Data limite é obrigatória'),
  thirteenthAdvance: z.boolean().default(false),
  observations: z.string().optional(),
  periods: z.array(periodSchema).max(3, 'Máximo de 3 períodos permitidos')
}).refine((data) => {
  const totalDays = data.periods.reduce((acc, p) => acc + (p.days || 0), 0);
  return totalDays <= 30;
}, {
  message: "O total de dias fracionados não pode exceder 30 dias",
  path: ["periods"]
});

type VacationFormData = z.infer<typeof vacationSchema>;

export function VacationForm({ onClose, onSuccess, initialData }: { onClose: () => void, onSuccess: () => void, initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/employees')
      .then(res => setEmployees(res.data.filter((e: any) => e.status === 'ATIVO')))
      .catch(err => console.error('Error fetching employees', err));
  }, []);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<VacationFormData>({
    resolver: zodResolver(vacationSchema) as any,
    defaultValues: initialData ? {
      employeeId: initialData.employeeId,
      noticeDate: initialData.noticeDate ? new Date(initialData.noticeDate).toISOString().split('T')[0] : '',
      aquisitiveStart: new Date(initialData.aquisitiveStart).toISOString().split('T')[0],
      aquisitiveEnd: new Date(initialData.aquisitiveEnd).toISOString().split('T')[0],
      limitDate: new Date(initialData.limitDate).toISOString().split('T')[0],
      thirteenthAdvance: initialData.thirteenthAdvance,
      observations: initialData.observations || '',
      periods: initialData.periods?.map((p: any) => ({
        days: p.days,
        startDate: new Date(p.startDate).toISOString().split('T')[0],
        endDate: new Date(p.endDate).toISOString().split('T')[0]
      })) || []
    } : {
      periods: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "periods"
  });

  const periods = watch("periods");
  const totalDays = periods?.reduce((acc, p) => acc + (Number(p.days) || 0), 0) || 0;

  // Auto calculate end date when start date and days change
  const handlePeriodChange = (index: number, field: 'days' | 'startDate', value: string) => {
    const period = periods[index];
    if (!period) return;
    
    let days = field === 'days' ? Number(value) : period.days;
    let startDateStr = field === 'startDate' ? value : period.startDate;

    if (days && startDateStr) {
      const startDate = new Date(startDateStr);
      if (!isNaN(startDate.getTime())) {
        // Add days - 1 to start date
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (days - 1));
        setValue(`periods.${index}.endDate`, endDate.toISOString().split('T')[0], { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (data: VacationFormData) => {
    setLoading(true);
    try {
      if (initialData) {
        await axios.put(`http://localhost:3001/api/vacations/${initialData.id}`, data);
      } else {
        await axios.post('http://localhost:3001/api/vacations', data);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar férias', error);
      alert(`Erro ao salvar férias: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData ? 'Editar Férias' : 'Registrar Férias'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="vacation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
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
                    <option key={e.id} value={e.id}>{e.name} - {e.cargo}</option>
                  ))}
                </select>
                {errors.employeeId && <span className="text-red-500 text-xs mt-1">{errors.employeeId.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Início Período Aquisitivo *</label>
                <input 
                  type="date" 
                  {...register('aquisitiveStart')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.aquisitiveStart && <span className="text-red-500 text-xs mt-1">{errors.aquisitiveStart.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fim Período Aquisitivo *</label>
                <input 
                  type="date" 
                  {...register('aquisitiveEnd')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.aquisitiveEnd && <span className="text-red-500 text-xs mt-1">{errors.aquisitiveEnd.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data Limite de Gozo *</label>
                <input 
                  type="date" 
                  {...register('limitDate')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
                {errors.limitDate && <span className="text-red-500 text-xs mt-1">{errors.limitDate.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data do Aviso</label>
                <input 
                  type="date" 
                  {...register('noticeDate')} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all" 
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <input 
                type="checkbox" 
                id="thirteenthAdvance" 
                {...register('thirteenthAdvance')}
                className="w-4 h-4 text-[#10b981] rounded border-slate-300 focus:ring-[#10b981]"
              />
              <label htmlFor="thirteenthAdvance" className="text-sm font-medium text-slate-700 cursor-pointer">
                Adiantar 1ª Parcela do 13º Salário
              </label>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Períodos de Descanso (Fracionamento)</h3>
                  <p className="text-sm text-slate-500">Saldo de dias consumidos: <strong className={totalDays > 30 ? 'text-red-500' : 'text-[#10b981]'}>{totalDays}/30</strong></p>
                </div>
                {fields.length < 3 && totalDays < 30 && (
                  <button
                    type="button"
                    onClick={() => append({ days: 0, startDate: '', endDate: '' })}
                    className="text-sm font-medium text-[#10b981] hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Adicionar Período
                  </button>
                )}
              </div>

              {errors.periods?.root && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{errors.periods.root.message}</div>}

              <div className="space-y-3">
                {fields.length === 0 && (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                    Nenhum período de férias agendado ainda.
                  </div>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap md:flex-nowrap items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                    <div className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-[#10b981] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-[100px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Dias</label>
                      <input 
                        type="number"
                        {...register(`periods.${index}.days`)}
                        onChange={(e) => {
                          register(`periods.${index}.days`).onChange(e);
                          handlePeriodChange(index, 'days', e.target.value);
                        }}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" 
                      />
                      {errors.periods?.[index]?.days && <span className="text-red-500 text-[10px] mt-1 block">{errors.periods[index]?.days?.message}</span>}
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Data de Início</label>
                      <input 
                        type="date"
                        {...register(`periods.${index}.startDate`)}
                        onChange={(e) => {
                          register(`periods.${index}.startDate`).onChange(e);
                          handlePeriodChange(index, 'startDate', e.target.value);
                        }}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]" 
                      />
                    </div>

                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Data de Fim</label>
                      <input 
                        type="date"
                        {...register(`periods.${index}.endDate`)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white" 
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="mt-6 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
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
            form="vacation-form"
            disabled={loading || totalDays > 30}
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Férias'}
          </button>
        </div>
      </div>
    </div>
  );
}
