import { httpRequest } from './http.client.js';

interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
}

export async function fetchNotionContentPlan(apiUrl: string, databaseId: string, token: string): Promise<NotionPage[]> {
  const url = `${apiUrl.replace(/\/$/, '')}/databases/${databaseId}/query`;
  return httpRequest<NotionPage[]>(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    },
  });
}

