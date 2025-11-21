import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'entrepreneur' | 'agent' | 'cooperative' | 'institution' | 'superAdmin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error: any }>;
  signInWithEmail: (email: string) => Promise<{ error: any }>;
  verifyEmailOTP: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setRole(data.role as UserRole);
      } else {
        // Si le profil n'existe pas, créer un profil par défaut entrepreneur
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert([{ id: userId, role: 'entrepreneur' }])
          .select()
          .single();
        
        if (newProfile) {
          setRole(newProfile.role as UserRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      // S'assurer que le numéro est au format E.164 (sans espaces)
      const cleanedPhone = phone.replace(/\s/g, '').trim();
      
      console.log('Signing in with phone:', cleanedPhone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: cleanedPhone,
        options: {
          channel: 'sms',
        },
      });
      
      if (error) {
        console.error('Supabase OTP error:', error);
        
        // Message d'erreur plus explicite pour le provider non configuré
        if (error.message?.includes('Unsupported phone provider') || error.message?.includes('provider')) {
          return {
            error: {
              ...error,
              message: 'Le service SMS n\'est pas configuré. Veuillez configurer un provider SMS (Twilio, MessageBird, etc.) dans les paramètres Supabase.',
              userMessage: 'Service SMS non configuré. Contactez l\'administrateur.',
            },
          };
        }
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const verifyOTP = async (phone: string, token: string) => {
    try {
      // S'assurer que le numéro est au format E.164 (sans espaces)
      const cleanedPhone = phone.replace(/\s/g, '').trim();
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: cleanedPhone,
        token: token,
        type: 'sms',
      });

      if (data?.user) {
        await fetchUserRole(data.user.id);
      }

      if (error) {
        console.error('Supabase OTP verification error:', error);
      }

      return { error };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { error };
    }
  };

  const signInWithEmail = async (email: string) => {
    try {
      const cleanedEmail = email.trim().toLowerCase();
      
      console.log('Signing in with email:', cleanedEmail);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanedEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        console.error('Supabase Email OTP error:', error);
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in with email error:', error);
      return { error };
    }
  };

  const verifyEmailOTP = async (email: string, token: string) => {
    try {
      const cleanedEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanedEmail,
        token: token,
        type: 'email',
      });

      if (data?.user) {
        // Mettre à jour le profil avec l'email
        await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            email: cleanedEmail,
          }, {
            onConflict: 'id'
          });
        
        await fetchUserRole(data.user.id);
      }

      if (error) {
        console.error('Supabase Email OTP verification error:', error);
      }

      return { error };
    } catch (error) {
      console.error('Verify Email OTP error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signInWithPhone,
        verifyOTP,
        signInWithEmail,
        verifyEmailOTP,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

