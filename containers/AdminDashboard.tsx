
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { BlogPost, PostStatus } from '../types';
import { Plus, Trash2, Eye, Edit, Search, MessageSquare, Mail, GitFork, Layout as LayoutIcon, Users } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllPosts();
      setPosts(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Link to="/admin/create" className="flex flex-col items-center justify-center p-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">
          <Plus size={24} className="mb-2" />
          <span className="text-xs font-bold">Novo Post</span>
        </Link>
        <Link to="/admin/whatsapp" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-green-500 hover:text-green-600 transition-all"><MessageSquare size={24} className="mb-2" /><span className="text-xs font-bold">WhatsApp</span></Link>
        <Link to="/admin/email" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all"><Mail size={24} className="mb-2" /><span className="text-xs font-bold">E-mail</span></Link>
        <Link to="/admin/funnels" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-purple-500 hover:text-purple-600 transition-all"><GitFork size={24} className="mb-2" /><span className="text-xs font-bold">Funis</span></Link>
        <Link to="/admin/landing" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-pink-500 hover:text-pink-600 transition-all"><LayoutIcon size={24} className="mb-2" /><span className="text-xs font-bold">Landings</span></Link>
        <Link to="/admin/users" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-amber-500 hover:text-amber-600 transition-all"><Users size={24} className="mb-2" /><span className="text-xs font-bold">Usuários</span></Link>
      </div>

      <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-12 text-center text-slate-500">
            {loading ? <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div> : null}
            {posts.length === 0 && !loading ? "Nenhum post encontrado." : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Título</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {posts.map(post => (
                                <tr key={post.id}>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{post.title}</td>
                                    <td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-black rounded-full ${post.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{post.status}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={`/admin/edit/${post.id}`} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={18} /></Link>
                                            <Link to={`/post/${post.slug}`} className="p-2 text-slate-400 hover:text-blue-600"><Eye size={18} /></Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
