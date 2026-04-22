import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Wallet, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { LoanForm } from '../components/LoanForm';
import { clsx } from 'clsx';

export function LoansList() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLoans = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/loans');
      setLoans(response.data);
    } catch (error) {
      console.error('Failed to fetch loans', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditLoan(null);
    fetchLoans();
  };

  const filteredLoans = loans.filter((loan: any) => {
    const matchesStatus = filterStatus === 'TODOS' || loan.status === filterStatus;
    const matchesSearch = loan.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          loan.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    return status === 'ATIVO' 
      ? { color: 'text-blue-700 bg-blue-100', icon: Clock }
      : { color: 'text-green-700 bg-green-100', icon: CheckCircle };
  };

  // Calculate stats exactly as requested
  const totalEmprestado = loans.reduce((acc: number, loan: any) => acc + loan.totalAmount, 0);
  const totalAtivoAmount = loans.filter((l: any) => l.status === 'ATIVO').reduce((acc: number, loan: any) => acc + loan.remainingAmount, 0);
  const qtdeAtivos = loans.filter((l: any) => l.status === 'ATIVO').length;
  const qtdeQuitados = loans.filter((l: any) => l.status === 'QUITADO').length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {isFormOpen && (
        <LoanForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      {editLoan && (
        <LoanForm 
          initialData={editLoan}
          onClose={() => setEditLoan(null)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Empréstimos Consignados</h1>
          <p className="text-slate-500 mt-1">Gestão financeira de empréstimos dos colaboradores</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Empréstimo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-medium text-slate-500">Total Emprestado</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">{formatCurrency(totalEmprestado)}</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-slate-500">Valor Restante (Ativos)</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalAtivoAmount)}</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-sm font-medium text-slate-500">Empréstimos Ativos</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{qtdeAtivos}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <Clock size={24} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between border-l-4 border-l-[#10b981]">
          <div>
            <p className="text-sm font-medium text-slate-500">Empréstimos Quitados</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{qtdeQuitados}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <CheckCircle size={24} className="text-[#10b981]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
            {['TODOS', 'ATIVO', 'QUITADO'].map(status => (
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
              placeholder="Buscar colaborador ou fonte..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Colaborador / Fonte</th>
                <th className="p-4 font-semibold">Data / Início</th>
                <th className="p-4 font-semibold">Valor Total</th>
                <th className="p-4 font-semibold">Progresso</th>
                <th className="p-4 font-semibold">Status / Restante</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Carregando empréstimos...</td>
                </tr>
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Nenhum empréstimo encontrado.</td>
                </tr>
              ) : (
                filteredLoans.map((loan: any) => {
                  const StatusConfig = getStatusConfig(loan.status);
                  const Icon = StatusConfig.icon;
                  const percentPaid = Math.round((loan.paidInstallments / loan.totalInstallments) * 100);
                  
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          <Wallet size={16} className="text-slate-400" />
                          {loan.employee.name}
                        </div>
                        <div className="text-sm text-slate-500 ml-6 mt-0.5">{loan.source}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-800">{format(new Date(loan.loanDate), 'dd/MM/yyyy')}</div>
                        <div className="text-sm text-slate-500">Início: {format(new Date(loan.startDiscountDate), 'dd/MM/yyyy')}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{formatCurrency(loan.totalAmount)}</div>
                        <div className="text-xs text-slate-500">{loan.totalInstallments}x de {formatCurrency(loan.installmentValue)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${loan.status === 'QUITADO' ? 'bg-[#10b981]' : 'bg-blue-500'}`} 
                              style={{ width: `${percentPaid}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{loan.paidInstallments}/{loan.totalInstallments}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase",
                            StatusConfig.color
                          )}>
                            <Icon size={10} />
                            {loan.status}
                          </span>
                          {loan.status === 'ATIVO' && (
                            <span className="text-sm font-semibold text-red-600">Restante: {formatCurrency(loan.remainingAmount)}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setEditLoan(loan)}
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
