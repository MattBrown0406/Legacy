import { supabase } from '@/lib/supabase';
import { Practitioner } from '@/types';

export async function updatePractitioner(
  id: string,
  fields: Partial<Pick<Practitioner, 'name' | 'credential' | 'practice_name' | 'gcal_detail_mode'>>,
): Promise<void> {
  const { error } = await supabase.from('practitioners').update(fields).eq('id', id);
  if (error) throw error;
}
