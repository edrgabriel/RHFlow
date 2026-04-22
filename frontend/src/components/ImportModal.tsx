import { useState, useRef } from 'react';
import axios from 'axios';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({
        imported: response.data.imported,
        errors: response.data.errors || []
      });
    } catch (error: any) {
      console.error('Error importing file', error);
      alert(`Erro ao importar: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Importar Colaboradores</h2>
            <p className="text-sm text-slate-500 mt-1">Faça o upload de uma planilha (.xlsx)</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!result ? (
            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${file ? 'border-[#10b981] bg-emerald-50/50' : 'border-slate-300 hover:border-[#10b981] hover:bg-slate-50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileSpreadsheet size={48} className="text-[#10b981] mb-4" />
                    <p className="font-semibold text-slate-800 text-lg">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <p className="text-[#10b981] text-sm font-medium mt-4">Clique para trocar de arquivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Upload size={32} className="text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-700 text-lg">Clique ou arraste a planilha aqui</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                      O arquivo deve conter as colunas: <strong>Nome, CPF, Cargo, EmpresaID</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Atenção ao formato</p>
                  <p>Certifique-se de que os CPFs contêm apenas números ou estão formatados corretamente. O EmpresaID deve ser o ID (UUID) exato da empresa no sistema.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle2 size={64} className="text-[#10b981] mb-4" />
                <h3 className="text-2xl font-bold text-slate-800">Importação Concluída</h3>
                <p className="text-lg text-slate-600 mt-2">
                  <strong className="text-[#10b981]">{result.imported}</strong> colaboradores importados com sucesso.
                </p>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-3">
                    <AlertCircle size={18} />
                    <span>Falhas na importação ({result.errors.length})</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-2 max-h-40 overflow-y-auto pl-5 list-disc">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          {result ? (
            <button 
              onClick={() => {
                onSuccess();
                onClose();
              }} 
              className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              Fechar e Atualizar
            </button>
          ) : (
            <>
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleImport}
                disabled={!file || loading}
                className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Processando...' : (
                  <>
                    <Upload size={18} />
                    Iniciar Importação
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
