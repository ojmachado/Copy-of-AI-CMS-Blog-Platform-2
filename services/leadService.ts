
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { Lead, PipelineStage } from '../types';
import { metaCapiService, sha256 } from './metaCapiService';
import { emailService } from './emailService';
import { funnelService } from './funnelService';

export const leadService = {
  subscribe: async (email: string, source: string, name?: string, phone?: string): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();
    const externalId = await sha256(normalizedEmail);
    
    const leadRef = doc(db, 'leads', normalizedEmail);
    const leadSnap = await getDoc(leadRef);

    let savedLead: Lead;

    if (leadSnap.exists()) {
      const existing = leadSnap.data() as Lead;
      savedLead = {
        ...existing,
        name: name || existing.name,
        source,
        status: 'active',
        phone: phone || existing.phone
      };
      await updateDoc(leadRef, savedLead as any);
    } else {
      savedLead = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name: name || '',
        phone: phone || '',
        externalId: externalId,
        source: source,
        status: 'active',
        pipelineStage: 'new',
        tags: [],
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      await setDoc(leadRef, savedLead);
    }

    // Async tasks
    metaCapiService.sendMetaEvent('Lead', { 
      content_name: 'Nova Assinatura Newsletter', 
      content_category: 'Geração de Lead' 
    }, crypto.randomUUID(), externalId).catch(console.error);

    emailService.sendWelcome(normalizedEmail, name || normalizedEmail.split('@')[0]).catch(console.error);
    funnelService.triggerFunnel('lead_subscribed', savedLead).catch(console.error);
  },

  getAllLeads: async (): Promise<Lead[]> => {
    const querySnapshot = await getDocs(collection(db, 'leads'));
    return querySnapshot.docs.map(doc => doc.data() as Lead);
  },

  updateStage: async (leadId: string, newStage: PipelineStage): Promise<void> => {
    // Busca o lead por ID (Firestore usa email como ID no nosso caso ou ID gerado)
    // Para simplificar CRM, assumimos que passamos o ID real do doc
    const q = query(collection(db, 'leads'), where('id', '==', leadId));
    const snap = await getDocs(q);
    
    if (snap.empty) return;
    const leadDoc = snap.docs[0];
    const lead = leadDoc.data() as Lead;

    if (lead.pipelineStage !== newStage) {
        await updateDoc(leadDoc.ref, { pipelineStage: newStage });

        // CAPI tracking logic remains...
        let metaEventName = '';
        if (newStage === 'contacted') metaEventName = 'Contact';
        else if (newStage === 'qualified') metaEventName = 'Schedule';
        else if (newStage === 'converted') metaEventName = 'Purchase';

        if (metaEventName && lead.externalId) {
            metaCapiService.sendMetaEvent(metaEventName, { content_name: `CRM Stage: ${newStage}` }, `crm_${Date.now()}`, lead.externalId);
        }
    }
  },

  updateLead: async (leadId: string, updates: Partial<Lead>): Promise<Lead> => {
    const q = query(collection(db, 'leads'), where('id', '==', leadId));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Lead not found");
    
    const leadDoc = snap.docs[0];
    await updateDoc(leadDoc.ref, updates);
    return { ...leadDoc.data(), ...updates } as Lead;
  },

  addTag: async (leadId: string, tag: string): Promise<void> => {
    const q = query(collection(db, 'leads'), where('id', '==', leadId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const leadDoc = snap.docs[0];
      const tags = leadDoc.data().tags || [];
      if (!tags.includes(tag)) {
        const newTags = [...tags, tag];
        await updateDoc(leadDoc.ref, { tags: newTags });
        funnelService.triggerFunnel(`tag_added:${tag}`, { ...leadDoc.data(), tags: newTags } as Lead);
      }
    }
  }
};
