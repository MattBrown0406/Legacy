import { supabase } from '@/lib/supabase';
import { Invoice, InvoiceStatus } from '@/types';

export async function listInvoices(practitionerId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invoice[];
}

export async function createInvoice(
  practitionerId: string,
  input: { item: string; amount_cents: number; case_id: string | null },
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      practitioner_id: practitionerId,
      item: input.item,
      amount_cents: input.amount_cents,
      case_id: input.case_id,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Invoice;
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

/** "$1,250.00" from cents. */
export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

/** Parse a dollar string ("1250", "1,250.50", "$1250") to integer cents. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}
