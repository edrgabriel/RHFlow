import { Users, CheckCircle, AlertTriangle, Briefcase, Plus, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { API_URL } from '../config';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalActive: 0,
    recentEmployees: [],
    expiredExams: 0,
    activeLoans: 0,
    expiredVacations: 0,
    totalLoanAmount: 0,
    examsChartData: [],
    loansChartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/employees/dashboard-stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const statCards = [
    { title: 'Colaboradores Ativos', value: loading ? '...' : stats.totalActive, icon: Users, color: 'bg-blue-500' },
    { title: 'Exames Vencidos', value: loading ? '...' : stats.expiredExams, icon: AlertTriangle, color: 'bg-red-500' },
    { title: 'Empréstimos Ativos', value: loading ? '...' : stats.activeLoans, icon: Briefcase, color: 'bg-amber-500' },
    { title: 'Férias Vencidas', value: loading ? '...' : stats.expiredVacations, icon: Clock, color: 'bg-purple-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight dark:text-white">Visão Geral</h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Resumo consolidado do sistema</p>
        </div>
        <Link to="/employees" className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={20} />
          Nova Admissão
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`p-4 rounded-xl text-white ${stat.color} shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Status dos Exames</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.examsChartData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.examsChartData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {stats.examsChartData?.map((entry: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Resumo de Empréstimos</h2>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
              Total Emprestado: <span className="text-[#10b981]">{formatCurrency(stats.totalLoanAmount)}</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.loansChartData || []}>
                <XAxis dataKey="name" stroke="#8884d8" />
                <YAxis />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.loansChartData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Admissões Recentes</h2>
          <Link to="/employees" className="text-sm font-medium text-[#10b981] hover:text-emerald-700 transition-colors">
            Ver todos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Colaborador</th>
                <th className="p-4 font-semibold">Função / Setor</th>
                <th className="p-4 font-semibold">Empresa</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Carregando dados...</td>
                </tr>
              ) : stats.recentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Nenhum colaborador encontrado.</td>
                </tr>
              ) : (
                stats.recentEmployees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800 dark:text-white">{emp.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{emp.cpf.replace(/(d{3})(d{3})(d{3})(d{2})/, '$1.$2.$3-$4')}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 dark:text-white">{emp.cargo}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {emp.company?.name}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle size={14} />
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
