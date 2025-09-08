import {
  EmailTemplate,
  TemplateId,
  TemplateType,
  TemplateStatus,
  TemplateVariable,
  VariableType,
  TemplateContent,
  TemplateService,
  TenantId,
  UserId,
} from './index';

/**
 * 通知模板领域层使用示例
 * 演示模板的创建、状态管理和业务逻辑
 */
async function runTemplateExample() {
  console.log('=== 通知模板领域层使用示例 ===');

  try {
    // 1. 创建值对象
    console.log('\n1. 创建值对象:');
    const tenantId = TenantId.create('tenant-uuid-123');
    const userId = UserId.create('user-uuid-456');
    const templateId = TemplateId.generate();

    console.log('- TenantId:', tenantId.value);
    console.log('- UserId:', userId.value);
    console.log('- TemplateId:', templateId.value);

    // 2. 创建模板变量
    console.log('\n2. 创建模板变量:');
    const variables = [
      TemplateVariable.create(
        'userName',
        VariableType.STRING,
        '用户姓名',
        'Guest',
        true,
      ),
      TemplateVariable.create(
        'companyName',
        VariableType.STRING,
        '公司名称',
        'ABC Corp',
        true,
      ),
      TemplateVariable.create(
        'loginUrl',
        VariableType.STRING,
        '登录链接',
        'https://example.com/login',
        false,
      ),
    ];

    variables.forEach(variable => {
      console.log(
        `- ${variable.name}: ${variable.type} - ${variable.description}`,
      );
    });

    // 3. 创建模板内容
    console.log('\n3. 创建模板内容:');
    const templateContent = TemplateContent.create(
      '欢迎邮件模板',
      '<h1>欢迎 {{userName}}</h1><p>欢迎加入 {{companyName}}</p><p><a href="{{loginUrl}}">点击登录</a></p>',
      '欢迎 {{userName}}\n\n欢迎加入 {{companyName}}\n\n登录链接: {{loginUrl}}',
    );

    console.log('- 标题:', templateContent.title);
    console.log('- HTML内容长度:', templateContent.getHtmlContentLength());
    console.log('- 纯文本内容长度:', templateContent.getTextContentLength());
    console.log('- 是否包含变量:', templateContent.hasVariables());
    console.log('- 变量名称列表:', templateContent.getVariableNames());

    // 4. 创建邮件模板
    console.log('\n4. 创建邮件模板:');
    const emailTemplate = EmailTemplate.create(
      tenantId,
      'welcome-email',
      '欢迎邮件模板',
      templateContent,
      variables,
      userId,
      'system',
      '系统欢迎邮件模板',
      { source: 'admin', priority: 'high' },
    );

    console.log('- 模板ID:', emailTemplate.id.value);
    console.log('- 模板名称:', emailTemplate.name);
    console.log('- 模板显示名称:', emailTemplate.displayName);
    console.log('- 模板分类:', emailTemplate.category);
    console.log('- 当前状态:', emailTemplate.getStatus());
    console.log('- 版本号:', emailTemplate.getVersion());
    console.log('- 是否草稿:', emailTemplate.isDraft());
    console.log('- 是否可编辑:', emailTemplate.isEditable());

    // 5. 状态管理
    console.log('\n5. 状态管理:');
    console.log('发布模板...');
    emailTemplate.publish(userId);
    console.log('- 新状态:', emailTemplate.getStatus());
    console.log('- 是否已发布:', emailTemplate.isPublished());
    console.log('- 是否活跃:', emailTemplate.isActive());

    console.log('下线模板...');
    emailTemplate.unpublish(userId);
    console.log('- 新状态:', emailTemplate.getStatus());
    console.log('- 是否草稿:', emailTemplate.isDraft());

    // 6. 使用领域服务
    console.log('\n6. 使用领域服务:');
    const templateService = new TemplateService();

    // 检查是否可以创建模板
    const canCreate = templateService.canCreateTemplate(
      userId,
      tenantId,
      TemplateType.EMAIL,
    );
    console.log('- 是否可以创建邮件模板:', canCreate);

    // 验证模板内容
    const isValidContent = templateService.validateTemplateContent(
      templateContent,
      TemplateType.EMAIL,
    );
    console.log('- 模板内容是否有效:', isValidContent);

    // 验证模板变量
    const isValidVariables = templateService.validateTemplateVariables(
      variables,
      templateContent,
    );
    console.log('- 模板变量是否有效:', isValidVariables);

    // 验证模板名称
    const isValidName = templateService.validateTemplateName(
      'welcome-email',
      tenantId,
    );
    console.log('- 模板名称是否有效:', isValidName);

    // 检查是否可以发布
    const canPublish = templateService.canPublishTemplate(
      templateContent,
      variables,
      TemplateType.EMAIL,
    );
    console.log('- 是否可以发布模板:', canPublish);

    // 提取变量
    const extractedVariables =
      templateService.extractVariablesFromContent(templateContent);
    console.log('- 从内容中提取的变量:', extractedVariables);

    // 渲染模板
    const renderedContent = templateService.renderTemplate(templateContent, {
      userName: 'John Doe',
      companyName: 'ABC Corporation',
      loginUrl: 'https://abc.com/login',
    });
    console.log('- 渲染后的标题:', renderedContent.title);
    console.log(
      '- 渲染后的HTML内容:',
      renderedContent.htmlContent.substring(0, 50) + '...',
    );

    // 7. 错误处理示例
    console.log('\n7. 错误处理示例:');
    try {
      // 尝试创建无效的模板变量
      TemplateVariable.create('', VariableType.STRING, '无效变量');
    } catch (error) {
      console.log('捕获到错误:', error.message);
    }

    try {
      // 尝试创建无效的模板内容
      TemplateContent.create('', '', '');
    } catch (error) {
      console.log('捕获到错误:', error.message);
    }

    // 8. 事件处理示例
    console.log('\n8. 事件处理示例:');
    const events = emailTemplate.getUncommittedEvents();
    console.log('- 未提交的事件数量:', events.length);

    events.forEach((event, index) => {
      console.log(`- 事件 ${index + 1}:`, event.getEventType());
    });

    console.log('\n=== 通知模板领域层使用示例完成 ===');
  } catch (error) {
    console.error('示例执行出错:', error);
  }
}

// 运行示例
if (require.main === module) {
  runTemplateExample().catch(console.error);
}

export { runTemplateExample };
