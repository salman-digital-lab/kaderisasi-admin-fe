import axios from "../axios";
import type {
  ShortLink,
  ShortLinkInput,
  ShortLinkPage,
} from "../../types/model/short-link";

export async function getShortLinks(params: {
  search: string;
  page: number;
  per_page: number;
}): Promise<ShortLinkPage> {
  const response = await axios.get<{ data: ShortLinkPage }>("/short-links", {
    params,
  });
  return response.data.data;
}

export async function createShortLink(
  input: ShortLinkInput,
): Promise<ShortLink> {
  const response = await axios.post<{ data: ShortLink }>("/short-links", input);
  return response.data.data;
}

export async function updateShortLink(
  code: string,
  original_url: string,
): Promise<ShortLink> {
  const response = await axios.patch<{ data: ShortLink }>(
    `/short-links/${encodeURIComponent(code)}`,
    { original_url },
  );
  return response.data.data;
}

export async function deleteShortLink(code: string): Promise<void> {
  await axios.delete(`/short-links/${encodeURIComponent(code)}`);
}

export async function findDetailShortLink(
  destination: string,
): Promise<ShortLink | null> {
  let page = 1;
  while (true) {
    const result = await getShortLinks({
      search: destination,
      page,
      per_page: 100,
    });
    const match = result.data.find((link) => link.original_url === destination);
    if (match) return match;
    if (page >= result.meta.last_page) return null;
    page += 1;
  }
}
