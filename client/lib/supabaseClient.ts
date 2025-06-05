import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use development placeholders if environment variables are missing
const isDevelopment = import.meta.env.MODE === 'development';

// Use fallback values in development mode
const finalSupabaseUrl = supabaseUrl || (isDevelopment ? 'https://leirhgtidkhuvdwpblel.supabase.co' : undefined);
const finalAnonKey = supabaseAnonKey || (isDevelopment ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXJoZ3RpZGtodXZkd3BibGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTM5NjcsImV4cCI6MjA2NDE2OTk2N30.jP_jbYIDqvfsyU39YTupQ1LqPNlJp5Z2vWjWOl1FxbE' : undefined);

if (!finalSupabaseUrl || !finalAnonKey) {
  if (isDevelopment) {
    console.warn('Using placeholder Supabase credentials in development mode');
  } else {
    throw new Error('Missing Supabase environment variables');
  }
}

export const supabase = createClient(
  finalSupabaseUrl || 'https://placeholder.supabase.co', 
  finalAnonKey || 'placeholder_key'
);

// User management functions
export const userService = {
  // Check if user exists and create if not on Clerk login
  async syncUser(clerkId: string, email: string) {
    try {
      // First check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If user doesn't exist, create them with default free plan
      if (!existingUser) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkId,
            email: email,
            plan: 'free'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newUser;
      }

      return existingUser;
    } catch (error) {
      console.error('Error syncing user:', error);
      throw error;
    }
  },

  // Get user by Clerk ID
  async getUserByClerkId(clerkId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Update user plan status  
  async updatePlan(clerkId: string, plan: 'free' | 'premium') {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ plan })
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }
};

// Thread management functions
export const threadService = {
  // Get user's thread count for today
  async getUserThreadCount(clerkId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('threads')
        .select('*', { count: 'exact', head: true })
        .eq('clerk_id', clerkId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting thread count:', error);
      throw error;
    }
  },

  // Get user's threads
  async getUserThreads(clerkId: string) {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('clerk_id', clerkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  },

  // Create a new thread
  async createThread(clerkId: string, content: string) {
    try {
      const { data, error } = await supabase
        .from('threads')
        .insert({
          clerk_id: clerkId,
          content: content,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }
};

export const paymentService = {
  // Record a payment
  async recordPayment(paymentData: {
    clerkId: string;
    email: string;
    plan: string;
    amount: number;
    paymentMethod: string;
    paymentId: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          clerk_id: paymentData.clerkId,
          email: paymentData.email,
          plan: paymentData.plan,
          amount: paymentData.amount,
          payment_method: paymentData.paymentMethod,
          payment_id: paymentData.paymentId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  // Get payments for a user
  async getUserPayments(clerkId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('clerk_id', clerkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ status })
        .eq('payment_id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }
}; 