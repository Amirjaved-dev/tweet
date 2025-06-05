import { config } from '../config';

// Note: We need to install @supabase/supabase-js on the server side
// For now, we'll use fetch to make direct API calls to Supabase

interface User {
  id: string;
  email: string;
  clerk_user_id?: string;
  is_premium: boolean;
  plan_status?: string;
  created_at: string;
  updated_at: string;
}

class UserService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || config.supabaseUrl || '';
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceKey || '';
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('Supabase configuration missing. User operations may fail.');
    }
  }

  private async makeSupabaseRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', 
    body?: any
  ) {
    const url = `${this.supabaseUrl}/rest/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Supabase request failed:', error);
      throw error;
    }
  }

  // Find user by Clerk ID with better error handling
  async findUserByClerkId(clerkUserId: string): Promise<User | null> {
    try {
      // Try multiple possible field names since the schema might vary
      const possibleFields = ['clerk_user_id', 'clerk_id', 'id'];
      
      for (const field of possibleFields) {
        try {
          const endpoint = `/users?${field}=eq.${clerkUserId}&limit=1`;
          const users = await this.makeSupabaseRequest(endpoint);
          
          if (users && users.length > 0) {
            if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
              console.log(`Found user using field ${field}:`, users[0]);
            }
            return users[0];
          }
        } catch (fieldError: any) {
          // Only log if it's not a 404 (user not found) error
          if (fieldError.message && !fieldError.message.includes('404')) {
            if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
              console.log(`Field ${field} query failed:`, fieldError.message);
            }
          }
          continue;
        }
      }

      // If not found with any field, only log in debug mode
      if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.log(`User not found for Clerk ID: ${clerkUserId}`);
      }
      
      return null;
    } catch (error) {
      // Only log actual errors, not expected "not found" cases
      if (process.env.LOG_LEVEL === 'WARN' || process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
        console.error('Error finding user:', error);
      }
      return null;
    }
  }

  // Create a new user with proper error handling
  async createUser(clerkUserId: string, email: string): Promise<User> {
    try {
      const userData = {
        clerk_user_id: clerkUserId,
        email: email,
        is_premium: false,
        plan_status: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const users = await this.makeSupabaseRequest('/users', 'POST', userData);
      
      if (users && users.length > 0) {
        if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
          console.log('Created new user:', users[0]);
        }
        return users[0];
      }
      
      throw new Error('Failed to create user - no data returned');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get or create user (sync operation)
  async getOrCreateUser(clerkUserId: string, email: string): Promise<User> {
    try {
      // First try to find existing user
      let user = await this.findUserByClerkId(clerkUserId);
      
      if (!user) {
        // Create new user if not found
        if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
          console.log(`Creating new user for Clerk ID: ${clerkUserId}`);
        }
        user = await this.createUser(clerkUserId, email);
      }
      
      return user;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw error;
    }
  }

  // Update user plan status
  async updateUserPlan(clerkUserId: string, planStatus: string, isPremium: boolean = false): Promise<User | null> {
    try {
      const updateData = {
        plan_status: planStatus,
        is_premium: isPremium,
        updated_at: new Date().toISOString()
      };

      // Try to update using different possible field names
      const possibleFields = ['clerk_user_id', 'clerk_id', 'id'];
      
      for (const field of possibleFields) {
        try {
          const endpoint = `/users?${field}=eq.${clerkUserId}`;
          const users = await this.makeSupabaseRequest(endpoint, 'PATCH', updateData);
          
          if (users && users.length > 0) {
            if (process.env.LOG_LEVEL === 'DEBUG' || process.env.LOG_LEVEL === 'VERBOSE') {
              console.log(`Updated user plan using field ${field}:`, users[0]);
            }
            return users[0];
          }
        } catch (fieldError) {
          continue;
        }
      }

      console.warn(`Could not update user plan for Clerk ID: ${clerkUserId}`);
      return null;
    } catch (error) {
      console.error('Error updating user plan:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService; 