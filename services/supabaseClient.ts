import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Safe wrapper for localStorage that falls back to in-memory storage if WebView restrictions apply
class SafeLocalStorage {
  private memoryStore: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage read blocked, using in-memory store for ${key}:`, e);
      return this.memoryStore[key] || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage write blocked, using in-memory store for ${key}:`, e);
      this.memoryStore[key] = value;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage delete blocked, using in-memory store for ${key}:`, e);
      delete this.memoryStore[key];
    }
  }
}

const safeStorage = new SafeLocalStorage();

// Mock client implementation for local execution
class MockSupabaseQueryBuilder {
  private tableName: string;
  private queryMode: 'select' | 'insert' | 'update' | 'upsert' | 'delete' | null = null;
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private isMaybeSingle = false;
  private isSingle = false;
  private rowsToInsert: any = null;
  private updateValues: any = null;
  private rowsToUpsert: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private getTableData(): any[] {
    try {
      const data = safeStorage.getItem(`mock_db_${this.tableName}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Mock DB read error for table ${this.tableName}:`, e);
      return [];
    }
  }

  private saveTableData(data: any[]) {
    try {
      safeStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Mock DB write error for table ${this.tableName}:`, e);
    }
  }

  select(_columns?: string) {
    this.queryMode = 'select';
    return this;
  }

  insert(rows: any | any[]) {
    this.queryMode = 'insert';
    this.rowsToInsert = rows;
    return this;
  }

  update(values: any) {
    this.queryMode = 'update';
    this.updateValues = values;
    return this;
  }

  upsert(rows: any | any[]) {
    this.queryMode = 'upsert';
    this.rowsToUpsert = rows;
    return this;
  }

  delete() {
    this.queryMode = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Thenable interface implementation to support modern await chaining
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.executeQuery().then(onfulfilled, onrejected);
  }

  catch(onrejected?: (reason: any) => any) {
    return this.executeQuery().catch(onrejected);
  }

  private async executeQuery() {
    try {
      if (this.queryMode === 'select') {
        let data = this.getTableData();
        for (const filter of this.filters) {
          data = data.filter(filter);
        }
        if (this.orderField) {
          const field = this.orderField;
          data.sort((a, b) => {
            const valA = a[field];
            const valB = b[field];
            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;
            if (valA < valB) return this.orderAscending ? -1 : 1;
            if (valA > valB) return this.orderAscending ? 1 : -1;
            return 0;
          });
        }
        if (this.limitCount !== null) {
          data = data.slice(0, this.limitCount);
        }
        let result: any = data;
        if (this.isSingle || this.isMaybeSingle) {
          result = data.length > 0 ? data[0] : null;
        }
        return { data: result, error: null };
      }

      if (this.queryMode === 'insert') {
        const newRows = Array.isArray(this.rowsToInsert) ? this.rowsToInsert : [this.rowsToInsert];
        const data = this.getTableData();
        const inserted: any[] = [];
        for (const row of newRows) {
          const newRow = { 
            id: row.id || `row-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            created_at: new Date().toISOString(),
            ...row 
          };
          data.push(newRow);
          inserted.push(newRow);
        }
        this.saveTableData(data);
        return { data: Array.isArray(this.rowsToInsert) ? inserted : inserted[0], error: null };
      }

      if (this.queryMode === 'update') {
        const data = this.getTableData();
        let updatedRows: any[] = [];
        const updatedData = data.map(item => {
          const match = this.filters.every(filter => filter(item));
          if (match) {
            const updated = { ...item, ...this.updateValues };
            updatedRows.push(updated);
            return updated;
          }
          return item;
        });
        this.saveTableData(updatedData);
        return { data: this.isSingle || this.isMaybeSingle ? (updatedRows[0] || null) : updatedRows, error: null };
      }

      if (this.queryMode === 'upsert') {
        const data = this.getTableData();
        const rows = Array.isArray(this.rowsToUpsert) ? this.rowsToUpsert : [this.rowsToUpsert];
        let resultRows: any[] = [];
        const updatedData = [...data];
        for (const r of rows) {
          const idKey = r.id ? 'id' : (r.user_id ? 'user_id' : null);
          let updated = false;
          let resultRow = null;

          if (idKey) {
            for (let i = 0; i < updatedData.length; i++) {
              if (updatedData[i][idKey] === r[idKey]) {
                updated = true;
                updatedData[i] = { ...updatedData[i], ...r };
                resultRow = updatedData[i];
                break;
              }
            }
          }

          if (!updated) {
            resultRow = { 
              id: r.id || `row-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
              created_at: new Date().toISOString(),
              ...r 
            };
            updatedData.push(resultRow);
          }
          resultRows.push(resultRow);
        }
        this.saveTableData(updatedData);
        return { data: Array.isArray(this.rowsToUpsert) ? resultRows : resultRows[0], error: null };
      }

      if (this.queryMode === 'delete') {
        const data = this.getTableData();
        const remaining = data.filter(item => !this.filters.every(filter => filter(item)));
        this.saveTableData(remaining);
        return { data: null, error: null };
      }

      return { data: null, error: new Error("No query mode specified") };
    } catch (e: any) {
      console.error("Mock DB query execution error:", e);
      return { data: null, error: e };
    }
  }
}

