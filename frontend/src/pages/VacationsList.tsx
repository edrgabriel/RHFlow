import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Calendar as CalendarIcon, List as ListIcon, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { VacationForm } from '../components/VacationForm';
import { VacationsCalendar } from '../components/VacationsCalendar';
import { clsx } from 'clsx';

export function VacationsList() {
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editVacation, setEditVacation] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');

  const fetchVacations = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/vacations');
      setVacations(response.data);
    } catch (error) {
      console.error('Failed to fetch vacations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacations();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditVacation(null);
    fetchVacations();
  };

  const filteredVacations = vacations.filter((vac: any) => {
    const matchesStatus = filterStatus === 'TODOS' || vac.status === filterStatus;
    const matchesSearch = vac.employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'VENCIDAS': return { color: 'text-red-700 bg-red-100', icon: AlertTriangle };
      case 'NO PRAZO': return { color: 'text-blue-700 bg-blue-100', icon: Clock };
      case 'GOZADAS': return { color: 'text-green-700 bg-green-100', icon: CheckCircle };
      default: return { color: 'text-slate-700 bg-slate-100', icon: CheckCircle };
    }
  };

  // Calculate stats
  const stats = {
    vencidas: vacations.filter((v: any) => v.status === 'VENCIDAS').length,
    noPrazo: vacations.filter((v: any) => v.status === 'NO PRAZO').length,
    gozadas: vacations.filter((v: any) => v.status === 'GOZADAS').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {isFormOpen && (
        <VacationForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      {editVacation && (
        <VacationForm 
          initialData={editVacation}
          onClose={() => setEditVacation(null)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Férias</h1>
          <p className="text-slate-500 mt-1">Gerenciamento de férias e períodos aquisitivos</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Registrar Férias
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <p className="text-sm font-medium text-slate-500">Férias Vencidas</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.vencidas}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-sm font-medium text-slate-500">No Prazo / Agendadas</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.noPrazo}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <Clock size={24} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-[#10b981]">
          <div>
            <p className="text-sm font-medium text-slate-500">Gozadas Completamente</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.gozadas}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <CheckCircle size={24} className="text-[#10b981]" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button 
          onClick={() => setViewMode('LIST')}
          className={clsx(
            "p-2 rounded-lg flex items-center gap-2 transition-colors border",
            viewMode === 'LIST' ? "bg-white border-slate-200 text-slate-800 shadow-sm" : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <ListIcon size={18} /> <span className="text-sm font-medium hidden sm:inline">Lista</span>
        </button>
        <button 
          onClick={() => setViewMode('CALENDAR')}
          className={clsx(
            "p-2 rounded-lg flex items-center gap-2 transition-colors border",
            viewMode === 'CALENDAR' ? "bg-white border-slate-200 text-slate-800 shadow-sm" : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <CalendarIcon size={18} /> <span className="text-sm font-medium hidden sm:inline">Calendário</span>
        </button>
      </div>

      {viewMode === 'CALENDAR' ? (
        <VacationsCalendar vacations={vacations} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
              {['TODOS', 'VENCIDAS', 'NO PRAZO', 'GOZADAS'].map(status => (
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
                  <th className="p-4 font-semibold">Período Aquisitivo</th>
                  <th className="p-4 font-semibold">Data Limite</th>
                  <th className="p-4 font-semibold">Saldo de Dias</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Carregando férias...</td>
                  </tr>
                ) : filteredVacations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma requisição de férias encontrada.</td>
                  </tr>
                ) : (
                  filteredVacations.map((vac: any) => {
                    const StatusConfig = getStatusConfig(vac.status);
                    const Icon = StatusConfig.icon;
                    
                    return (
                      <tr key={vac.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{vac.employee.name}</div>
                          <div className="text-sm text-slate-500">{vac.employee.company?.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-800 text-sm">
                            {format(new Date(vac.aquisitiveStart), 'dd/MM/yyyy')} a {format(new Date(vac.aquisitiveEnd), 'dd/MM/yyyy')}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-800 text-sm">
                          {format(new Date(vac.limitDate), 'dd/MM/yyyy')}
                        </td>
                        <td className="p-4">
                          <span className={clsx(
                            "font-bold text-sm",
                            vac.remainingDays > 0 ? "text-blue-600" : "text-[#10b981]"
                          )}>
                            {vac.remainingDays}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">dias</span>
                        </td>
                        <td className="p-4">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase",
                            StatusConfig.color
                          )}>
                            <Icon size={12} />
                            {vac.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setEditVacation(vac)}
                            className="text-[#10b981] hover:text-emerald-700 font-medium text-sm transition-colors"
                          >
                            Gerenciar
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
      )}
    </div>
  );
}
