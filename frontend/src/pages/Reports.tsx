import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileSpreadsheet, FileText } from 'lucide-react';
import { PrintableReport } from '../components/PrintableReport';
import * as xlsx from 'xlsx';

export function Reports() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [fullEmployeeData, setFullEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [options, setOptions] = useState({
    includeExams: true,
    includeLoans: true,
    includeVacations: true
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('http://localhost:3001/api/employees')
      .then(res => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch employees', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      axios.get(`http://localhost:3001/api/employees/${selectedEmployeeId}`)
        .then(res => setFullEmployeeData(res.data))
        .catch(err => console.error('Failed to fetch full employee data', err));
    } else {
      setFullEmployeeData(null);
    }
  }, [selectedEmployeeId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: fullEmployeeData ? `Relatorio_${fullEmployeeData.name.replace(/\s+/g, '_')}` : 'Relatorio',
  });

  const exportExcel = () => {
    if (!fullEmployeeData) return;
    
    const wb = xlsx.utils.book_new();
    
    // Base data
    const baseData = [{
      Nome: fullEmployeeData.name,
      CPF: fullEmployeeData.cpf,
      Cargo: fullEmployeeData.cargo,
      Admissao: new Date(fullEmployeeData.admissionDate).toLocaleDateString('pt-BR'),
      Status: fullEmployeeData.status
    }];
    const wsBase = xlsx.utils.json_to_sheet(baseData);
    xlsx.utils.book_append_sheet(wb, wsBase, "Dados_Gerais");

    // Exams
    if (options.includeExams && fullEmployeeData.medicalExams?.length > 0) {
      const examsData = fullEmployeeData.medicalExams.map((e: any) => ({
        Tipo: e.examType,
        Data: new Date(e.examDate).toLocaleDateString('pt-BR'),
        Vencimento: new Date(e.dueDate).toLocaleDateString('pt-BR'),
        Resultado: e.result
      }));
      const wsExams = xlsx.utils.json_to_sheet(examsData);
      xlsx.utils.book_append_sheet(wb, wsExams, "Exames");
    }

    // Loans
    if (options.includeLoans && fullEmployeeData.loans?.length > 0) {
      const loansData = fullEmployeeData.loans.map((l: any) => ({
        Fonte: l.source,
        Data: new Date(l.loanDate).toLocaleDateString('pt-BR'),
        ValorTotal: l.totalAmount,
        Parcelas: `${l.paidInstallments}/${l.totalInstallments}`,
        Status: l.paidInstallments >= l.totalInstallments ? 'Quitado' : 'Ativo'
      }));
      const wsLoans = xlsx.utils.json_to_sheet(loansData);
      xlsx.utils.book_append_sheet(wb, wsLoans, "Emprestimos");
    }

    // Vacations
    if (options.includeVacations && fullEmployeeData.vacations?.length > 0) {
      const vacData = fullEmployeeData.vacations.map((v: any) => {
        const consumed = v.periods?.reduce((acc: number, p: any) => acc + p.days, 0) || 0;
        return {
          InicioAquisitivo: new Date(v.aquisitiveStart).toLocaleDateString('pt-BR'),
          FimAquisitivo: new Date(v.aquisitiveEnd).toLocaleDateString('pt-BR'),
          DataLimite: new Date(v.limitDate).toLocaleDateString('pt-BR'),
          SaldoDias: 30 - consumed
        };
      });
      const wsVac = xlsx.utils.json_to_sheet(vacData);
      xlsx.utils.book_append_sheet(wb, wsVac, "Ferias");
    }

    xlsx.writeFile(wb, `Relatorio_${fullEmployeeData.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const exportCSV = () => {
    if (!fullEmployeeData) return;
    const header = "Nome,CPF,Cargo,Status\n";
    const row = `"${fullEmployeeData.name}","${fullEmployeeData.cpf}","${fullEmployeeData.cargo}","${fullEmployeeData.status}"\n`;
    
    const blob = new Blob([header + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_${fullEmployeeData.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Relatórios</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Exportação de dossiês e dados dos colaboradores</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Gerar Dossiê do Colaborador</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Selecione o Colaborador</label>
            <select 
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
            >
              <option value="">-- Escolha da lista --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} - {emp.cargo}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">O que incluir no relatório?</h3>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.includeExams}
                  onChange={(e) => setOptions({...options, includeExams: e.target.checked})}
                  className="w-4 h-4 text-[#10b981] rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Exames Médicos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.includeLoans}
                  onChange={(e) => setOptions({...options, includeLoans: e.target.checked})}
                  className="w-4 h-4 text-[#10b981] rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Empréstimos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={options.includeVacations}
                  onChange={(e) => setOptions({...options, includeVacations: e.target.checked})}
                  className="w-4 h-4 text-[#10b981] rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Histórico de Férias</span>
              </label>
            </div>
          </div>

          {fullEmployeeData && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => handlePrint()}
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
              >
                <Printer size={20} />
                Imprimir / Gerar PDF
              </button>
              
              <button 
                onClick={exportExcel}
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <FileSpreadsheet size={20} className="text-emerald-600" />
                Exportar Excel
              </button>

              <button 
                onClick={exportCSV}
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <FileText size={20} className="text-blue-600" />
                Exportar CSV
              </button>
            </div>
          )}

          {!fullEmployeeData && !loading && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-center text-sm text-slate-500">
              Selecione um colaborador acima para habilitar as opções de exportação.
            </div>
          )}
        </div>
      </div>

      {/* Hidden print component */}
      <div className="hidden">
        <PrintableReport 
          ref={printRef} 
          employee={fullEmployeeData} 
          options={options} 
        />
      </div>

    </div>
  );
}
