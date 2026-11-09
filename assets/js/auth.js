/**
 * ResearchX - Authentication Service
 * Firebase Auth State Management, Email/Password, Google Auth, and User Profiles
 */

import { getAuth, getDatabase } from './firebase.js';

export class AuthService {
  /**
   * Listen to Firebase auth state changes
   */
  static onAuthStateChanged(callback) {
    const auth = getAuth();
    return auth.onAuthStateChanged(user => {
      callback(user);
    });
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser() {
    return getAuth().currentUser;
  }

  /**
   * Register new user with Email, Password, and Display Name
   */
  static async register(name, email, password) {
    const auth = getAuth();
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;

    // Update display name on auth profile
    if (name) {
      await user.updateProfile({ displayName: name });
    }

    // Persist user profile in Firebase Realtime Database
    await this.syncUserProfile(user, name);
    return user;
  }

  /**
   * Sign in with Email and Password
   */
  static async login(email, password) {
    const auth = getAuth();
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await this.syncUserProfile(cred.user);
    return cred.user;
  }

  /**
   * Sign in with Google Popup
   */
  static async signInWithGoogle() {
    const auth = getAuth();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const cred = await auth.signInWithPopup(provider);
    await this.syncUserProfile(cred.user);
    return cred.user;
  }

  /**
   * Sign in as Guest / Anonymous Demo Tester
   */
  static async signInAsGuest() {
    const auth = getAuth();
    const cred = await auth.signInAnonymously();
    await this.syncUserProfile(cred.user, 'Guest Researcher');
    return cred.user;
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email) {
    const auth = getAuth();
    return auth.sendPasswordResetEmail(email);
  }

  /**
   * Sign out current user
   */
  static async logout() {
    const auth = getAuth();
    return auth.signOut();
  }

  /**
   * Sync user record to users/{uid}/profile in Realtime Database
   */
  static async syncUserProfile(user, fallbackName = '') {
    if (!user) return;
    try {
      const db = getDatabase();
      const profileRef = db.ref(`users/${user.uid}/profile`);
      const snapshot = await profileRef.once('value');
      const existing = snapshot.val();

      if (!existing) {
        await profileRef.set({
          name: user.displayName || fallbackName || (user.email ? user.email.split('@')[0] : 'Guest Researcher'),
          email: user.email || 'guest@researchx.ai',
          createdAt: Date.now(),
          lastLoginAt: Date.now()
        });
      } else {
        await profileRef.update({
          lastLoginAt: Date.now()
        });
      }
    } catch (err) {
      console.warn('Profile sync notice:', err.message);
    }
  }

  /**
   * Enforce route protection (redirect to index.html if unauthenticated)
   */
  static requireAuth(redirectUrl = 'index.html') {
    return new Promise((resolve) => {
      this.onAuthStateChanged(user => {
        if (!user) {
          window.location.href = redirectUrl;
        } else {
          resolve(user);
        }
      });
    });
  }
}

