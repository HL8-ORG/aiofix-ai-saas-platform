import { ValueObject } from '@aiofix/core';

/**
 * @class PushContent
 * @description
 * 推送内容值对象，封装推送通知的内容信息。
 *
 * 推送内容特性：
 * 1. 支持多语言和本地化内容
 * 2. 包含标题、正文、图标等多媒体元素
 * 3. 支持富文本和HTML格式
 * 4. 提供内容验证和过滤功能
 *
 * 内容结构：
 * 1. 标题：推送通知的主标题
 * 2. 正文：推送通知的详细内容
 * 3. 图标：推送通知的图标URL
 * 4. 图片：推送通知的图片URL
 * 5. 动作：推送通知的点击动作
 * 6. 数据：推送通知的附加数据
 *
 * 业务规则：
 * 1. 标题和正文长度有平台限制
 * 2. 内容需要经过敏感词过滤
 * 3. 支持内容模板和变量替换
 * 4. 提供内容预览和验证功能
 *
 * @property {string} title 推送标题
 * @property {string} body 推送正文
 * @property {string} [icon] 推送图标URL，可选
 * @property {string} [image] 推送图片URL，可选
 * @property {string} [action] 推送动作，可选
 * @property {Record<string, any>} [data] 推送附加数据，可选
 *
 * @example
 * ```typescript
 * const content = new PushContent('新消息', '您有一条新消息', 'https://example.com/icon.png');
 * const richContent = new PushContent('订单更新', '您的订单已发货', 'https://example.com/icon.png', 'https://example.com/image.jpg');
 * ```
 * @since 1.0.0
 */
