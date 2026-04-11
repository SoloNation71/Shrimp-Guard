import { apiPost } from '@/lib/apiClient';
import type { ManualEntry } from '@/types';

export async function submitManualEntry(entry: ManualEntry): Promise<void> {
  await apiPost('/manual-entry', entry);
}
