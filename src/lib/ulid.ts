// ULID 生成器 - 可排序的唯一 ID
// ULID = 時間戳（10字符） + 隨機性（16字符）

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's base32
const ENCODING_LEN = ENCODING.length;

function randomChar(): string {
  const rand = Math.floor(Math.random() * ENCODING_LEN);
  return ENCODING[rand];
}

/**
 * 生成 ULID
 * @returns 26字符的 ULID 字符串
 */
export function generateULID(): string {
  const timestamp = Date.now();
  let ulid = '';

  // 時間戳部分（10字符）
  let t = timestamp;
  for (let i = 0; i < 10; i++) {
    ulid = ENCODING[t % ENCODING_LEN] + ulid;
    t = Math.floor(t / ENCODING_LEN);
  }

  // 隨機部分（16字符）
  for (let i = 0; i < 16; i++) {
    ulid += randomChar();
  }

  return ulid;
}

/**
 * 從 ULID 提取時間戳
 * @param ulid ULID 字符串
 * @returns 毫秒時間戳
 */
export function extractTimestamp(ulid: string): number {
  if (!ulid || ulid.length < 10) {
    throw new Error('Invalid ULID');
  }

  const timestampPart = ulid.substring(0, 10);
  let timestamp = 0;

  for (let i = 0; i < 10; i++) {
    const char = timestampPart[i];
    const value = ENCODING.indexOf(char);
    if (value === -1) {
      throw new Error('Invalid ULID character');
    }
    timestamp = timestamp * ENCODING_LEN + value;
  }

  return timestamp;
}

/**
 * 驗證 ULID 格式
 * @param ulid ULID 字符串
 * @returns 是否有效
 */
export function isValidULID(ulid: string): boolean {
  if (!ulid || ulid.length !== 26) {
    return false;
  }

  for (let i = 0; i < ulid.length; i++) {
    if (ENCODING.indexOf(ulid[i]) === -1) {
      return false;
    }
  }

  return true;
}
