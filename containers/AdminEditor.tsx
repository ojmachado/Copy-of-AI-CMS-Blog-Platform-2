
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SimpleMDE from "react-simplemde-editor";
import { aiService } from '../services/aiService';
import { dbService } from '../services/dbService';
import { PostStatus, BlogPost } from '../types';
import { Sparkles, Loader2, ArrowLeft, Zap, CheckCircle, ImageIcon } from 'lucide-react';

export const AdminEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedData, setGeneratedData] = useState<Partial<BlogPost> | null>(null);

  useEffect(() => {
    if (id) dbService.getPostById(id).then(post => post && setGeneratedData(post));
  }, [id]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const result = await aiService.generateFullPost(topic);
      setGeneratedData({ ...result, status: PostStatus.DRAFT, author: 'IA Agent' });
    } catch (err) { alert("Erro na geração."); }
    finally { setIsGenerating(false); }
  };

  const handleSave = async (status: PostStatus) => {
    if (!generatedData?.title) return;
    setIsSaving(true);
    try {
      const payload = { ...generatedData, status, updatedAt: new Date().toISOString() } as BlogPost;
      if (id) await dbService.updatePost(id, payload);
      else await dbService.createPost(payload);
      navigate('/admin');
    } catch (err) { alert("Falha ao salvar."); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {!generatedData ? (
          <div className="bg-white p-20 rounded-[3rem] shadow-xl text-center space-y-8 max-w-4xl mx-auto border border-indigo-50">
              <Sparkles size={48} className="mx-auto text-indigo-600" />
              <h2 className="text-4xl font-black text-slate-900">O que vamos publicar?</h2>
              <div className="flex gap-4 max-w-2xl mx-auto">
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 p-5 border border-slate-200 rounded-2xl text-lg" placeholder="Tópico do post..." />
                  <button onClick={handleGenerate} disabled={isGenerating} className="bg-indigo-600 text-white px-8 rounded-2xl font-black text-xl hover:bg-indigo-700 disabled:opacity-50">
                    {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                  </button>
              </div>
          </div>
      ) : (
          <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  <button onClick={() => setGeneratedData(null)} className="flex items-center gap-2 text-slate-400"><ArrowLeft size={20}/> Voltar</button>
                  <div className="flex gap-3">
                      <button onClick={() => handleSave(PostStatus.DRAFT)} disabled={isSaving} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold">Salvar Rascunho</button>
                      <button onClick={() => handleSave(PostStatus.PUBLISHED)} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100">
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} Publicar
                      </button>
                  </div>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 space-y-8">
                  <input type="text" value={generatedData.title} onChange={e => setGeneratedData({...generatedData, title: e.target.value})} className="w-full text-4xl font-black border-none focus:ring-0 text-slate-900 p-0" />
                  <SimpleMDE value={generatedData.content} onChange={v => setGeneratedData({...generatedData, content: v})} />
              </div>
          </div>
      )}
    </div>
  );
};
