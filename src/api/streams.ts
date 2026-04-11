import { apiPost } from '@/lib/apiClient';

export interface StreamToken {
  url: string;
  hlsUrl: string;
  token: string;
  expiresAt: string;
}

export async function fetchStreamToken(pondId: number): Promise<StreamToken> {
  return apiPost<StreamToken>('/stream/token', { pond_id: pondId });
}
