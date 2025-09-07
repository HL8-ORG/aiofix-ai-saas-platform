import { v4 as uuidv4 } from 'uuid';

/**
 * @class Command
 * @description
 * 命令基类，封装用户创建操作的输入参数和验证规则。
 *
 * 命令职责：
 * 1. 封装业务操作所需的所有输入参数
 * 2. 提供数据验证和格式检查
 * 3. 确保命令的不可变性和幂等性
 * 4. 支持命令的序列化和反序列化
 *
 * 数据隔离要求：
 * 1. 命令必须包含租户ID以确保数据隔离
 * 2. 验证用户权限和业务规则
 * 3. 确保命令执行者具有相应权限
 *
 * CQRS特性：
 * 1. 表示用户的意图或业务操作
 * 2. 是不可变的，一旦创建就不能修改
 * 3. 包含执行操作所需的所有数据
 * 4. 具有唯一标识符和时间戳
 *
 * @property {string} commandId 命令的唯一标识符
 * @property {Date} timestamp 命令创建的时间戳
 * @property {string} commandType 命令的类型名称
 *
 * @example
 * ```typescript
 * class CreateUserCommand extends Command {
 *   constructor(
 *     public readonly email: string,
 *     public readonly password: string,
 *     public readonly tenantId: string
 *   ) {
 *     super();
 *     this.validate();
 *   }
 *
 *   private validate(): void {
 *     if (!this.email?.includes('@')) {
 *       throw new Error('Invalid email format');
 *     }
 *   }
 *
 *   toJSON(): any {
 *     return {
 *       ...this.getBaseCommandData(),
 *       email: this.email,
 *       password: this.password,
 *       tenantId: this.tenantId
 *     };
 *   }
 * }
 * ```
 * @abstract
 * @since 1.0.0
 */
export abstract class Command {
  /**
   * 命令的唯一标识符
   * 使用UUID确保全局唯一性
   */
  public readonly commandId: string;

  /**
   * 命令创建的时间戳
   * 记录命令创建的时间
   */
  public readonly timestamp: Date;

  /**
   * 命令的类型名称
   * 使用构造函数名称作为命令类型
   */
  public readonly commandType: string;

  /**
   * 构造函数
   *
   * 初始化命令的基本属性，包括唯一标识符、时间戳和类型名称。
   */
  constructor() {
    this.commandId = uuidv4();
    this.timestamp = new Date();
    this.commandType = this.constructor.name;
  }

  /**
   * 验证命令数据的有效性
   *
   * 子类可以重写此方法，添加特定的命令数据验证逻辑。
   * 基类提供基本的验证，确保命令的基本属性有效。
   *
   * @throws {Error} 当命令数据无效时抛出错误
   */
  protected validateCommand(): void {
    if (!this.commandId || this.commandId.trim().length === 0) {
      throw new Error('命令ID不能为空');
    }

    if (isNaN(this.timestamp.getTime())) {
      throw new Error('命令时间戳无效');
    }

    if (!this.commandType || this.commandType.trim().length === 0) {
      throw new Error('命令类型不能为空');
    }
  }

  /**
   * 获取命令的基本信息
   *
   * @returns {object} 包含命令基本信息的对象
   */
  protected getBaseCommandData(): object {
    return {
      commandId: this.commandId,
      timestamp: this.timestamp.toISOString(),
      commandType: this.commandType,
    };
  }

  /**
   * 将命令转换为JSON格式
   *
   * 子类应该重写此方法，提供具体的命令数据序列化。
   * 基类提供默认实现，包含命令的基本属性。
   *
   * @returns {Record<string, unknown>} 命令的JSON表示
   */
  abstract toJSON(): Record<string, unknown>;
}
