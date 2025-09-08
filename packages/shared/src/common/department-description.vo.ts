import { Description } from './description.vo';

/**
 * @class DepartmentDescription
 * @description
 * 部门描述值对象，继承自通用Description基类。
 *
 * 业务规则：
 * 1. 部门描述长度：0-1000个字符
 * 2. 允许为空
 * 3. 自动去除前后空格
 * 4. 支持多行文本
 *
 * @example
 * ```typescript
 * const deptDesc1 = new DepartmentDescription('负责技术研发的部门');
 * const deptDesc2 = new DepartmentDescription('负责技术研发的部门');
 * console.log(deptDesc1.equals(deptDesc2)); // true
 * ```
 * @since 1.0.0
 */
export class DepartmentDescription extends Description {
  constructor(value: string) {
    super(value, {
      minLength: 0,
      maxLength: 1000,
      allowEmpty: true,
      errorPrefix: '部门描述',
    });
  }
}
