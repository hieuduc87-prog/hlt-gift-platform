import * as XLSX from "xlsx";
import type { RelationshipTag } from "@/types/index";

export interface ParsedRecipientRow {
  full_name: string;
  phone: string | null;
  email: string | null;
  relationship: RelationshipTag;
  address: string | null;
  district: string | null;
  birthday_day: number | null;
  birthday_month: number | null;
  note: string | null;
}

export interface ParseResult {
  rows: ParsedRecipientRow[];
  errors: { row: number; message: string }[];
}

const COLUMN_MAP: Record<string, keyof ParsedRecipientRow> = {
  "Ho ten": "full_name",
  "Ho va ten": "full_name",
  "Ten": "full_name",
  "SDT": "phone",
  "So dien thoai": "phone",
  "Dien thoai": "phone",
  "Phone": "phone",
  "Email": "email",
  "Quan he": "relationship",
  "Dia chi": "address",
  "Quan/Huyen": "district",
  "Quan": "district",
  "Sinh nhat (DD/MM)": "birthday_day",
  "Sinh nhat": "birthday_day",
  "Ngay sinh": "birthday_day",
  "Ghi chu": "note",
  "Note": "note",
};

/* Strip Vietnamese diacritics for flexible matching */
function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeHeader(header: string): string {
  return removeDiacritics(header).trim();
}

const RELATIONSHIP_MAP: Record<string, RelationshipTag> = {
  "vo": "spouse",
  "chong": "spouse",
  "vo/chong": "spouse",
  "bo": "parent",
  "me": "parent",
  "bo/me": "parent",
  "cha": "parent",
  "con": "child",
  "anh": "sibling",
  "chi": "sibling",
  "em": "sibling",
  "anh/chi/em": "sibling",
  "ban": "friend",
  "ban be": "friend",
  "sep": "boss",
  "dong nghiep": "colleague",
  "doi tac": "partner",
  "khach hang": "client",
  "khach": "client",
  "spouse": "spouse",
  "parent": "parent",
  "child": "child",
  "sibling": "sibling",
  "friend": "friend",
  "boss": "boss",
  "colleague": "colleague",
  "partner": "partner",
  "client": "client",
};

function parseRelationship(val: string | null): RelationshipTag {
  if (!val) return "other";
  const normalized = removeDiacritics(val.toLowerCase().trim());
  return RELATIONSHIP_MAP[normalized] || "other";
}

function parseBirthday(val: string | null): { day: number | null; month: number | null } {
  if (!val) return { day: null, month: null };
  const str = String(val).trim();

  // Handle DD/MM format
  const slashMatch = str.match(/^(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { day, month };
    }
  }

  // Handle DD/MM/YYYY format
  const fullMatch = str.match(/^(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{2,4})$/);
  if (fullMatch) {
    const day = parseInt(fullMatch[1], 10);
    const month = parseInt(fullMatch[2], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { day, month };
    }
  }

  return { day: null, month: null };
}

export function parseExcelBuffer(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: [{ row: 0, message: "File khong co sheet nao" }] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rawData.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "File khong co du lieu" }] };
  }

  // Build column mapping from actual headers
  const firstRow = rawData[0];
  const headerMap: Record<string, string> = {};
  for (const key of Object.keys(firstRow)) {
    const normalized = normalizeHeader(key);
    for (const [mapKey, fieldName] of Object.entries(COLUMN_MAP)) {
      if (normalized.toLowerCase() === mapKey.toLowerCase()) {
        headerMap[key] = fieldName;
        break;
      }
    }
  }

  const rows: ParsedRecipientRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const raw = rawData[i];
    const rowNum = i + 2; // Excel row (1-indexed header + 1-indexed data)

    // Map columns
    const mapped: Record<string, unknown> = {};
    for (const [originalKey, fieldName] of Object.entries(headerMap)) {
      mapped[fieldName] = raw[originalKey];
    }

    // Validate required field: full_name
    const fullName = String(mapped.full_name || "").trim();
    if (!fullName) {
      errors.push({ row: rowNum, message: "Thieu ho ten" });
      continue;
    }

    // Parse birthday
    const birthdayRaw = String(mapped.birthday_day || "").trim();
    const { day, month } = parseBirthday(birthdayRaw);

    const phone = mapped.phone ? String(mapped.phone).trim() : null;
    const email = mapped.email ? String(mapped.email).trim() : null;
    const address = mapped.address ? String(mapped.address).trim() : null;
    const district = mapped.district ? String(mapped.district).trim() : null;
    const note = mapped.note ? String(mapped.note).trim() : null;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNum, message: `Email khong hop le: ${email}` });
      continue;
    }

    rows.push({
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      relationship: parseRelationship(
        mapped.relationship ? String(mapped.relationship) : null
      ),
      address: address || null,
      district: district || null,
      birthday_day: day,
      birthday_month: month,
      note: note || null,
    });
  }

  return { rows, errors };
}
