/**
 * @function generateUUID
 * @description 生成UUID v4格式的字符串
 * @returns {string} UUID字符串
 * @example
 * ```typescript
 * const id = generateUUID();
 * console.log(id); // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * @function validateUUID
 * @description 验证UUID格式是否正确
 * @param {string} uuid 要验证的UUID字符串
 * @returns {boolean} 是否为有效的UUID
 * @example
 * ```typescript
 * const isValid = validateUUID('550e8400-e29b-41d4-a716-446655440000');
 * console.log(isValid); // true
 * ```
 */
export function validateUUID(uuid: string): boolean {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
}
