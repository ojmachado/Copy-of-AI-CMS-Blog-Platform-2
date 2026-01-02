
'use client';
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Edit2, Mail } from 'lucide-react';

const EmailNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="w-[140px] h-[60px] bg-white border-l-8 border-blue-600 rounded-xl shadow-lg flex items-center justify-between px-3 relative group hover:ring-2 hover:ring-blue-100 transition-all">
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-600 !border-white !border-2"
      />
      
      {/* Content */}
      <div className="flex items-center gap-3 overflow-hidden w-full">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg text-blue-600 shrink-0 shadow-inner">
            <Mail size={18} />
        </div>
        <div className="overflow-hidden flex flex-col">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-tight select-none">
            Email
            </span>
            <span className="text-[9px] text-slate-400 font-medium truncate leading-tight select-none italic">
            {data.subject || 'Configurar...'}
            </span>
        </div>
      </div>

      {/* Edit Button (Visible on Hover) */}
      <button 
        onClick={(e) => {
            e.stopPropagation();
            data.onEdit();
        }}
        className="hidden group-hover:flex absolute -top-2 -right-2 bg-blue-600 text-white p-1.5 rounded-lg shadow-xl hover:bg-blue-700 transition-transform hover:scale-110 z-10"
        title="Editar Conteúdo do E-mail"
      >
        <Edit2 size={12} />
      </button>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-600 !border-white !border-2"
      />
    </div>
  );
};

export default memo(EmailNode);
