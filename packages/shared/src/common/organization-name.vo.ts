import { Name } from './name.vo';

/**
 * @class OrganizationName
 * @description
 * 组织名称值对象，继承自通用Name基类。
 *
 * 业务规则：
 * 1. 组织名称长度：1-100个字符
 * 2. 不能包含特殊字符：< > " ' &
 * 3. 自动去除前后空格
 * 4. 不区分大小写比较
 *
 * @example
 * ```typescript
 * const orgName1 = new OrganizationName('AI开发团队');
 * const orgName2 = new OrganizationName('ai开发团队');
 * console.log(orgName1.equals(orgName2)); // true
 * ```
 * @since 1.0.0
 */
export class OrganizationName extends Name {
  constructor(value: string) {
    super(value, {
      minLength: 1,
      maxLength: 100,
      invalidCharsRegex: /[<>"'&]/,
      allowEmpty: false,
      errorPrefix: '组织名称',
    });
  }
}
