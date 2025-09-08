/**
 * @class TemplateId
 * @description
 * 模板ID值对象，封装通知模板的唯一标识符。
 *
 * 不变性约束：
 * 1. 模板ID一旦创建不可变更
 * 2. 模板ID必须符合UUID v4格式
 * 3. 模板ID在系统内必须唯一
 *
 * 相等性判断：
 * 1. 基于模板ID的字符串值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装模板ID的生成逻辑
 * 2. 提供模板ID的验证方法
 * 3. 隐藏模板ID的格式细节
 *
 * @property {string} value 模板ID的字符串值
 *
 * @example
 * ```typescript
 * const templateId1 = TemplateId.generate();
 * const templateId2 = TemplateId.create('123e4567-e89b-12d3-a456-426614174000');
 * console.log(templateId1.equals(templateId2)); // false
 * ```
 * @since 1.0.0
 */
export class TemplateId {
  private readonly _value: string;

  constructor(value: string) {
    this.validateTemplateId(value);
    this._value = value;
  }

  /**
   * @method generate
   * @description 生成新的模板ID的静态工厂方法
   * @returns {TemplateId} 新生成的模板ID值对象
   */
  public static generate(): TemplateId {
    return new TemplateId(this.generateUUID());
  }

  /**
   * @method create
   * @description 创建模板ID值对象的静态工厂方法
   * @param {string} value 模板ID字符串
   * @returns {TemplateId} 模板ID值对象
   * @throws {InvalidTemplateIdError} 当模板ID格式无效时抛出
   */
  public static create(value: string): TemplateId {
    return new TemplateId(value);
  }

  /**
   * @getter value
   * @description 获取模板ID的字符串值
   * @returns {string} 模板ID值
   */
  public get value(): string {
    return this._value;
  }

  /**
   * @method equals
   * @description 比较两个模板ID对象是否相等
   * @param {TemplateId} other 另一个模板ID对象
   * @returns {boolean} 是否相等
   */
  public equals(other: TemplateId): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * @method toString
   * @description 返回模板ID的字符串表示
   * @returns {string} 模板ID字符串
   */
  public toString(): string {
    return this._value;
  }

  /**
   * @method validateTemplateId
   * @description 验证模板ID格式的有效性
   * @param {string} templateId 模板ID字符串
   * @returns {void}
   * @throws {InvalidTemplateIdError} 当模板ID格式无效时抛出
   * @private
   */
  private validateTemplateId(templateId: string): void {
    if (!templateId || typeof templateId !== 'string') {
      throw new InvalidTemplateIdError('模板ID不能为空');
    }

    const trimmedId = templateId.trim();
    if (trimmedId.length === 0) {
      throw new InvalidTemplateIdError('模板ID不能为空');
    }

    // UUID v4 格式验证
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(trimmedId)) {
      throw new InvalidTemplateIdError(`无效的模板ID格式: ${templateId}`);
    }
  }

  /**
   * @method generateUUID
   * @description 生成UUID v4格式的字符串
   * @returns {string} UUID v4字符串
   * @private
   */
  private static generateUUID(): string {
    // 简化的UUID v4生成器
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
}

/**
 * @class InvalidTemplateIdError
 * @description 无效模板ID错误
 */
export class InvalidTemplateIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTemplateIdError';
  }
}
