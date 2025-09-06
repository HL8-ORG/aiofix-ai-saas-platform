# SAAS平台文档中心

## 文档概述

本目录包含了SAAS平台的完整文档，包括业务需求、技术设计和AI开发提示词。这些文档为项目开发提供了全面的指导。

## 文档结构

```
docs/
├── README.md                           # 本文档
├── business-requirements.md            # 业务需求文档
├── development-plan.md                 # 开发工作计划
├── development-plan-quick-reference.md # 开发工作计划快速参考
├── ai-development-prompts.md           # AI开发提示词系统（完整版）
├── ai-prompts-quick-reference.md       # AI开发提示词快速参考
├── .ai-config.md                       # AI开发配置文件
└── technical-design/                   # 技术设计文档目录
    ├── README.md                       # 技术设计文档索引
    ├── 01-architecture-overview.md     # 架构概述
    ├── 02-layered-architecture.md      # 分层架构设计
    ├── 03-core-modules.md              # 核心模块与组件设计
    ├── 04-domain-models.md             # 领域模型设计
    ├── 05-application-layer.md         # 应用层实现
    ├── 06-infrastructure.md            # 基础设施实现
    ├── 07-event-sourcing.md            # 事件溯源设计
    ├── 08-deployment.md                # 部署与运维
    ├── 09-multitenant.md               # 多租户数据隔离
    └── 10-summary.md                   # 总结
```

## 文档说明

### 1. 业务需求文档

- **文件**：`business-requirements.md`
- **内容**：完整的业务需求，包括术语定义、项目概述、业务架构、核心功能、业务规则、用户故事等
- **用途**：理解业务需求，指导功能开发

### 2. 开发工作计划

- **文件**：`development-plan.md`
- **内容**：完整的开发工作计划，包括开发阶段、里程碑、交付物等
- **用途**：指导开发进度，确保项目按时完成
- **快速参考**：`development-plan-quick-reference.md`

### 3. 技术设计文档

- **目录**：`technical-design/`
- **内容**：详细的技术设计方案，包括架构设计、模块设计、实现细节等
- **用途**：指导技术实现，确保架构一致性

### 4. AI开发提示词

- **完整版**：`ai-development-prompts.md`
- **快速参考**：`ai-prompts-quick-reference.md`
- **项目配置文件**：`.ai-config.md`（适用于所有AI工具）
- **Cursor特定配置**：`.cursor/rules/project-config.mdc`（Cursor IDE特定）
- **用途**：引导AI参与开发，确保开发质量

### 5. 测试规范文档

- **测试指南**：`testing-guidelines.md`
- **测试目录架构**：`testing-directory-structure.md`
- **用途**：指导单元测试、集成测试、端到端测试的编写和组织
- **内容**：测试原则、策略、最佳实践、工具配置、目录结构

### 6. 包结构重构文档

- **重构方案**：`package-structure-refactor.md`
- **用途**：指导通用模块的独立化重构
- **内容**：包结构设计、模块分离、依赖管理、使用方式

## 使用指南

### 对于开发者

1. **开始开发前**：
   - 阅读 `business-requirements.md` 理解业务需求
   - 阅读 `development-plan.md` 了解开发计划
   - 阅读 `technical-design/README.md` 了解技术架构
   - 参考 `ai-prompts-quick-reference.md` 获取开发提示

2. **开发过程中**：
   - 参考相应的技术设计文档
   - 使用AI提示词指导开发
   - 遵循项目架构规范

3. **开发完成后**：
   - 进行代码检查和测试
   - 更新相关文档

### 对于AI助手

1. **项目理解**：
   - 首先阅读 `.ai-config.md` 了解项目配置（通用配置）
   - 如使用Cursor，可参考 `.cursor/rules/project-config.mdc`（Cursor特定配置）
   - 参考 `business-requirements.md` 理解业务需求
   - 阅读 `development-plan.md` 了解开发计划
   - 阅读 `technical-design/README.md` 掌握技术架构

2. **开发指导**：
   - 使用 `ai-development-prompts.md` 中的详细提示词
   - 参考 `ai-prompts-quick-reference.md` 快速获取提示
   - 遵循项目的开发规范和架构原则

3. **质量保证**：
   - 确保代码符合项目规范
   - 实现完整的业务逻辑
   - 添加详细的测试用例

## 快速开始

### 1. 理解项目

```bash
# 阅读业务需求
cat docs/business-requirements.md

# 阅读开发计划
cat docs/development-plan.md

# 阅读技术设计概述
cat docs/technical-design/README.md

# 了解AI开发配置
cat .ai-config.md

# 了解Cursor特定配置（如使用Cursor）
cat .cursor/rules/project-config.mdc
```

### 2. 开始开发

```bash
# 使用快速参考提示词
cat docs/ai-prompts-quick-reference.md

# 参考具体的技术设计文档
cat docs/technical-design/04-domain-models.md
```

### 3. 质量检查

```bash
# 运行代码检查
pnpm run lint

# 运行测试
pnpm run test

# 构建项目
pnpm run build
```

## 文档维护

### 更新原则

- 代码变更时同步更新相关文档
- 保持文档与代码的一致性
- 定期审查文档的准确性

### 更新流程

1. 识别需要更新的文档
2. 更新文档内容
3. 检查文档格式和链接
4. 提交文档变更

## 贡献指南

### 文档贡献

1. 遵循现有的文档格式
2. 保持文档结构的一致性
3. 添加必要的示例和说明
4. 确保文档的可读性

### 代码贡献

1. 遵循项目的开发规范
2. 参考技术设计文档
3. 添加完整的测试用例
4. 更新相关文档

## 联系方式

如有问题或建议，请：

1. 查看相关文档
2. 参考AI开发提示词
3. 联系项目团队

---

**文档版本**：1.0  
**最后更新**：2024-01-01  
**维护者**：项目团队