export class PushContent extends ValueObject<{
  title: string;
  body: string;
  icon?: string;
  image?: string;
  action?: string;
  data?: Record<string, any>;
}> {
  /**
   * @constructor
   * @description 创建推送内容值对象
   * @param {string} title 推送标题
   * @param {string} body 推送正文
   * @param {string} [icon] 推送图标URL，可选
   * @param {string} [image] 推送图片URL，可选
   * @param {string} [action] 推送动作，可选
   * @param {Record<string, any>} [data] 推送附加数据，可选
   * @throws {InvalidPushContentError} 当内容无效时抛出
   */
  constructor(
    title: string,
    body: string,
    icon?: string,
    image?: string,
    action?: string,
    data?: Record<string, any>,
  ) {
    super({ title, body, icon, image, action, data });
    this.validateContent(title, body, icon, image);
  }

  /**
   * @method getTitle
   * @description 获取推送标题
   * @returns {string} 推送标题
   */
  getTitle(): string {
    return this.value.title;
  }

  /**
   * @method getBody
   * @description 获取推送正文
   * @returns {string} 推送正文
   */
  getBody(): string {
    return this.value.body;
  }

  /**
   * @method getIcon
   * @description 获取推送图标URL
   * @returns {string | undefined} 推送图标URL
   */
  getIcon(): string | undefined {
    return this.value.icon;
  }

  /**
   * @method getImage
   * @description 获取推送图片URL
   * @returns {string | undefined} 推送图片URL
   */
  getImage(): string | undefined {
    return this.value.image;
  }

  /**
   * @method getAction
   * @description 获取推送动作
   * @returns {string | undefined} 推送动作
   */
  getAction(): string | undefined {
    return this.value.action;
  }

  /**
   * @method getData
   * @description 获取推送附加数据
   * @returns {Record<string, any> | undefined} 推送附加数据
   */
  getData(): Record<string, any> | undefined {
    return this.value.data;
  }

  /**
   * @method validateContent
   * @description 验证推送内容
   * @param {string} title 推送标题
   * @param {string} body 推送正文
   * @param {string} [icon] 推送图标URL，可选
   * @param {string} [image] 推送图片URL，可选
   * @throws {InvalidPushContentError} 当内容无效时抛出
   * @private
   */
  private validateContent(
    title: string,
    body: string,
    icon?: string,
    image?: string,
  ): void {
    // 验证标题
    if (!title || title.trim().length === 0) {
      throw new InvalidPushContentError('推送标题不能为空');
    }

    if (title.length > 100) {
      throw new InvalidPushContentError('推送标题长度不能超过100个字符');
    }

    // 验证正文
    if (!body || body.trim().length === 0) {
      throw new InvalidPushContentError('推送正文不能为空');
    }

    if (body.length > 1000) {
      throw new InvalidPushContentError('推送正文长度不能超过1000个字符');
    }

    // 验证图标URL
    if (icon && !this.isValidUrl(icon)) {
      throw new InvalidPushContentError('推送图标URL格式无效');
    }

    // 验证图片URL
    if (image && !this.isValidUrl(image)) {
      throw new InvalidPushContentError('推送图片URL格式无效');
    }
  }

  /**
   * @method isValidUrl
   * @description 验证URL格式
   * @param {string} url URL字符串
   * @returns {boolean} URL格式是否有效
   * @private
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method getPlatformContent
   * @description 获取平台特定的推送内容
   * @param {string} platform 推送平台
   * @returns {Record<string, any>} 平台特定的推送内容
   */
  getPlatformContent(platform: string): Record<string, any> {
    const baseContent = {
      title: this.value.title,
      body: this.value.body,
    };

    switch (platform) {
      case 'FCM':
        return {
          ...baseContent,
          icon: this.value.icon,
          image: this.value.image,
          data: this.value.data,
        };

      case 'APNS':
        return {
          aps: {
            alert: {
              title: this.value.title,
              body: this.value.body,
            },
            badge: 1,
            sound: 'default',
            'mutable-content': this.value.image ? 1 : 0,
          },
          ...this.value.data,
        };

      case 'HUAWEI':
        return {
          notification: {
            title: this.value.title,
            body: this.value.body,
            icon: this.value.icon,
            image: this.value.image,
            click_action: this.value.action,
          },
          data: this.value.data,
        };

      case 'XIAOMI':
        return {
          title: this.value.title,
          description: this.value.body,
          icon: this.value.icon,
          image: this.value.image,
          click_action: this.value.action,
          extra: this.value.data,
        };

      default:
        return baseContent;
    }
  }

  /**
   * @method getContentLength
   * @description 获取内容长度统计
   * @returns {Record<string, number>} 内容长度统计
   */
  getContentLength(): Record<string, number> {
    return {
      title: this.value.title.length,
      body: this.value.body.length,
      total: this.value.title.length + this.value.body.length,
    };
  }

  /**
   * @method hasMedia
   * @description 判断是否包含媒体内容
   * @returns {boolean} 是否包含媒体内容
   */
  hasMedia(): boolean {
    return !!(this.value.icon || this.value.image);
  }

  /**
   * @method hasAction
   * @description 判断是否包含动作
   * @returns {boolean} 是否包含动作
   */
  hasAction(): boolean {
    return !!this.value.action;
  }

  /**
   * @method hasData
   * @description 判断是否包含附加数据
   * @returns {boolean} 是否包含附加数据
   */
  hasData(): boolean {
    return !!(this.value.data && Object.keys(this.value.data).length > 0);
  }

  /**
   * @method toPlainObject
   * @description 转换为普通对象
   * @returns {Record<string, any>} 普通对象
   */
  toPlainObject(): Record<string, any> {
    return {
      title: this.value.title,
      body: this.value.body,
      icon: this.value.icon,
      image: this.value.image,
      action: this.value.action,
      data: this.value.data,
    };
  }

  /**
   * @method equals
   * @description 比较两个推送内容是否相等
   * @param {PushContent} other 另一个推送内容
   * @returns {boolean} 是否相等
   */
  equals(other: PushContent): boolean {
    return (
      this.value.title === other.value.title &&
      this.value.body === other.value.body &&
      this.value.icon === other.value.icon &&
      this.value.image === other.value.image &&
      this.value.action === other.value.action &&
      JSON.stringify(this.value.data) === JSON.stringify(other.value.data)
    );
  }

  /**
   * @method toString
   * @description 返回推送内容的字符串表示
   * @returns {string} 推送内容字符串
   */
  toString(): string {
    return `${this.value.title}: ${this.value.body}`;
  }
}

/**
 * @class InvalidPushContentError
 * @description 无效推送内容错误
 */
export class InvalidPushContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPushContentError';
  }
}
