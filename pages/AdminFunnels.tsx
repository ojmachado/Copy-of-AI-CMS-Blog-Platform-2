
import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  BackgroundVariant,
  Panel,
  MarkerType
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import { funnelService } from '../services/funnelService';
import { Funnel, FunnelNode, FunnelNodeType } from '../types';
import EmailNode from '../components/admin/funnels/nodes/EmailNode';
import DelayNode from '../components/admin/funnels/nodes/DelayNode';
import WhatsAppNode from '../components/admin/funnels/nodes/WhatsAppNode';
import ConditionNode from '../components/admin/funnels/nodes/ConditionNode';
import ButtonEdge from '../components/admin/funnels/edges/ButtonEdge';
import { EmailPickerModal } from '../components/admin/funnels/EmailPickerModal';
import { MessagePickerModal } from '../components/admin/funnels/MessagePickerModal';
import { DelayPickerModal } from '../components/admin/funnels/DelayPickerModal';
import { ConditionPickerModal } from '../components/admin/funnels/ConditionPickerModal';
import { Plus, Save, ArrowLeft, MessageCircle, PlayCircle, Zap, Loader2, Edit3, Trash2, CheckCircle, Clock, Split } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  EMAIL: EmailNode,
  DELAY: DelayNode, 
  WHATSAPP: WhatsAppNode,
  CONDITION: ConditionNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

