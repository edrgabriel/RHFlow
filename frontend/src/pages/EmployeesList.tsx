import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, UserMinus, Upload, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { EmployeeForm } from '../components/EmployeeForm';
import { DismissalForm } from '../components/DismissalForm';
import { ImportModal } from '../components/ImportModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { clsx } from 'clsx';
import { API_URL } from '../config';

export function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dismissalEmployee, setDismissalEmployee] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'ATIVO' | 'INATIVO' | 'EM_DESLIGAMENTO'>('ATIVO');

  const [deleteEmployee, setDeleteEmployee] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setIsImportOpen(false);
    setDismissalEmployee(null);
    fetchEmployees();
  };

  const handleDelete = async () => {
    if (!deleteEmployee) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/employees/${deleteEmployee.id}`);
      setDeleteEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Failed to delete employee', error);
      alert('Erro ao excluir colaborador: ' + (error.response?.data?.details || error.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEmployees = employees.filter((emp: any) => emp.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {isFormOpen && (
        <EmployeeForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      {dismissalEmployee && (
        <DismissalForm 
          employee={dismissalEmployee}
          onClose={() => setDismissalEmployee(null)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      {isImportOpen && (
        <ImportModal 
          onClose={() => setIsImportOpen(false)} 
          onSuccess={handleFormSuccess} 
        />
      )}
      <ConfirmDialog
        isOpen={!!deleteEmployee}
        title="Excluir Colaborador"
        message={`Tem certeza que deseja excluir permanentemente o registro de ${deleteEmployee?.name}? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteEmployee(null)}
        loading={isDeleting}
      />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Colaboradores</h1>
          <p className="text-slate-500 mt-1">Gerencie a equipe e realize admissões/demissões</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Upload size={18} />
            Importar
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-[#10b981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Nova Admissão
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setFilterStatus('ATIVO')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                filterStatus === 'ATIVO' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Ativos
            </button>
            <button 
              onClick={() => setFilterStatus('EM_DESLIGAMENTO')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                filterStatus === 'EM_DESLIGAMENTO' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Demissional
            </button>
            <button 
              onClick={() => setFilterStatus('INATIVO')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                filterStatus === 'INATIVO' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Desligados
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Nome / CPF</th>
                <th className="p-4 font-semibold">Cargo / Empregador</th>
                <th className="p-4 font-semibold">{filterStatus === 'ATIVO' ? 'Admissão' : 'Desligamento'}</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Nenhum colaborador encontrado nesta aba.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{emp.name}</div>
                      <div className="text-sm text-slate-500">{emp.cpf.replace(/(d{3})(d{3})(d{3})(d{2})/, '$1.$2.$3-$4')}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{emp.cargo}</div>
                      <div className="text-sm text-slate-500">{emp.company?.name}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {filterStatus === 'ATIVO' 
                        ? format(new Date(emp.admissionDate), 'dd/MM/yyyy')
                        : emp.dismissalDate ? format(new Date(emp.dismissalDate), 'dd/MM/yyyy') : '-'
                      }
                    </td>
                    <td className="p-4">
                      <span className={clsx(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                        emp.status === 'ATIVO' ? "bg-green-100 text-green-700" : 
                        emp.status === 'EM_DESLIGAMENTO' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>
                        {emp.status === 'EM_DESLIGAMENTO' ? 'DEMISSIONAL' : emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button className="text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">Editar</button>
                      {(emp.status === 'ATIVO' || emp.status === 'EM_DESLIGAMENTO') && (
                        <button 
                          onClick={() => setDismissalEmployee(emp)}
                          className="text-amber-500 hover:text-amber-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
                        >
                          <UserMinus size={14} />
                          {emp.status === 'ATIVO' ? 'Desligar' : 'Processo'}
                        </button>
                      )}
                      <button 
                        onClick={() => setDeleteEmployee(emp)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
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

