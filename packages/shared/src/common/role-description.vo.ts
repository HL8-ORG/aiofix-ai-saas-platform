import { Description } from './description.vo';

/**
 * @class RoleDescription
 * @description
 * 角色描述值对象，继承自通用Description基类。
 *
 * 业务规则：
 * 1. 角色描述长度：0-500个字符
 * 2. 允许为空
 * 3. 自动去除前后空格
 * 4. 支持多行文本
 *
 * @example
 * ```typescript
 * const roleDesc1 = new RoleDescription('系统管理员角色');
 * const roleDesc2 = new RoleDescription('系统管理员角色');
 * console.log(roleDesc1.equals(roleDesc2)); // true
 * ```
 * @since 1.0.0
 */
export class RoleDescription extends Description {
  constructor(value: string) {
    super(value, {
      minLength: 0,
      maxLength: 500,
      allowEmpty: true,
      errorPrefix: '角色描述',
    });
  }
}