const mockAuthListeners: Array<(event: string, session: any) => void> = [];

const mockSupabase = {
  auth: {
    async getSession() {
      try {
        const localSession = safeStorage.getItem('mock_supabase_session');
        if (localSession) {
          return { data: { session: JSON.parse(localSession) }, error: null };
        }
        return { data: { session: null }, error: null };
      } catch (e: any) {
        console.error("Mock auth getSession error:", e);
        return { data: { session: null }, error: e };
      }
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      mockAuthListeners.push(callback);
      // Fire initial state asynchronously and catch errors safely
      this.getSession()
        .then(({ data: { session } }) => {
          callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        })
        .catch(err => {
          console.error("Mock auth onAuthStateChange initial session error:", err);
          callback('SIGNED_OUT', null);
        });
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = mockAuthListeners.indexOf(callback);
              if (index !== -1) mockAuthListeners.splice(index, 1);
            }
          }
        }
      };
    },
    async signInWithOAuth({ provider }: { provider: string }) {
      try {
        const mockSession = {
          user: {
            id: `mock-${provider}-user-id`,
            email: `mock.${provider}@example.com`,
            user_metadata: {
              full_name: `Mock ${provider.charAt(0).toUpperCase() + provider.slice(1)} User`
            }
          }
        };
        safeStorage.setItem('mock_supabase_session', JSON.stringify(mockSession));
        
        // Notify listeners asynchronously to prevent sync call recursion
        setTimeout(() => {
          mockAuthListeners.forEach(listener => {
            try {
              listener('SIGNED_IN', mockSession);
            } catch (err) {
              console.error("Error invoking auth state listener:", err);
            }
          });
        }, 0);
        return { data: mockSession, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    },
    async signOut() {
      try {
        const hadSession = safeStorage.getItem('mock_supabase_session') !== null;
        safeStorage.removeItem('mock_supabase_session');
        if (hadSession) {
          // Notify listeners asynchronously to prevent call stack recursion loops
          setTimeout(() => {
            mockAuthListeners.forEach(listener => {
              try {
                listener('SIGNED_OUT', null);
              } catch (err) {
                console.error("Error invoking auth state listener during signOut:", err);
              }
            });
          }, 0);
        }
        return { error: null };
      } catch (e: any) {
        return { error: e };
      }
    }
  },
  from(tableName: string) {
    return new MockSupabaseQueryBuilder(tableName);
  }
};

// Check if we should use the mock (always on for now as requested)
const useMock = true;

if (useMock) {
  console.info('Gozi: Running with LOCAL MOCK Supabase Client.');
} else {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn(
      'WARNING: Supabase environment variables are missing! ' +
      'Please verify that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
      'are set in your environment / .env file.'
    );
  }
}

export const supabase: any = useMock ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey);
