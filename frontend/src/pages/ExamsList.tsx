import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Stethoscope, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ExamForm } from '../components/ExamForm';
import { clsx } from 'clsx';
import { API_URL } from '../config';

export function ExamsList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExam, setEditExam] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${API_URL}/exams`);
      setExams(response.data);
    } catch (error) {
      console.error('Failed to fetch exams', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditExam(null);
    fetchExams();
  };

  const filteredExams = exams.filter((exam: any) => {
    const matchesStatus = filterStatus === 'TODOS' || exam.status === filterStatus;
    const matchesSearch = exam.employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'VENCIDO': return { color: 'text-red-700 bg-red-100', icon: AlertTriangle };
      case 'PRÓXIMO A VENCER': return { color: 'text-amber-700 bg-amber-100', icon: Clock };
      case 'EM DIA': return { color: 'text-green-700 bg-green-100', icon: CheckCircle };
      default: return { color: 'text-slate-700 bg-slate-100', icon: CheckCircle };
    }
  };

  // Calculate stats
  const stats = {
    vencidos: exams.filter((e: any) => e.status === 'VENCIDO').length,
    proximos: exams.filter((e: any) => e.status === 'PRÓXIMO A VENCER').length,
    emDia: exams.filter((e: any) => e.status === 'EM DIA').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {isFormOpen && (
        <ExamForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      {editExam && (
        <ExamForm 
          initialData={editExam}
          onClose={() => setEditExam(null)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Exames Médicos</h1>
          <p className="text-slate-500 mt-1">Acompanhamento e gestão de saúde ocupacional</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Registrar Exame
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <p className="text-sm font-medium text-slate-500">Exames Vencidos</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.vencidos}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-sm font-medium text-slate-500">Próximos a Vencer (30 dias)</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.proximos}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <Clock size={24} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-[#10b981]">
          <div>
            <p className="text-sm font-medium text-slate-500">Exames em Dia</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.emDia}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <CheckCircle size={24} className="text-[#10b981]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
            {['TODOS', 'VENCIDO', 'PRÓXIMO A VENCER', 'EM DIA'].map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  filterStatus === status ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Colaborador</th>
                <th className="p-4 font-semibold">Função / Empregador</th>
                <th className="p-4 font-semibold">Último Exame</th>
                <th className="p-4 font-semibold">Vencimento</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Carregando exames...</td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Nenhum exame encontrado.</td>
                </tr>
              ) : (
                filteredExams.map((exam: any) => {
                  const StatusConfig = getStatusConfig(exam.status);
                  const Icon = StatusConfig.icon;
                  
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          <Stethoscope size={16} className="text-slate-400" />
                          {exam.employee.name}
                        </div>
                        {exam.employee.sector && <div className="text-sm text-slate-500 ml-6 mt-0.5">{exam.employee.sector}</div>}
                      </td>
                      <td className="p-4">
                        <div className="text-slate-800">{exam.employee.cargo}</div>
                        <div className="text-sm text-slate-500">{exam.employee.company?.name}</div>
                      </td>
                      <td className="p-4 text-slate-600">
                        {format(new Date(exam.lastExamDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="p-4 font-medium text-slate-800">
                        {format(new Date(exam.dueDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="p-4">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                          StatusConfig.color
                        )}>
                          <Icon size={12} />
                          {exam.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setEditExam(exam)}
                          className="text-[#10b981] hover:text-emerald-700 font-medium text-sm transition-colors"
                        >
                          Atualizar
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
