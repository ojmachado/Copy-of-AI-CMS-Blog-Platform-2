
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { dbService } from '../services/dbService';
import { metaCapiService } from '../services/metaCapiService';
import { BlogPost } from '../types';
import { Calendar, ArrowLeft, Clock, List, Share2, ChevronRight, User as UserIcon, BookOpen } from 'lucide-react';
import { AdUnit } from '../components/AdUnit';
import { useTheme } from '../contexts/ThemeContext';

const ReadingProgressBar = ({ width }: { width: number }) => {
  const { theme } = useTheme();

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-white/10 backdrop-blur-sm">
      <div 
        className="h-full transition-all duration-150 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]" 
        style={{ width: `${width}%`, backgroundColor: theme.primaryColor }} 
      />
    </div>
  );
};

export const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>('');
  const [width, setWidth] = useState(0);
  const { theme } = useTheme();

  const slugify = (text: string) => 
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const cleanContent = (content: string, titleToStrip: string) => {
    let cleaned = content
        .replace(/\\n/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .trim();

    const titleLower = titleToStrip.toLowerCase().trim();
    const firstLine = cleaned.split('\n')[0].toLowerCase().replace(/[#*]/g, '').trim();
    
    if (firstLine === titleLower || cleaned.startsWith(titleToStrip)) {
        cleaned = cleaned.split('\n').slice(1).join('\n').trim();
    }
    
    return cleaned;
  };

  const processedContent = useMemo(() => {
      if (!post) return '';
      return cleanContent(post.content, post.title);
  }, [post]);

  const toc = useMemo(() => {
    if (!processedContent) return [];
    const headings: { id: string; text: string; level: number }[] = [];
    const lines = processedContent.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^(#{2,3})\s+(.*)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[#*`_]/g, '').trim();
        headings.push({ id: slugify(text), text, level });
      }
    });
    return headings;
  }, [processedContent]);

  useEffect(() => {
    const scrollHandler = () => {
      const scrollTotal = window.scrollY;
      const heightWin = document.documentElement.scrollHeight - window.innerHeight;
      if (heightWin > 0) {
        const progress = (scrollTotal / heightWin) * 100;
        setWidth(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    scrollHandler();
    
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [loading]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      try {
        const data = await dbService.getPostBySlug(slug);
        setPost(data || null);
        if (data) metaCapiService.sendViewContent(data.title, data.slug);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (loading || !post || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -70% 0px' }
    );

    const headings = document.querySelectorAll('h2, h3');
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [loading, post, toc]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm font-medium">Carregando conteúdo premium...</p>
    </div>
  );

  if (!post) return <div className="text-center py-20 font-bold text-slate-400 text-xl">Artigo não encontrado.</div>;

  const wordCount = processedContent.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 225);

  const components = {
    h2: ({ children }: any) => {
      const id = slugify(children.toString());
      return <h2 id={id} className="scroll-mt-28 text-3xl font-black text-slate-900 mt-16 mb-8 tracking-tight leading-tight">{children}</h2>;
    },
    h3: ({ children }: any) => {
      const id = slugify(children.toString());
      return <h3 id={id} className="scroll-mt-28 text-xl font-bold text-slate-800 mt-10 mb-6 tracking-tight">{children}</h3>;
    },
    p: ({ children }: any) => (
      <p className="mb-8 leading-[1.85] text-slate-600 text-lg md:text-xl font-normal">
        {children}
      </p>
    ),
    strong: ({ children }: any) => <strong className="text-slate-950 font-bold">{children}</strong>,
    ul: ({ children }: any) => <ul className="list-disc pl-8 mb-10 space-y-4 text-slate-600 text-lg md:text-xl">{children}</ul>,
    li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/20 py-8 px-10 italic rounded-r-3xl mb-12 text-slate-700 text-xl md:text-2xl leading-relaxed">
        {children}
      </blockquote>
    )
  };

  return (
    <>
      <ReadingProgressBar width={width} />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 pt-12">
          
          {/* Main Content Area */}
          <article className="flex-1 min-w-0 pb-32">
            <Link to="/" className="inline-flex items-center text-slate-400 hover:text-indigo-600 mb-12 text-xs font-black uppercase tracking-widest transition-all group">
              <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
              Voltar para as notícias
            </Link>

            <header className="mb-16">
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mb-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                            <UserIcon size={16} strokeWidth={2} />
                        </div>
                        <span className="font-bold text-slate-900">{post.author || 'IA Agent'}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                    <span className="flex items-center gap-2 font-medium">
                        <Calendar size={14} /> 
                        {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-2 font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] uppercase">
                        <Clock size={12} /> 
                        {readTime} min de leitura
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {post.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                            {tag}
                        </span>
                    ))}
                </div>
                
                <div className="relative">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-12 tracking-tight">
                    {post.title}
                    </h1>
                    <div className="w-20 h-2 bg-indigo-600 rounded-full mb-16"></div>
                </div>
            </header>

            {post.coverImage && (
                <div className="relative mb-24 group">
                    <div className="absolute -inset-4 bg-indigo-500/5 rounded-[4rem] blur-2xl transition-all duration-700"></div>
                    <img src={post.coverImage} className="relative w-full rounded-[3rem] shadow-2xl shadow-indigo-100/40 aspect-video object-cover" alt={post.title} />
                </div>
            )}

            {/* Optimzed Prose Content */}
            <div className="max-w-[70ch] mx-auto lg:mx-0">
                <div className="prose prose-slate prose-lg md:prose-xl max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-indigo-600 prose-img:rounded-[2rem]">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={components}
                    >
                        {processedContent}
                    </ReactMarkdown>
                </div>
                
                <div className="mt-32 p-12 bg-slate-900 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <h4 className="font-black text-2xl mb-2">Gostou deste artigo?</h4>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">Compartilhe este insight tecnológico com sua rede.</p>
                        <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-3 mx-auto shadow-xl shadow-indigo-900/40">
                            <Share2 size={18} /> Compartilhar agora
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                </div>

                <AdUnit className="mt-24" />
            </div>
          </article>

          {/* Sticky Sidebar with TOC */}
          <aside className="w-full lg:w-80 lg:shrink-0 order-first lg:order-last mb-12 lg:mb-0">
              <div className="sticky top-28 space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-10 text-slate-900 relative overflow-hidden shadow-xl border border-slate-100">
                      <div className="relative z-10">
                          <h5 className="font-black text-[10px] uppercase tracking-widest mb-4 text-indigo-500 flex items-center gap-2">
                             <BookOpen size={12} /> Progresso
                          </h5>
                          <div className="flex items-baseline gap-2 mb-8">
                             <span className="text-6xl font-black leading-none">{Math.round(width)}</span>
                             <span className="text-xl font-bold opacity-30">%</span>
                          </div>
                          
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-10">
                            <div 
                                className="h-full bg-indigo-600 transition-all duration-300 ease-out" 
                                style={{ width: `${width}%` }}
                            ></div>
                          </div>

                          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                              <Share2 size={14} /> Salvar Favorito
                          </button>
                      </div>
                  </div>

                  {toc.length > 0 && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest text-[10px] text-indigo-500">
                            <List size={14} /> Índice
                        </h4>
                        <nav className="space-y-1">
                            {toc.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className={`group flex items-start gap-3 py-3 text-xs transition-all duration-300 rounded-xl px-3 -mx-3 ${
                                        item.id === activeId 
                                            ? 'text-indigo-600 font-black bg-indigo-50/50 translate-x-1' 
                                            : 'text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50'
                                    } ${item.level === 3 ? 'pl-8' : ''}`}
                                >
                                    <ChevronRight 
                                        size={12} 
                                        className={`mt-0.5 shrink-0 transition-all duration-300 ${
                                            item.id === activeId ? 'opacity-100 scale-100' : 'opacity-0 scale-50 -translate-x-2'
                                        }`} 
                                    />
                                    <span className="leading-snug">{item.text}</span>
                                </a>
                            ))}
                        </nav>
                    </div>
                  )}
              </div>
          </aside>
        </div>
      </div>
    </>
  );
};
