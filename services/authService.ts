import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'customer' | 'superadmin';
}

// Alias para claridad semántica
export type AdminUser = AppUser;

/** Returns true if the role has admin-level access (admin or superadmin) */
export const hasAdminAccess = (role: AppUser['role']): boolean =>
  role === 'admin' || role === 'superadmin';

export const signIn = async (email: string, password: string): Promise<AppUser> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) {
    throw new Error('Usuario sin rol asignado');
  }

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    role: snap.data().role,
  };
};

export const onAuthChange = (callback: (user: AppUser | null) => void) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      callback(null);
      return;
    }

    const userData = snap.data();
    const appUser: AppUser = {
      uid: user.uid,
      email: user.email,
      role: userData.role,
    };

    // SECURITY: Only return user if they have admin role
    // This prevents customers from being set as adminUser in App.tsx
    if (appUser.role === 'admin' || appUser.role === 'superadmin') {
      callback(appUser);
    } else {
      callback(null);
    }
  });

export const signOutUser = () => signOut(auth);

