import { useState, useEffect } from 'react';
import axios from 'axios';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, TrendingUp, TrendingDown, Filter } from 'lucide-react';

export function TurnoverDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [period, setPeriod] = useState('6m'); // 6m, 12m, ytd
  const [companyId, setCompanyId] = useState('');
  const [leader, setLeader] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    // Fetch companies for the filter
    axios.get('http://localhost:3001/api/employees/companies')
      .then(res => setCompanies(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchTurnoverStats();
  }, [period, companyId, leader]);

  const fetchTurnoverStats = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (period) queryParams.append('period', period);
      if (companyId) queryParams.append('companyId', companyId);
      if (leader) queryParams.append('leader', leader);

      const response = await axios.get(`http://localhost:3001/api/employees/turnover-stats?${queryParams.toString()}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch turnover stats', error);
    } finally {
      setLoading(false);
    }
  };

  const getTurnoverRate = () => {
    if (!stats) return 0;
    const total = stats.totalAdmissions + stats.totalDismissals;
    if (total === 0) return 0;
    // Simple mock rate calculation for UI
    return ((stats.totalDismissals / Math.max(stats.totalAdmissions, 1)) * 100).toFixed(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight dark:text-white">Inteligência de Turnover</h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Análise de rotatividade e retenção de talentos</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <Filter size={18} /> Filtros:
        </div>
        
        <select 
          value={period} 
          onChange={e => setPeriod(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 dark:text-white"
        >
          <option value="6m">Últimos 6 Meses</option>
          <option value="12m">Últimos 12 Meses</option>
          <option value="ytd">Este Ano (YTD)</option>
        </select>

        <select 
          value={companyId} 
          onChange={e => setCompanyId(e.target.value)}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 dark:text-white"
        >
          <option value="">Todas as Empresas</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="flex-1 w-full relative">
          <input 
            type="text" 
            placeholder="Filtrar por Nome do Líder..."
            value={leader}
            onChange={e => setLeader(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Carregando dados de inteligência...</div>
      ) : !stats ? (
        <div className="p-12 text-center text-slate-500">Nenhum dado encontrado para os filtros selecionados.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Admissões</p>
                  <h3 className="text-3xl font-bold text-emerald-600 mt-2">{stats.totalAdmissions}</h3>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Desligamentos</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.totalDismissals}</h3>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-xl">
                  <TrendingDown size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de Turnover (Aprox.)</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{getTurnoverRate()}%</h3>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <Users size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Comparativo Admissões vs. Demissões (Mensal)</h2>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDismissals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#8884d8" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" name="Admissões" dataKey="admissions" stroke="#10b981" fillOpacity={1} fill="url(#colorAdmissions)" />
                  <Area type="monotone" name="Demissões" dataKey="dismissals" stroke="#ef4444" fillOpacity={1} fill="url(#colorDismissals)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
