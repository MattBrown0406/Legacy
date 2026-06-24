import { supabase } from '@/lib/supabase';
import { DocumentKind, DocumentTemplate } from '@/types';

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  letter_guidelines: 'Letter Guidelines',
  boundaries: 'Boundaries Worksheet',
  services_agreement: 'Services Agreement',
  other: 'Document',
};

const DEFAULT_DOCUMENTS: { title: string; kind: DocumentKind; body_md: string }[] = [
  {
    title: 'Intervention Letter Guidelines',
    kind: 'letter_guidelines',
    body_md: `# Intervention Letter Guidelines

Write from love, not anger. Your letter has four parts:

1. **Affirmation** — Open with specific things you love and admire about them.
2. **Impact** — Describe, without blame, how their use has affected you and the family. Use "I" statements and concrete examples.
3. **The ask** — Clearly invite them to accept help today.
4. **The boundary** — State, calmly, what you will and won't do going forward.

Keep it to one page. Read it aloud beforehand. Bring tissues.`,
  },
  {
    title: 'Boundaries Worksheet',
    kind: 'boundaries',
    body_md: `# Boundaries Worksheet

A boundary is a commitment you make about your own behavior — not a threat.

For each area, complete: "If you continue to ___, then I will ___."

- Financial support:
- Housing:
- Childcare / family events:
- Transportation:
- Emotional availability:

Only list boundaries you are fully prepared to keep.`,
  },
  {
    title: 'Services Agreement',
    kind: 'services_agreement',
    body_md: `# Services Agreement

This agreement is between the family and the interventionist.

- **Scope:** Intervention planning, family coaching, day-of facilitation, and aftercare check-ins.
- **Fees:** [amount], due [terms].
- **Confidentiality:** Information shared is kept private except as required by law or safety.
- **Cancellation:** [policy].

Signatures:`,
  },
];

export async function listDocuments(practitionerId: string): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('practitioner_id', practitionerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DocumentTemplate[];
}

/** Seed the three default templates the first time the library is empty. */
export async function ensureDefaultDocuments(
  practitionerId: string,
): Promise<DocumentTemplate[]> {
  const existing = await listDocuments(practitionerId);
  if (existing.length > 0) return existing;
  const { data, error } = await supabase
    .from('documents')
    .insert(DEFAULT_DOCUMENTS.map((d) => ({ practitioner_id: practitionerId, ...d })))
    .select('*');
  if (error) throw error;
  return (data ?? []) as DocumentTemplate[];
}

export async function getDocument(id: string): Promise<DocumentTemplate | null> {
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as DocumentTemplate) ?? null;
}

export async function createDocument(
  practitionerId: string,
  input: { title: string; body_md: string },
): Promise<DocumentTemplate> {
  const { data, error } = await supabase
    .from('documents')
    .insert({ practitioner_id: practitionerId, title: input.title, body_md: input.body_md, kind: 'other' })
    .select('*')
    .single();
  if (error) throw error;
  return data as DocumentTemplate;
}

export async function updateDocument(
  id: string,
  fields: { title?: string; body_md?: string },
): Promise<void> {
  const { error } = await supabase.from('documents').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}
