import { users, threads, usage, type User, type InsertUser, type Thread, type InsertThread, type Usage } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPlan(id: string, plan: string): Promise<User>;

  // Thread methods
  createThread(userId: string, thread: InsertThread): Promise<Thread>;
  getUserThreads(userId: string, limit?: number): Promise<Thread[]>;
  getThread(id: string): Promise<Thread | undefined>;
  deleteThread(id: string): Promise<void>;

  // Usage methods
  getTodayUsage(userId: string): Promise<Usage | undefined>;
  incrementUsage(userId: string): Promise<Usage>;
  getUserUsage(userId: string, date: string): Promise<Usage | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private threads: Map<string, Thread>;
  private usage: Map<string, Usage>; // key: userId-date
  private currentUserId: number;
  private currentThreadId: number;

  constructor() {
    this.users = new Map();
    this.threads = new Map();
    this.usage = new Map();
    this.currentUserId = 1;
    this.currentThreadId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.id === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = (this.currentUserId++).toString();
    const user: User = {
      ...insertUser,
      id,
      plan: insertUser.plan || "free",
      created_at: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPlan(id: string, plan: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, plan: plan as "free" | "pro" | "enterprise" };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createThread(userId: string, thread: InsertThread): Promise<Thread> {
    const id = (this.currentThreadId++).toString();
    const newThread: Thread = {
      ...thread,
      id,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    this.threads.set(id, newThread);
    return newThread;
  }

  async getUserThreads(userId: string, limit?: number): Promise<Thread[]> {
    const userThreads = Array.from(this.threads.values())
      .filter(thread => thread.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return limit ? userThreads.slice(0, limit) : userThreads;
  }

  async getThread(id: string): Promise<Thread | undefined> {
    return this.threads.get(id);
  }

  async deleteThread(id: string): Promise<void> {
    this.threads.delete(id);
  }

  async getTodayUsage(userId: string): Promise<Usage | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return this.getUserUsage(userId, today);
  }

  async getUserUsage(userId: string, date: string): Promise<Usage | undefined> {
    const key = `${userId}-${date}`;
    return this.usage.get(key);
  }

  async incrementUsage(userId: string): Promise<Usage> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}-${today}`;
    
    let todayUsage = this.usage.get(key);
    
    if (!todayUsage) {
      todayUsage = {
        user_id: userId,
        date: today,
        threads_generated: 1,
      };
    } else {
      todayUsage = {
        ...todayUsage,
        threads_generated: todayUsage.threads_generated + 1,
      };
    }
    
    this.usage.set(key, todayUsage);
    return todayUsage;
  }
}

export const storage = new MemStorage();
