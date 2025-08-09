export interface CaseResult {
  tid: string;
  title: string;
  headline: string;
  docsource: string;
  docsize: number;
  year?: string;
  citation?: string;
  url: string;
}

export interface SearchFilters {
  keyword: string;
  citation: string;
  jurisdiction: string;
  yearFrom: string;
  yearTo: string;
  judge: string;
  provision: string;
  caseType: string;
  act: string;
}

function buildQuery(filters: SearchFilters): string {
  let q = filters.keyword || filters.citation || filters.provision || filters.act || "";
  if (filters.yearFrom && filters.yearTo) q += ` year:${filters.yearFrom}-${filters.yearTo}`;
  else if (filters.yearFrom) q += ` year:${filters.yearFrom}`;
  if (filters.jurisdiction && filters.jurisdiction !== "All High Courts") q += ` court:${filters.jurisdiction}`;
  if (filters.caseType) q += ` type:${filters.caseType}`;
  if (filters.judge) q += ` judge:${filters.judge}`;
  return q.trim();
}

function base64Encode(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, "")
                 .replace(/-----END [^-]+-----/g, "")
                 .replace(/\s+/g, "");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(privateKeyPem);
  return await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function signMessage(privateKeyPem: string, messageBytes: Uint8Array): Promise<ArrayBuffer> {
  const key = await importPrivateKey(privateKeyPem);
  return await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    messageBytes
  );
}

export async function fetchIndianKanoonAjax(filters: SearchFilters, customerEmail: string, privateKeyPem: string, pageNum: number = 0): Promise<CaseResult[]> {
  const formInput = buildQuery(filters);
  if (!formInput) return [];

  const apiUrl = `https://api.indiankanoon.org/search/?formInput=${encodeURIComponent(formInput)}&pagenum=${pageNum}`;

  // Create unique X-Message: URL + timestamp + random
  const unique = `${apiUrl}|${Date.now()}|${Math.random().toString(36).slice(2)}`;
  const messageBytes = new TextEncoder().encode(unique);
  const encodedMessage = base64Encode(messageBytes.buffer);

  // Sign message with private key (PKCS1 v1.5, SHA-256)
  const signature = await signMessage(privateKeyPem, messageBytes);
  const encodedSignature = base64Encode(signature);

  const headers: Record<string, string> = {
    "X-Customer": customerEmail,
    "X-Message": encodedMessage,
    "Authorization": `HMAC ${encodedSignature}`,
    "Accept": "application/json"
  };

  const resp = await fetch(apiUrl, { method: "POST", headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const docs = data?.docs || [];
  const results: CaseResult[] = docs.map((doc: any) => ({
    tid: String(doc.tid),
    title: String(doc.title || ""),
    headline: String(doc.headline || ""),
    docsource: String(doc.docsource || ""),
    docsize: Number(doc.docsize || 0),
    year: doc.year ? String(doc.year) : undefined,
    citation: doc.citation ? String(doc.citation) : undefined,
    url: `https://indiankanoon.org/doc/${doc.tid}/`
  }));
  return results;
}
