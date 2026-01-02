
import { Funnel, FunnelExecution, FunnelNode, Lead } from '../types';
import { emailService } from './emailService';
import { whatsappService } from './whatsappService';
import { dbService } from './dbService';
import { v4 as uuidv4 } from 'uuid';

const FUNNELS_KEY = 'blog_platform_funnels';
const EXECUTIONS_KEY = 'blog_platform_funnel_executions';

export const funnelService = {
  
  getAllFunnels: async (): Promise<Funnel[]> => {
    const data = localStorage.getItem(FUNNELS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveFunnel: async (funnel: Funnel): Promise<void> => {
    const funnels = await funnelService.getAllFunnels();
    const index = funnels.findIndex(f => f.id === funnel.id);
    if (index >= 0) funnels[index] = funnel;
    else funnels.push(funnel);
    localStorage.setItem(FUNNELS_KEY, JSON.stringify(funnels));
  },

  deleteFunnel: async (id: string): Promise<void> => {
    let funnels = await funnelService.getAllFunnels();
    funnels = funnels.filter(f => f.id !== id);
    localStorage.setItem(FUNNELS_KEY, JSON.stringify(funnels));
  },

  createDefaultPostUpdateFunnel: async (): Promise<Funnel> => {
    const waTemplateId = uuidv4();
    const whatsappNodeId = uuidv4();
    const delayNodeId = uuidv4();
    const emailNodeId = uuidv4();

    await whatsappService.saveInternalTemplate({
        id: waTemplateId,
        title: 'Notificação: Novo Post',
        content: '🚀 *Novidade no Blog!*\n\nAcabei de publicar o artigo: "{{post_title}}"\n\nConfira agora mesmo: {{post_url}}',
        type: 'text'
    });

    const funnel: Funnel = {
        id: uuidv4(),
        name: 'Automação: Distribuição de Novos Posts',
        trigger: 'new_post_published',
        isActive: true,
        nodes: [
            {
                id: whatsappNodeId,
                type: 'WHATSAPP',
                position: { x: 100, y: 150 },
                data: { waTemplateId, waTemplateTitle: 'WA: Alerta Post', customTitle: 'Zap: Novo Post' },
                nextNodeId: delayNodeId
            },
            {
                id: delayNodeId,
                type: 'DELAY',
                position: { x: 350, y: 150 },
                data: { hours: 24, customTitle: 'Aguardar 24h' },
                nextNodeId: emailNodeId
            },
            {
                id: emailNodeId,
                type: 'EMAIL',
                position: { x: 600, y: 150 },
                data: {
                    subject: '🔥 Novo conteúdo: {{post_title}}',
                    content: 'Olá {{name}}, tem post novo no blog: <a href="{{post_url}}">{{post_title}}</a>',
                    customTitle: 'Email: Novo Post'
                },
                nextNodeId: null
            }
        ],
        startNodeId: whatsappNodeId
    };

    await funnelService.saveFunnel(funnel);
    return funnel;
  },

  triggerGlobalFunnel: async (trigger: string, contextData?: Record<string, string>) => {
    const { leadService } = await import('./leadService');
    const allLeads = await leadService.getAllLeads();
    const activeLeads = allLeads.filter(l => l.status === 'active');
    
    for (const lead of activeLeads) {
      await funnelService.triggerFunnel(trigger, lead, contextData);
    }
  },

  triggerFunnel: async (trigger: string, lead: Lead, contextData?: Record<string, string>) => {
    const funnels = await funnelService.getAllFunnels();
    const matchingFunnels = funnels.filter(f => f.isActive && f.trigger === trigger);

    if (matchingFunnels.length === 0) return;

    const executions = await funnelService._getAllExecutions();

    for (const funnel of matchingFunnels) {
      if (!funnel.nodes.length || !funnel.startNodeId) continue;

      const execution: FunnelExecution = {
        id: uuidv4(),
        funnelId: funnel.id,
        leadId: lead.id,
        currentNodeId: funnel.startNodeId,
        status: 'waiting',
        nextRunAt: new Date().toISOString(),
        history: [],
        context: contextData
      };

      executions.push(execution);
    }

    localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(executions));
    await funnelService.processExecutions();
  },

  processExecutions: async () => {
    const { leadService } = await import('./leadService');
    const executions = await funnelService._getAllExecutions();
    const funnels = await funnelService.getAllFunnels();
    const leads = await leadService.getAllLeads();
    const now = new Date();

    for (const exec of executions) {
      if (exec.status === 'completed') continue;
      
      if (new Date(exec.nextRunAt) > now) continue;

      const funnel = funnels.find(f => f.id === exec.funnelId);
      const lead = leads.find(l => l.id === exec.leadId);

      if (!funnel || !lead) {
        exec.status = 'completed';
        continue;
      }

      let currentNodeId: string | null | undefined = exec.currentNodeId;
      
      while (currentNodeId) {
        const node = funnel.nodes.find(n => n.id === currentNodeId);
        if (!node) break;

        if (node.type === 'WHATSAPP' && node.data.sendTime) {
            const [hours, minutes] = node.data.sendTime.split(':').map(Number);
            const targetTime = new Date();
            targetTime.setHours(hours, minutes, 0, 0);

            if (targetTime < now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            if (Math.abs(new Date(exec.nextRunAt).getTime() - targetTime.getTime()) > 60000) {
                exec.nextRunAt = targetTime.toISOString();
                exec.currentNodeId = node.id;
                break;
            }
        }

        const replace = (t: string) => {
            let r = t;
            if (exec.context) Object.entries(exec.context).forEach(([k, v]) => r = r.replace(new RegExp(`{{${k}}}`, 'g'), v));
            return r.replace(/{{name}}/g, lead.name || 'Leitor').replace(/{{email}}/g, lead.email);
        };

        try {
            if (node.type === 'EMAIL' && node.data.subject && node.data.content) {
                await emailService.sendManualNotification(lead.email, replace(node.data.subject), replace(node.data.content));
                currentNodeId = node.nextNodeId;
            } else if (node.type === 'WHATSAPP' && lead.phone && node.data.waTemplateId) {
                const tpl = await whatsappService.getInternalTemplateById(node.data.waTemplateId);
                if (tpl) await whatsappService.sendHybridMessage({
                    to: lead.phone,
                    templateName: 'FORCE_FALLBACK',
                    variables: [],
                    fallbackText: replace(tpl.content)
                });
                currentNodeId = node.nextNodeId;
            } else if (node.type === 'DELAY') {
                const hours = node.data.hours || 24;
                const nextRun = new Date();
                nextRun.setHours(nextRun.getHours() + hours);
                
                exec.nextRunAt = nextRun.toISOString();
                exec.currentNodeId = node.nextNodeId;
                break;
            } else if (node.type === 'CONDITION') {
                const target = node.data.conditionTarget || 'tags';
                const operator = node.data.conditionOperator || 'contains';
                const value = node.data.conditionValue || '';
                
                let result = false;
                if (target === 'tags') {
                    const leadTags = lead.tags || [];
                    result = operator === 'contains' 
                        ? leadTags.includes(value) 
                        : !leadTags.includes(value);
                }
                
                currentNodeId = result ? node.trueNodeId : node.falseNodeId;
            } else {
                currentNodeId = node.nextNodeId;
            }
        } catch (e) { break; }
      }

      if (!currentNodeId) exec.status = 'completed';
      else exec.currentNodeId = currentNodeId;
    }

    localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(executions));
  },

  _getAllExecutions: async (): Promise<FunnelExecution[]> => {
      const data = localStorage.getItem(EXECUTIONS_KEY);
      return data ? JSON.parse(data) : [];
  }
};
