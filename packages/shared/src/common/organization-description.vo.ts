import { Description } from './description.vo';

/**
 * @class OrganizationDescription
 * @description
 * 组织描述值对象，继承自通用Description基类。
 *
 * 业务规则：
 * 1. 组织描述长度：0-1000个字符
 * 2. 允许为空
 * 3. 自动去除前后空格
 * 4. 支持多行文本
 *
 * @example
 * ```typescript
 * const orgDesc1 = new OrganizationDescription('专注于AI技术研发的组织');
 * const orgDesc2 = new OrganizationDescription('专注于AI技术研发的组织');
 * console.log(orgDesc1.equals(orgDesc2)); // true
 * ```
 * @since 1.0.0
 */
export class OrganizationDescription extends Description {
  constructor(value: string) {
    super(value, {
      minLength: 0,
      maxLength: 1000,
      allowEmpty: true,
      errorPrefix: '组织描述',
    });
  }
}
