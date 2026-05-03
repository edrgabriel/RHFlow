import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, FileText, BrainCircuit, CheckCircle, AlertTriangle, Upload, X } from 'lucide-react';
import { API_URL } from '../config';

export function CandidatePortal() {
  const { token } = useParams();
  const [linkData, setLinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    mbti: '',
  });

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const res = await axios.get(`${API_URL}/recruitment/${token}`);
        setLinkData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Link inválido ou expirado.');
      } finally {
        setLoading(false);
      }
    };
    fetchLink();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocuments([...documents, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const formatCPF = (val: string) => {
    return val.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (val: string) => {
    return val.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cpf.replace(/\D/g, '').length !== 11) {
      alert('CPF inválido');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/candidates`, {
        ...formData,
        recruitmentLinkId: token,
        customAnswers,
        documents
      });
      setSubmitted(true);
    } catch (err: any) {
      alert('Erro: ' + (err.response?.data?.error || 'Não foi possível enviar candidatura.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10b981]"></div></div>;
  }

  if (error || !linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ops!</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-[#10b981] animate-in zoom-in duration-500">
          <CheckCircle size={64} className="text-[#10b981] mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Candidatura Enviada!</h1>
          <p className="text-slate-600">Seus dados foram registrados com sucesso. A equipe do RH entrará em contato em breve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-[#1e293b] text-white py-12 px-6 shadow-md">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6 opacity-80">
            <Briefcase size={24} />
            <span className="font-semibold tracking-wider uppercase text-sm">Portal de Admissão</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">{linkData.title}</h1>
          <p className="text-lg text-slate-300">{linkData.company.name}</p>
          
          {linkData.salaryInfo && (
            <div className="inline-block mt-4 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
              <p className="text-sm font-medium text-emerald-300">Remuneração: <span className="text-white">{linkData.salaryInfo}</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-slate-100">
          
          {linkData.description && (
            <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-xl">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Sobre a Vaga</h2>
              <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                {linkData.description}
              </div>
            </div>
          )}

          <div className="mb-8 border-b border-slate-100 pb-6">
            <h2 className="text-xl font-bold text-slate-800">Seus Dados Pessoais</h2>
            <p className="text-sm text-slate-500">Preencha com atenção as informações solicitadas pela empresa.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-mail *</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                  placeholder="exemplo@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Telefone / WhatsApp *</label>
                <input 
                  required
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">CPF *</label>
                <input 
                  required
                  type="text" 
                  value={formData.cpf}
                  onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                  placeholder="000.000.000-00"
                />
              </div>

              {linkData.requireMbti && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <BrainCircuit size={16} className="text-[#10b981]" /> 
                    Perfil MBTI *
                  </label>
                  <select 
                    required
                    value={formData.mbti}
                    onChange={e => setFormData({...formData, mbti: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                  >
                    <option value="">Selecione seu perfil...</option>
                    {['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {linkData.customQuestions && JSON.parse(linkData.customQuestions).length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Informações Adicionais</h3>
                  <p className="text-sm text-slate-500">Por favor, responda às perguntas extras referentes a esta vaga.</p>
                </div>
                
                <div className="space-y-6">
                  {JSON.parse(linkData.customQuestions).map((q: any) => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{q.question} *</label>
                      {q.type === 'yes_no' ? (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name={`q_${q.id}`} value="Sim" required onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.value})} className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]" /> Sim
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name={`q_${q.id}`} value="Não" required onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.value})} className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]" /> Não
                          </label>
                        </div>
                      ) : (
                        <textarea 
                          required
                          rows={2}
                          onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition-all"
                          placeholder="Sua resposta..."
                        ></textarea>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {linkData.requireDocuments && (
              <div className="pt-6 border-t border-slate-100">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500"/>
                    Anexos e Documentos
                  </h3>
                  <p className="text-sm text-slate-500">Envie seu RG, currículo ou certificados solicitados (PDF, JPG, PNG).</p>
                </div>

                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText size={20} className="text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{doc.name}</span>
                        <span className="text-xs text-slate-400 flex-shrink-0">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button type="button" onClick={() => removeDocument(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 hover:border-[#10b981] hover:bg-[#10b981]/5 rounded-xl cursor-pointer transition-colors group">
                    <Upload size={20} className="text-slate-400 group-hover:text-[#10b981]" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-[#10b981]">Clique para anexar arquivo</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}

            <div className="pt-8">
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-[#10b981] hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-[#10b981]/20 flex justify-center items-center gap-2"
              >
                {submitting ? 'Enviando...' : 'Enviar Candidatura'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
