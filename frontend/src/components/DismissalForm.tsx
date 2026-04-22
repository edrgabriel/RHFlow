import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';
import { API_URL } from '../config';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface DismissalFormProps {
  employee: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function DismissalForm({ employee, onClose, onSuccess }: DismissalFormProps) {
  const existingProcess = employee.dismissalProcess;
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [status, setStatus] = useState(existingProcess?.status || 'EM_ANDAMENTO');
  const [dismissalDate, setDismissalDate] = useState(
    employee.dismissalDate 
      ? new Date(employee.dismissalDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [observations, setObservations] = useState(existingProcess?.observations || '');
  const [loading, setLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (existingProcess && existingProcess.checklist && existingProcess.checklist !== "[]") {
      try {
        const parsed = JSON.parse(existingProcess.checklist);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChecklist(parsed);
          setSettingsLoaded(true);
          return;
        }
      } catch (e) {
        console.error('Error parsing checklist', e);
      }
    }

    // Se não tem processo existente válido, busca as configurações
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings`);
      let targetChecklistStr = res.data.dismissalChecklist;

      if (employee.company?.dismissalChecklist) {
        targetChecklistStr = employee.company.dismissalChecklist;
      }

      const parsed = JSON.parse(targetChecklistStr || '[]');
      const newChecklist = parsed.map((i: any) => ({ ...i, checked: false }));
      setChecklist(newChecklist);
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const handleAddItem = () => {
    if (!newItemLabel.trim()) return;
    setChecklist([...checklist, { id: Date.now().toString(), label: newItemLabel.trim(), checked: false }]);
    setNewItemLabel('');
  };

  const handleToggleItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleRemoveItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const percentComplete = checklist.length > 0 
    ? Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100)
    : 0;

  const onSubmit = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/employees/${employee.id}/dismiss`, {
        dismissalDate,
        checklist: JSON.stringify(checklist),
        observations,
        status
      });
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert('Erro ao salvar processo: ' + (error.response?.data?.details || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl animate-in slide-in-from-bottom-4 duration-300">
        {!settingsLoaded ? (
          <div className="p-12 text-center text-slate-500">Carregando processo demissional...</div>
        ) : (
          <>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Processo Demissional</h2>
            <p className="text-sm text-slate-500 mt-1">{employee.name} • {employee.cargo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Progress Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Progresso do Checklist</span>
              <span className="text-sm font-bold text-[#10b981]">{percentComplete}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#10b981] h-full transition-all duration-500 ease-out" 
                style={{ width: `${percentComplete}%` }}
              ></div>
            </div>
            {percentComplete === 100 && (
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                <CheckCircle size={14} /> Ao salvar, o colaborador será marcado como Inativo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Desligamento</label>
              <input
                type="date"
                value={dismissalDate}
                onChange={e => setDismissalDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status Interno</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none"
              >
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="PENDENTE_DOC">Pendente de Documentação</option>
                <option value="CONCLUIDO">Concluído</option>
              </select>
            </div>
          </div>

          {/* Dynamic Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Checklist Personalizado</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {checklist.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum item adicionado.</p>
              ) : (
                checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors group">
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
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}

              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Novo item para a checklist..."
                  value={newItemLabel}
                  onChange={e => setNewItemLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-[#10b981] hover:text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações / Motivo</label>
            <textarea
              rows={3}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="Anotações sobre a demissão, feedback da entrevista de desligamento, etc."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#10b981] hover:bg-emerald-600 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save size={18} />
            {loading ? 'Salvando...' : 'Salvar Progresso'}
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