export const AdminFunnels: React.FC = () => {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);

  const postUpdateFunnel = funnels.find(f => f.trigger === 'new_post_published');

  useEffect(() => {
    loadFunnels();
  }, []);

  const loadFunnels = async () => {
    setLoading(true);
    const data = await funnelService.getAllFunnels();
    setFunnels(data);
    setLoading(false);
  };

  const handleCreateFunnel = () => {
    const newFunnel: Funnel = {
        id: uuidv4(),
        name: 'Novo Funil Automático',
        trigger: 'lead_subscribed',
        isActive: true,
        nodes: [],
        startNodeId: ''
    };
    handleEditFunnel(newFunnel);
  };

  const handleEditFunnel = (funnel: Funnel) => {
      setEditingFunnel(funnel);
      const flowNodes: Node[] = funnel.nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position || { x: 0, y: 0 },
          data: { 
              ...n.data, 
              label: n.type === 'WHATSAPP' ? (n.data.waTemplateTitle || 'Mensagem Zap') : (n.data.customTitle || n.data.subject || n.type),
              onEdit: () => openEditModal(n.id, n.type) 
          }
      }));
      const flowEdges: Edge[] = [];
      funnel.nodes.forEach(n => {
          if (n.nextNodeId) flowEdges.push({ 
            id: `e${n.id}-${n.nextNodeId}`, 
            source: n.id, 
            target: n.nextNodeId,
            type: 'buttonEdge',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
          if (n.trueNodeId) flowEdges.push({
            id: `e${n.id}-true-${n.trueNodeId}`,
            source: n.id,
            sourceHandle: 'true',
            target: n.trueNodeId,
            type: 'buttonEdge',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
          if (n.falseNodeId) flowEdges.push({
            id: `e${n.id}-false-${n.falseNodeId}`,
            source: n.id,
            sourceHandle: 'false',
            target: n.falseNodeId,
            type: 'buttonEdge',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
      });
      setNodes(flowNodes);
      setEdges(flowEdges);
  };

  const handleCreateDefaultFunnel = async () => {
      if (postUpdateFunnel) {
          handleEditFunnel(postUpdateFunnel);
          return;
      }
      setIsInitializing(true);
      try {
          const funnel = await funnelService.createDefaultPostUpdateFunnel();
          await loadFunnels();
          handleEditFunnel(funnel);
      } finally {
          setIsInitializing(false);
      }
  };

  const handleDeleteFunnel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este funil?')) return;
    await funnelService.deleteFunnel(id);
    loadFunnels();
  };

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({
    ...params,
    type: 'buttonEdge',
    markerEnd: { type: MarkerType.ArrowClosed }
  }, eds)), [setEdges]);

  const addNode = (type: FunnelNodeType) => {
      const id = uuidv4();
      const position = { x: 100, y: 100 };
      const newNode: Node = {
          id, type, position,
          data: { 
              label: type === 'WHATSAPP' ? 'Mensagem WhatsApp' : type === 'DELAY' ? 'Aguardar 24h' : type === 'CONDITION' ? 'Se possuir Tag...' : type,
              customTitle: type,
              hours: type === 'DELAY' ? 24 : undefined,
              onEdit: () => openEditModal(id, type)
          }
      };
      setNodes((nds) => nds.concat(newNode));
  };

  const openEditModal = (nodeId: string, type: string) => {
      setActiveNodeId(nodeId);
      if (type === 'EMAIL') setIsEmailModalOpen(true);
      else if (type === 'WHATSAPP') setIsWAModalOpen(true);
      else if (type === 'DELAY') setIsDelayModalOpen(true);
      else if (type === 'CONDITION') setIsConditionModalOpen(true);
  };

  const handleSave = async () => {
      if (!editingFunnel) return;
      setSaving(true);
      setSaveSuccess(false);

      try {
          const funnelNodes: FunnelNode[] = nodes.map(n => {
              const outgoingEdge = edges.find(e => e.source === n.id && !e.sourceHandle);
              const trueEdge = edges.find(e => e.source === n.id && e.sourceHandle === 'true');
              const falseEdge = edges.find(e => e.source === n.id && e.sourceHandle === 'false');
              
              const cleanData = { ...n.data };
              delete cleanData.onEdit;

              return {
                  id: n.id,
                  type: n.type as FunnelNodeType,
                  position: n.position,
                  data: cleanData,
                  nextNodeId: outgoingEdge?.target || null,
                  trueNodeId: trueEdge?.target || null,
                  falseNodeId: falseEdge?.target || null
              };
          });

          const targetIds = new Set(edges.map(e => e.target));
          const startNode = funnelNodes.find(n => !targetIds.has(n.id)) || funnelNodes[0];

          const updatedFunnel: Funnel = {
              ...editingFunnel,
              nodes: funnelNodes,
              startNodeId: startNode?.id || ''
          };

          await funnelService.saveFunnel(updatedFunnel);
          setSaveSuccess(true);
          
          setTimeout(() => {
            setSaveSuccess(false);
            setEditingFunnel(null);
            loadFunnels();
          }, 1500);

      } catch (error) {
          console.error("Erro ao salvar fluxo:", error);
          alert("Ocorreu um erro ao salvar o funil.");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {editingFunnel ? (
          <div className="h-[calc(100vh-100px)] flex flex-col bg-slate-50 -mx-4 -mt-8 -mb-8 lg:-mx-8">
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setEditingFunnel(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20} /></button>
                      <div>
                          <input 
                            value={editingFunnel.name}
                            onChange={(e) => setEditingFunnel({...editingFunnel, name: e.target.value})}
                            className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-600 outline-none text-xl px-1"
                          />
                          <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">
                              Trigger: {editingFunnel.trigger.replace(/_/g, ' ')}
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {saveSuccess && (
                      <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold animate-in fade-in slide-in-from-right-2">
                        <CheckCircle size={18} /> Fluxo Salvo!
                      </div>
                    )}
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} 
                        {saving ? 'Salvando...' : 'Salvar Fluxo'}
                    </button>
                  </div>
              </div>

              <div className="flex-1 w-full relative">
                  <ReactFlow 
                    nodes={nodes} 
                    edges={edges} 
                    onNodesChange={onNodesChange} 
                    onEdgesChange={onEdgesChange} 
                    onConnect={onConnect} 
                    nodeTypes={nodeTypes} 
                    edgeTypes={edgeTypes}
                    fitView
                  >
                      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
                      <Controls />
                      <Panel position="top-left" className="bg-white/95 backdrop-blur p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-1 m-4">
                          <button onClick={() => addNode('WHATSAPP')} className="p-3 hover:bg-green-50 text-green-600 rounded-xl flex items-center gap-3 transition-colors">
                              <MessageCircle size={18} /> <span className="text-xs font-bold uppercase tracking-tight">WhatsApp</span>
                          </button>
                          <button onClick={() => addNode('EMAIL')} className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl flex items-center gap-3 transition-colors">
                              <Plus size={18} /> <span className="text-xs font-bold uppercase tracking-tight">Email</span>
                          </button>
                          <button onClick={() => addNode('DELAY')} className="p-3 hover:bg-amber-50 text-amber-600 rounded-xl flex items-center gap-3 transition-colors">
                              <Clock size={18} /> <span className="text-xs font-bold uppercase tracking-tight">Espera</span>
                          </button>
                          <button onClick={() => addNode('CONDITION')} className="p-3 hover:bg-purple-50 text-purple-600 rounded-xl flex items-center gap-3 transition-colors">
                              <Split size={18} /> <span className="text-xs font-bold uppercase tracking-tight">Se/Senão</span>
                          </button>
                      </Panel>
                  </ReactFlow>
              </div>

              <EmailPickerModal 
                isOpen={isEmailModalOpen} 
                onClose={() => setIsEmailModalOpen(false)} 
                onSave={(s, c) => setNodes((nds) => nds.map(n => n.id === activeNodeId ? { ...n, data: { ...n.data, subject: s, content: c, customTitle: s.substring(0, 15), label: s.substring(0, 20) } } : n))} 
                initialSubject={nodes.find(n => n.id === activeNodeId)?.data?.subject} 
                initialContent={nodes.find(n => n.id === activeNodeId)?.data?.content} 
              />
              <MessagePickerModal 
                isOpen={isWAModalOpen} 
                onClose={() => setIsWAModalOpen(false)} 
                onSelect={(id, title, time) => setNodes((nds) => nds.map(n => n.id === activeNodeId ? { ...n, data: { ...n.data, waTemplateId: id, waTemplateTitle: title, sendTime: time, label: title } } : n))} 
                initialTemplateId={nodes.find(n => n.id === activeNodeId)?.data?.waTemplateId} 
                initialSendTime={nodes.find(n => n.id === activeNodeId)?.data?.sendTime}
              />
              <DelayPickerModal 
                isOpen={isDelayModalOpen}
                onClose={() => setIsDelayModalOpen(false)}
                initialHours={nodes.find(n => n.id === activeNodeId)?.data?.hours}
                onSave={(h) => setNodes((nds) => nds.map(n => n.id === activeNodeId ? { ...n, data: { ...n.data, hours: h, label: `Esperar ${h}h` } } : n))}
              />
              <ConditionPickerModal
                isOpen={isConditionModalOpen}
                onClose={() => setIsConditionModalOpen(false)}
                initialTarget={nodes.find(n => n.id === activeNodeId)?.data?.conditionTarget}
                initialOperator={nodes.find(n => n.id === activeNodeId)?.data?.conditionOperator}
                initialValue={nodes.find(n => n.id === activeNodeId)?.data?.conditionValue}
                onSave={(t, o, v) => setNodes((nds) => nds.map(n => n.id === activeNodeId ? { ...n, data: { ...n.data, conditionTarget: t, conditionOperator: o, conditionValue: v, label: `Se ${t} ${o} ${v}` } } : n))}
              />
          </div>
      ) : (
          <>
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Funis de Automação</h1>
                    <p className="text-slate-500 mt-2 text-lg">Gerencie a jornada automática dos seus leitores.</p>
                </div>
                <button onClick={handleCreateFunnel} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"><Plus size={20} /> Novo Funil</button>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-10 overflow-hidden relative shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Zap size={350} /></div>
                <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="bg-amber-400 text-indigo-950 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-amber-400/20">
                            <Zap size={12} className="fill-current" /> Altamente Recomendado
                        </span>
                    </div>
                    <h3 className="text-4xl font-black mb-4 tracking-tight">Distribuição de Novos Posts</h3>
                    <p className="text-indigo-100 mb-10 text-lg max-w-xl leading-relaxed opacity-90">
                        Configure o fluxo que notifica automaticamente seus inscritos no <strong>WhatsApp</strong> e <strong>Email</strong> toda vez que um novo artigo for publicado. Use as variáveis <code>{`{{post_title}}`}</code> e <code>{`{{post_url}}`}</code>.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 text-sm font-semibold backdrop-blur-sm">
                            <MessageCircle size={16} className="text-green-400" /> WhatsApp + Email
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 text-sm font-semibold backdrop-blur-sm">
                            <Zap size={16} className="text-amber-400" /> Gatilho Global
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleCreateDefaultFunnel}
                    disabled={isInitializing}
                    className="whitespace-nowrap bg-white text-indigo-950 px-10 py-5 rounded-[1.5rem] font-black hover:bg-indigo-50 transition-all shadow-2xl flex items-center gap-3 transform hover:scale-105 active:scale-95 text-lg"
                >
                    {isInitializing ? <Loader2 className="animate-spin" size={24} /> : (postUpdateFunnel ? <Edit3 size={24} /> : <Zap size={24} />)}
                    {postUpdateFunnel ? 'Editar Automação' : 'Configurar Agora'}
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {funnels.filter(f => f.trigger !== 'new_post_published').map(funnel => (
                    <div key={funnel.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group flex flex-col h-full hover:shadow-2xl hover:shadow-indigo-50 relative overflow-hidden" onClick={() => handleEditFunnel(funnel)}>
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="font-bold text-slate-900 text-xl pr-10">{funnel.name}</h3>
                            <div className={`w-3 h-3 rounded-full shadow-sm ${funnel.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        </div>
                        <div className="flex items-center gap-2 mb-6 text-slate-500">
                            <PlayCircle size={16} className="text-indigo-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">{funnel.trigger.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-6">
                            <span className="text-indigo-600 text-sm font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-block">Personalizar</span>
                            <ArrowLeft size={20} className="rotate-180 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        
                        <button 
                            onClick={(e) => handleDeleteFunnel(funnel.id, e)}
                            className="absolute top-8 right-8 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                
                {funnels.length <= 1 && !loading && (
                    <div className="col-span-full text-center py-20 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-300 flex flex-col items-center">
                        <div className="bg-white p-6 rounded-full shadow-xl mb-6"><MessageCircle size={56} className="text-slate-200" /></div>
                        <h3 className="text-slate-900 font-black text-2xl">Crie sua própria jornada</h3>
                        <p className="text-slate-500 text-sm mt-3 mb-10 max-w-sm leading-relaxed">
                            Capture o interesse dos seus leads e transforme curiosidade em conversão com fluxos automáticos.
                        </p>
                        <button onClick={handleCreateFunnel} className="bg-white border border-slate-200 text-slate-900 px-12 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-lg text-lg">Começar do Zero</button>
                    </div>
                )}
            </div>
          </>
      )}
    </div>
  );
};
