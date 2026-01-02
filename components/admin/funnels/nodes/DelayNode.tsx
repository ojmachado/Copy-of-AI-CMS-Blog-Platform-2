
'use client';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Edit2, Clock } from 'lucide-react';

const DelayNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="relative group">
      {/* Dimensões Estritas 128x50px para consistência visual */}
      <div className="w-[128px] h-[50px] bg-white border-l-4 border-amber-500 rounded shadow-sm flex items-center px-3 overflow-hidden transition-all hover:shadow-md">
        <div className="mr-2 text-amber-600 shrink-0">
          <Clock size={16} />
        </div>
        <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-bold text-slate-800 uppercase leading-tight select-none">
                Espera
            </span>
            <span className="text-[9px] text-slate-400 font-mono font-bold leading-tight select-none italic">
                {data.hours ? `${data.hours} horas` : '24 horas'}
            </span>
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="!bg-slate-400 w-2 h-2 !border-white" 
      />
      
      {/* Botão de Edição (Visível no Hover) */}
      <button 
        onClick={(e) => {
            e.stopPropagation();
            data.onEdit?.();
        }}
        className="hidden group-hover:flex absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-sm hover:bg-amber-600 transition-colors z-10"
        title="Configurar Atraso"
      >
        <Edit2 size={10} />
      </button>

      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable} 
        className="!bg-slate-400 w-2 h-2 !border-white" 
      />
    </div>
  );
};

export default memo(DelayNode);
