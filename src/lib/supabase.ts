import { createClient } from '@supabase/supabase-js';

export type WaitlistEntryInput = {
  fullName: string;
  email: string;
  phone?: string;
  userType: string;
  mainChannel: string;
  country: string;
  city?: string;
  useCase?: string;
  averageTransactionValue?: string;
  consent: boolean;
};

type WaitlistInsertRow = {
  full_name: string;
  email: string;
  phone?: string;
  user_type: string;
  main_channel: string;
  country: string;
  city?: string;
  use_case?: string;
  average_transaction_value?: string;
  consent: boolean;
  source: string;
  user_agent?: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export async function submitWaitlistEntry(entry: WaitlistEntryInput) {
  if (!supabase) {
    return { storedRemotely: false };
  }

  const row: WaitlistInsertRow = {
    full_name: entry.fullName.trim(),
    email: entry.email.trim().toLowerCase(),
    phone: entry.phone?.trim() || undefined,
    user_type: entry.userType,
    main_channel: entry.mainChannel,
    country: entry.country,
    city: entry.city?.trim() || undefined,
    use_case: entry.useCase?.trim() || undefined,
    average_transaction_value: entry.averageTransactionValue || undefined,
    consent: entry.consent,
    source: 'meduman-web',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  };

  const { error } = await supabase.from('waitlist_entries').insert(row);

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email has already joined the waitlist.');
    }
    throw new Error(error.message || 'Unable to save your waitlist profile right now.');
  }

  return { storedRemotely: true };
}
