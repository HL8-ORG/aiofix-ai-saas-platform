import { v4 as uuidv4 } from 'uuid';

/**
 * 命令基类
 *
 * 所有命令都应该继承此基类，提供统一的命令结构和行为。
 * 命令是CQRS模式中写操作的载体，用于触发业务操作。
 *
 * 命令的特点：
 * 1. 表示用户的意图或业务操作
 * 2. 是不可变的，一旦创建就不能修改
 * 3. 包含执行操作所需的所有数据
 * 4. 具有唯一标识符和时间戳
 *
 * @abstract
 * @class Command
 * @author AI开发团队
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

    if (!this.timestamp || isNaN(this.timestamp.getTime())) {
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
   * @returns {any} 命令的JSON表示
   */
  abstract toJSON(): any;
}
