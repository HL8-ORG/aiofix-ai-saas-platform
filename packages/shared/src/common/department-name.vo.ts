import { Name } from './name.vo';

/**
 * @class DepartmentName
 * @description
 * 部门名称值对象，继承自通用Name基类。
 *
 * 业务规则：
 * 1. 部门名称长度：1-100个字符
 * 2. 不能包含特殊字符：< > " ' &
 * 3. 自动去除前后空格
 * 4. 不区分大小写比较
 *
 * @example
 * ```typescript
 * const deptName1 = new DepartmentName('技术研发部');
 * const deptName2 = new DepartmentName('技术研发部');
 * console.log(deptName1.equals(deptName2)); // true
 * ```
 * @since 1.0.0
 */
export class DepartmentName extends Name {
  constructor(value: string) {
    super(value, {
      minLength: 1,
      maxLength: 100,
      invalidCharsRegex: /[<>"'&]/,
      allowEmpty: false,
      errorPrefix: '部门名称',
    });
  }
}
