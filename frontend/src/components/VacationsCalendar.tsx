import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface VacationsCalendarProps {
  vacations: any[];
}

export function VacationsCalendar({ vacations }: VacationsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Extract all periods across all vacations
  const allPeriods = vacations.flatMap(vac => 
    vac.periods.map((p: any) => ({
      ...p,
      employeeName: vac.employee.name,
      employeeRole: vac.employee.cargo,
      status: vac.status,
      colorClass: vac.status === 'GOZADAS' ? 'bg-[#10b981]' : 'bg-blue-500' // Visual distinction
    }))
  );

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600"
          >
            Hoje
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-t-xl overflow-hidden border border-slate-200">
        {days.map((day, i) => (
          <div key={i} className="bg-slate-50 text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-200 border-x border-b border-slate-200 rounded-b-xl overflow-hidden">
        {days.map(day => {
          // Find periods overlapping this day
          const dayPeriods = allPeriods.filter(period => {
            try {
              const start = parseISO(period.startDate);
              // Include the end day fully
              const end = parseISO(period.endDate);
              end.setHours(23, 59, 59, 999);
              return isWithinInterval(day, { start, end });
            } catch (e) {
              return false;
            }
          });

          return (
            <div 
              key={day.toString()} 
              className={clsx(
                "min-h-[100px] bg-white p-2 transition-colors relative group",
                !isSameMonth(day, monthStart) && "bg-slate-50 opacity-50",
                isSameDay(day, new Date()) && "bg-blue-50/30"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={clsx(
                  "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isSameDay(day, new Date()) ? "bg-blue-600 text-white" : "text-slate-700"
                )}>
                  {format(day, dateFormat)}
                </span>
              </div>
              
              <div className="space-y-1 mt-2">
                {dayPeriods.map((period, i) => (
                  <div 
                    key={i} 
                    className={clsx("text-[10px] text-white px-1.5 py-0.5 rounded truncate", period.colorClass)}
                    title={`${period.employeeName} - ${period.employeeRole}`}
                  >
                    {period.employeeName.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div> Férias Agendadas
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#10b981]"></div> Férias Gozadas
        </div>
      </div>
    </div>
  );
}
