import { Name } from './name.vo';

/**
 * @class RoleName
 * @description
 * 角色名称值对象，继承自通用Name基类。
 *
 * 业务规则：
 * 1. 角色名称长度：1-50个字符
 * 2. 不能包含特殊字符：< > " ' &
 * 3. 自动去除前后空格
 * 4. 不区分大小写比较
 *
 * @example
 * ```typescript
 * const roleName1 = new RoleName('Admin');
 * const roleName2 = new RoleName('admin');
 * console.log(roleName1.equals(roleName2)); // true
 * ```
 * @since 1.0.0
 */
export class RoleName extends Name {
  constructor(value: string) {
    super(value, {
      minLength: 1,
      maxLength: 50,
      invalidCharsRegex: /[<>"'&]/,
      allowEmpty: false,
      errorPrefix: '角色名称',
    });
  }
}
