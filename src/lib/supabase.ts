import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Department = {
  id: string;
  name: string;
  icon: string;
  order: number;
};

export type Soldier = {
  id: string;
  full_name: string;
  rank: string;
  role: string;
  phone: string;
  bio: string;
  department_id: string;
  photo_url: string;
  unique_token: string;
  pakalim: string[];
  personal_number?: string;
  password?: string;
  created_at: string;
  departments?: Department;
  soldier_portals?: SoldierPortal;
};

export type SoldierPortal = {
  id: string;
  soldier_id: string;
  status: string;
  health_declaration: string;
  equipment_notes: string;
  personal_notes: string;
  equipment: Record<string, any>;
  equipment_list: string[];
  updated_at: string;
};

export type Schedule = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  all_day: boolean;
  color: string;
  created_by: string;
  created_at: string;
  department_id?: string;
  commander_id?: string;
  status?: string;
  departments?: Pick<Department, 'name' | 'icon'>;
  soldiers?: Pick<Soldier, 'full_name'>;
};

export type TaskList = {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
};

export type ListItem = {
  id: string;
  list_id: string;
  text: string;
  done: boolean;
  assigned_to: string;
  priority: string;
  created_at: string;
};

export type LogisticsItem = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  notes: string;
  assigned_to: string;
  created_at: string;
};

export type MediaItem = {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  uploader_name: string;
  created_at: string;
};

export type SoldierRequest = {
  id: string;
  soldier_id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  soldiers?: Pick<Soldier, 'full_name' | 'phone' | 'departments'>;
};

export type FormField = {
  id: string;
  type: 'text' | 'select' | 'checkbox';
  label: string;
  options?: string[]; // For select/checkbox type
  required: boolean;
};

export type FormType = {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  created_by: string;
  active: boolean;
  created_at: string;
};

export type FormResponse = {
  id: string;
  form_id: string;
  soldier_id: string;
  response_data: Record<string, string | string[]>;
  created_at: string;
  soldiers?: Pick<Soldier, 'full_name' | 'departments'>;
};

export type Message = {
  id: string;
  title: string;
  content: string;
  target_department_id: string | null;
  target_soldier_id?: string | null;
  created_by: string;
  created_at: string;
  departments?: Pick<Department, 'name'>;
  soldiers?: Pick<Soldier, 'full_name'>;
};

export type GuardEvent = {
  id: string;
  location: string;
  start_time: string;
  end_time: string;
  shift_duration: number;
  target_status: string;
  status: 'draft' | 'published' | 'completed';
  created_at: string;
  guard_shifts?: GuardShift[];
};

export type GuardShift = {
  id: string;
  guard_event_id: string;
  soldier_id: string | null;
  requested_by_id: string | null;
  start_time: string;
  end_time: string;
  created_at: string;
  soldiers?: Pick<Soldier, 'full_name'>;
  requested_by?: Pick<Soldier, 'full_name'>;
};
