
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  setDoc
} from 'firebase/firestore';
import { BlogPost, PostStatus, IntegrationSettings, ThemeSettings } from '../types';

export const dbService = {
  // --- Posts Methods ---
  getAllPosts: async (): Promise<BlogPost[]> => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  },

  getPublishedPosts: async (): Promise<BlogPost[]> => {
    const q = query(
      collection(db, 'posts'), 
      where('status', '==', PostStatus.PUBLISHED),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  },

  getPostBySlug: async (slug: string): Promise<BlogPost | undefined> => {
    const q = query(collection(db, 'posts'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return undefined;
    const docData = querySnapshot.docs[0];
    return { id: docData.id, ...docData.data() } as BlogPost;
  },

  getPostById: async (id: string): Promise<BlogPost | undefined> => {
    const docRef = doc(db, 'posts', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as BlogPost : undefined;
  },

  createPost: async (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> => {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'posts'), {
      ...post,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, ...post, createdAt: now, updatedAt: now } as BlogPost;
  },

  updatePost: async (id: string, updates: Partial<BlogPost>): Promise<void> => {
    const docRef = doc(db, 'posts', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  deletePost: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'posts', id));
  },

  // --- Settings Methods ---
  getSettings: async (): Promise<IntegrationSettings> => {
    const docSnap = await getDoc(doc(db, 'config', 'integrations'));
    if (docSnap.exists()) return docSnap.data() as IntegrationSettings;
    
    return {
      googleAnalyticsId: '', googleAdSenseId: '', facebookPixelId: '', metaAccessToken: '',
      siteUrl: '', googleSearchConsoleCode: '', metaWhatsappToken: '', metaPhoneId: '',
      metaBusinessId: '', evolutionApiUrl: '', evolutionApiKey: '', evolutionInstanceName: '',
      whatsappAdminNumber: '', resendApiKey: '', resendFromEmail: ''
    };
  },

  updateSettings: async (settings: IntegrationSettings): Promise<void> => {
    await setDoc(doc(db, 'config', 'integrations'), settings);
  },

  // --- Theme Methods ---
  getTheme: async (): Promise<ThemeSettings> => {
    const docSnap = await getDoc(doc(db, 'config', 'theme'));
    if (docSnap.exists()) return docSnap.data() as ThemeSettings;
    
    return {
      primaryColor: '#C4170C',
      secondaryColor: '#1e3a8a',
      logoUrl: '',
      siteName: 'AI News Portal'
    };
  },

  updateTheme: async (settings: ThemeSettings): Promise<void> => {
    await setDoc(doc(db, 'config', 'theme'), settings);
  }
};
