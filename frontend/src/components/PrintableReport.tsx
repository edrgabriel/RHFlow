import { forwardRef } from 'react';
import { format } from 'date-fns';

interface PrintableReportProps {
  employee: any;
  options: {
    includeExams: boolean;
    includeLoans: boolean;
    includeVacations: boolean;
  };
}

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(({ employee, options }, ref) => {
  if (!employee) return null;

  return (
    <div ref={ref} className="p-10 bg-white text-black min-h-screen font-sans" style={{ width: '210mm', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão RH</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-widest">Dossiê do Colaborador</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 font-medium">Emitido em: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="text-xs text-slate-400 mt-1">Uso Interno</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="mb-10">
        <h2 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4">Dados Cadastrais</h2>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div><span className="font-semibold text-slate-500">Nome:</span> <span className="font-medium text-slate-900">{employee.name}</span></div>
          <div><span className="font-semibold text-slate-500">CPF:</span> <span className="font-medium text-slate-900">{employee.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span></div>
          <div><span className="font-semibold text-slate-500">Cargo:</span> <span className="font-medium text-slate-900">{employee.cargo}</span></div>
          <div><span className="font-semibold text-slate-500">Setor:</span> <span className="font-medium text-slate-900">{employee.sector || '-'}</span></div>
          <div><span className="font-semibold text-slate-500">Empregador:</span> <span className="font-medium text-slate-900">{employee.company?.name || '-'}</span></div>
          <div><span className="font-semibold text-slate-500">Data de Admissão:</span> <span className="font-medium text-slate-900">{format(new Date(employee.admissionDate), 'dd/MM/yyyy')}</span></div>
          <div><span className="font-semibold text-slate-500">Status:</span> <span className="font-medium text-slate-900">{employee.status}</span></div>
        </div>
      </div>

      {/* Medical Exams */}
      {options.includeExams && employee.medicalExams && employee.medicalExams.length > 0 && (
        <div className="mb-10 page-break-inside-avoid">
          <h2 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4">Histórico de Exames Médicos</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border border-slate-200 font-semibold">Tipo</th>
                <th className="p-2 border border-slate-200 font-semibold">Realização</th>
                <th className="p-2 border border-slate-200 font-semibold">Vencimento</th>
                <th className="p-2 border border-slate-200 font-semibold">Médico</th>
                <th className="p-2 border border-slate-200 font-semibold">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {employee.medicalExams.map((exam: any) => (
                <tr key={exam.id}>
                  <td className="p-2 border border-slate-200">{exam.examType}</td>
                  <td className="p-2 border border-slate-200">{format(new Date(exam.lastExamDate), 'dd/MM/yyyy')}</td>
                  <td className="p-2 border border-slate-200">{format(new Date(exam.dueDate), 'dd/MM/yyyy')}</td>
                  <td className="p-2 border border-slate-200">{exam.doctorName} (CRM: {exam.doctorCRM})</td>
                  <td className="p-2 border border-slate-200 font-medium">{exam.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loans */}
      {options.includeLoans && employee.loans && employee.loans.length > 0 && (
        <div className="mb-10 page-break-inside-avoid">
          <h2 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4">Empréstimos Consignados</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border border-slate-200 font-semibold">Fonte</th>
                <th className="p-2 border border-slate-200 font-semibold">Data</th>
                <th className="p-2 border border-slate-200 font-semibold">Valor Total</th>
                <th className="p-2 border border-slate-200 font-semibold">Parcelas</th>
                <th className="p-2 border border-slate-200 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {employee.loans.map((loan: any) => {
                const isQuitado = loan.paidInstallments >= loan.totalInstallments;
                return (
                  <tr key={loan.id}>
                    <td className="p-2 border border-slate-200">{loan.source}</td>
                    <td className="p-2 border border-slate-200">{format(new Date(loan.loanDate), 'dd/MM/yyyy')}</td>
                    <td className="p-2 border border-slate-200">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loan.totalAmount)}
                    </td>
                    <td className="p-2 border border-slate-200">{loan.paidInstallments} / {loan.totalInstallments}</td>
                    <td className="p-2 border border-slate-200 font-medium">{isQuitado ? 'Quitado' : 'Ativo'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Vacations */}
      {options.includeVacations && employee.vacations && employee.vacations.length > 0 && (
        <div className="mb-10 page-break-inside-avoid">
          <h2 className="text-xl font-bold border-b border-slate-200 pb-2 mb-4">Registro de Férias</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border border-slate-200 font-semibold">Período Aquisitivo</th>
                <th className="p-2 border border-slate-200 font-semibold">Data Limite</th>
                <th className="p-2 border border-slate-200 font-semibold">Períodos Gozados</th>
                <th className="p-2 border border-slate-200 font-semibold">Saldo de Dias</th>
              </tr>
            </thead>
            <tbody>
              {employee.vacations.map((vac: any) => {
                const consumedDays = vac.periods?.reduce((acc: number, p: any) => acc + p.days, 0) || 0;
                const remainingDays = 30 - consumedDays;
                return (
                  <tr key={vac.id}>
                    <td className="p-2 border border-slate-200">
                      {format(new Date(vac.aquisitiveStart), 'dd/MM/yyyy')} a {format(new Date(vac.aquisitiveEnd), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-2 border border-slate-200">{format(new Date(vac.limitDate), 'dd/MM/yyyy')}</td>
                    <td className="p-2 border border-slate-200">
                      {vac.periods?.length > 0 ? vac.periods.map((p: any, i: number) => (
                        <div key={i} className="text-xs">
                          {p.days}d: {format(new Date(p.startDate), 'dd/MM')} a {format(new Date(p.endDate), 'dd/MM')}
                        </div>
                      )) : 'Nenhum'}
                    </td>
                    <td className="p-2 border border-slate-200 font-medium">{Math.max(0, remainingDays)} dias</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-16 text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
        Documento gerado pelo sistema Gestão RH. As informações contidas neste relatório são confidenciais.
      </div>
    </div>
  );
});

PrintableReport.displayName = 'PrintableReport';
