
import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { LandingPage } from '../types';
import { Sparkles, Layout, Link as LinkIcon, ShoppingCart, Users, Eye, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const AdminLandingGenerator: React.FC = () => {
  const { theme } = useTheme();
  const [data, setData] = useState<LandingPage>({
    subject: '',
    ctaText: 'Quero aproveitar agora',
    generalLink: '',
    salesContext: '',
    salesLink: '',
    partnerLink: '',
    generatedHtml: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!data.subject.trim()) return;
    setIsGenerating(true);
    try {
      const html = await aiService.generateLandingPage(data);
      setData(prev => ({ ...prev, generatedHtml: html }));
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar landing page.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (data.generatedHtml) {
      navigator.clipboard.writeText(data.generatedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Layout className="text-indigo-600" /> Gerador de Landing Pages
          </h1>
          <p className="text-slate-500 mt-1">Crie páginas de alta conversão injetando seus links automaticamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Assunto da Página
              </label>
              <textarea
                name="subject"
                value={data.subject}
                onChange={handleChange}
                placeholder="Ex: Treinamento avançado de Marketing Digital com IA para negócios locais."
                rows={3}
                className="w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Layout size={16} className="text-indigo-600" /> Texto da CTA
                </label>
                <input
                  type="text"
                  name="ctaText"
                  value={data.ctaText}
                  onChange={handleChange}
                  className="w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <LinkIcon size={16} className="text-indigo-600" /> Link Geral (Site)
                </label>
                <input
                  type="text"
                  name="generalLink"
                  value={data.generalLink}
                  onChange={handleChange}
                  placeholder="https://meusite.com"
                  className="w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <ShoppingCart size={16} className="text-indigo-600" /> Contexto de Vendas
              </label>
              <textarea
                name="salesContext"
                value={data.salesContext}
                onChange={handleChange}
                placeholder="O que você está vendendo? Detalhes do produto/serviço..."
                rows={3}
                className="w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-green-600" /> Link de Vendas
                </label>
                <input
                  type="text"
                  name="salesLink"
                  value={data.salesLink}
                  onChange={handleChange}
                  placeholder="https://linkdepagamento.com"
                  className="w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Users size={16} className="text-amber-600" /> Link de Parceiro/Afiliado
                </label>
                <input
                  type="text"
                  name="partnerLink"
                  value={data.partnerLink}
                  onChange={handleChange}
                  placeholder="https://parceiro.com/ref=123"
                  className="w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 border p-3 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !data.subject.trim()}
            className="w-full py-4 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {isGenerating ? 'Criando sua página...' : 'Gerar Estrutura Persuasiva'}
          </button>
        </div>

        {/* Preview / Result */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-100 p-2 rounded-xl">
             <div className="flex gap-2">
                <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><Eye size={18} /></div>
                <span className="text-sm font-bold text-slate-600 self-center">Visualização da Estrutura</span>
             </div>
             {data.generatedHtml && (
                <button onClick={handleCopy} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">
                    {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar Código HTML'}
                </button>
             )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 h-[650px] overflow-y-auto shadow-inner relative">
            {!data.generatedHtml && !isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                    <Layout size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">Preencha os campos ao lado para gerar sua Landing Page de alta conversão.</p>
                </div>
            )}
            {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                    <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                    <p className="text-indigo-900 font-bold">Acelerando a Inteligência...</p>
                </div>
            )}
            {data.generatedHtml && (
                <div 
                    className="landing-preview-container p-0"
                    dangerouslySetInnerHTML={{ __html: data.generatedHtml }} 
                />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
