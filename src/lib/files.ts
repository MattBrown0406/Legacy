import * as DocumentPicker from 'expo-document-picker';
import { File as FsFile } from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { CaseFile } from '@/types';

const BUCKET = 'case-files';

// PDF, Microsoft Office, and Apple iWork document types.
export const UPLOAD_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.apple.pages',
  'application/vnd.apple.numbers',
  'application/vnd.apple.keynote',
  'application/x-iwork-pages-sffpages',
  'application/x-iwork-numbers-sffnumbers',
  'application/x-iwork-keynote-sffkey',
];

export async function listCaseFiles(caseId: string): Promise<CaseFile[]> {
  const { data, error } = await supabase
    .from('case_files')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaseFile[];
}

/** Pick a document and upload it to the case's private Storage folder. */
export async function pickAndUploadCaseFile(caseId: string): Promise<CaseFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: UPLOAD_MIME_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;

  const asset = res.assets[0];
  const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${caseId}/${Date.now()}-${safeName}`;
  const contentType = asset.mimeType ?? 'application/octet-stream';

  let payload: Blob | Uint8Array;
  if (Platform.OS === 'web') {
    payload = await (await fetch(asset.uri)).blob();
  } else {
    payload = await new FsFile(asset.uri).bytes();
  }

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, payload, { contentType, upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from('case_files')
    .insert({
      case_id: caseId,
      name: asset.name,
      mime_type: asset.mimeType ?? null,
      size_bytes: asset.size ?? null,
      storage_path: path,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as CaseFile;
}

/** Open a file via a short-lived signed URL (private bucket). */
export async function openCaseFile(file: CaseFile): Promise<void> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, 60 * 60);
  if (error) throw error;
  if (!data?.signedUrl) return;
  if (Platform.OS === 'web') {
    globalThis.open?.(data.signedUrl, '_blank');
  } else {
    await WebBrowser.openBrowserAsync(data.signedUrl);
  }
}

export async function deleteCaseFile(file: CaseFile): Promise<void> {
  await supabase.storage.from(BUCKET).remove([file.storage_path]);
  const { error } = await supabase.from('case_files').delete().eq('id', file.id);
  if (error) throw error;
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
