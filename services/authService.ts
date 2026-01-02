
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { User, AuthStep } from '../types';

const SUPER_ADMIN_EMAIL = 'ojmachadomkt@gmail.com';

export const authService = {
  checkEmailStatus: async (email: string): Promise<AuthStep> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', email.toLowerCase()));
      
      if (userDoc.exists()) {
        return AuthStep.PASSWORD;
      }

      if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        return AuthStep.CREATE_PASSWORD;
      }

      return AuthStep.BLOCKED;
    } catch (error: any) {
      console.error("[AuthService] Erro detalhado ao verificar e-mail:", error);
      
      // Se for o Super Admin e o erro for 'offline', tentamos permitir o fluxo de fallback
      // caso o banco ainda não tenha sido populado.
      if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          console.warn("[AuthService] Erro de conexão, mas permitindo fluxo para Super Admin.");
          return AuthStep.CREATE_PASSWORD;
      }
      
      throw error;
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
    
    try {
        const userDoc = await getDoc(doc(db, 'users', email.toLowerCase()));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          await setDoc(doc(db, 'users', email.toLowerCase()), { 
            ...userData, 
            lastSignInTime: new Date().toISOString() 
          }, { merge: true });
          
          return { ...userData, email: userCredential.user.email! };
        }
    } catch (e) {
        console.warn("[AuthService] Logado no Auth, mas falha ao ler Firestore:", e);
    }
    
    // Retorno de emergência caso o Auth funcione mas o Firestore falhe
    return { email: userCredential.user.email!, role: 'admin', createdAt: new Date().toISOString() };
  },

  registerSuperAdmin: async (email: string, password: string): Promise<User> => {
    if (email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Registro restrito ao Super Admin.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
    const now = new Date().toISOString();
    
    const newUser: User = {
      email: email.toLowerCase(),
      role: 'admin',
      createdAt: now,
      lastSignInTime: now
    };

    try {
        await setDoc(doc(db, 'users', email.toLowerCase()), newUser);
    } catch (e) {
        console.error("[AuthService] Falha ao registrar perfil no Firestore:", e);
    }
    
    return newUser;
  },

  addUser: async (email: string, role: 'admin' | 'editor'): Promise<void> => {
    const newUser: User = {
      email: email.toLowerCase(),
      role,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', email.toLowerCase()), newUser);
  },

  logout: async () => {
    await signOut(auth);
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => doc.data() as User);
    } catch (e) {
        console.error("Falha ao listar usuários:", e);
        return [];
    }
  },

  deleteUser: async (emailToDelete: string): Promise<void> => {
    if (emailToDelete.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error("AÇÃO PROIBIDA: Não é possível deletar a conta Super Admin.");
    }
    await deleteDoc(doc(db, 'users', emailToDelete.toLowerCase()));
  }
};
