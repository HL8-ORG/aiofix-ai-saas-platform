#!/bin/bash
set -e

echo "Initializing table-level isolation schema in aiofix_platform database..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 创建租户表
    CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
    );

    -- 创建用户表（包含tenant_id）
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        roles TEXT[] DEFAULT '{}',
        preferences JSONB DEFAULT '{}',
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        
        -- 租户内邮箱唯一性约束
        CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
    );

    -- 创建组织表（包含tenant_id）
    CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        
        -- 租户内组织名称唯一性约束
        CONSTRAINT unique_org_name_per_tenant UNIQUE (tenant_id, name)
    );

    -- 创建部门表（包含tenant_id）
    CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        
        -- 组织内部门名称唯一性约束
        CONSTRAINT unique_dept_name_per_org UNIQUE (organization_id, name)
    );

    -- 创建用户组织关联表
    CREATE TABLE IF NOT EXISTS user_organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- 用户在同一组织内只能有一个角色
        CONSTRAINT unique_user_org_role UNIQUE (user_id, organization_id)
    );

    -- 创建用户部门关联表
    CREATE TABLE IF NOT EXISTS user_departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- 用户在同一部门内只能有一个角色
        CONSTRAINT unique_user_dept_role UNIQUE (user_id, department_id)
    );

    -- 创建通知表（包含tenant_id）
    CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
        metadata JSONB DEFAULT '{}',
        scheduled_at TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
    );

    -- 创建通知模板表（包含tenant_id）
    CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        subject VARCHAR(500),
        content TEXT NOT NULL,
        variables JSONB DEFAULT '{}',
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        
        -- 租户内模板名称唯一性约束
        CONSTRAINT unique_template_name_per_tenant UNIQUE (tenant_id, name, type, channel)
    );

    -- 创建用户通知偏好表（包含tenant_id）
    CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- 用户在同一租户内每种通知类型只能有一个偏好设置
        CONSTRAINT unique_user_channel_type_preference UNIQUE (user_id, channel, type)
    );

    -- 创建平台配置表（全局配置，不包含tenant_id）
    CREATE TABLE IF NOT EXISTS platform_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value JSONB NOT NULL,
        description TEXT,
        category VARCHAR(100),
        is_public BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
    );

    -- 创建租户配置表（租户级配置，包含tenant_id）
    CREATE TABLE IF NOT EXISTS tenant_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        key VARCHAR(255) NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        category VARCHAR(100),
        is_public BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        
        -- 租户内配置键唯一性约束
        CONSTRAINT unique_tenant_config_key UNIQUE (tenant_id, key)
    );

    -- 创建审计日志表（包含tenant_id）
    CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255),
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 创建索引以提高查询性能
    
    -- 租户相关索引
    CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
    CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
    
    -- 用户相关索引
    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
    
    -- 组织相关索引
    CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);
    CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
    
    -- 部门相关索引
    CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON departments(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id);
    CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
    
    -- 用户组织关联索引
    CREATE INDEX IF NOT EXISTS idx_user_organizations_tenant_id ON user_organizations(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);
    
    -- 用户部门关联索引
    CREATE INDEX IF NOT EXISTS idx_user_departments_tenant_id ON user_departments(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON user_departments(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON user_departments(department_id);
    
    -- 通知相关索引
    CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    
    -- 通知模板索引
    CREATE INDEX IF NOT EXISTS idx_notification_templates_tenant_id ON notification_templates(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
    CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel);
    CREATE INDEX IF NOT EXISTS idx_notification_templates_status ON notification_templates(status);
    
    -- 用户通知偏好索引
    CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_tenant_id ON user_notification_preferences(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_channel ON user_notification_preferences(channel);
    
    -- 配置相关索引
    CREATE INDEX IF NOT EXISTS idx_platform_configurations_key ON platform_configurations(key);
    CREATE INDEX IF NOT EXISTS idx_platform_configurations_category ON platform_configurations(category);
    CREATE INDEX IF NOT EXISTS idx_tenant_configurations_tenant_id ON tenant_configurations(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tenant_configurations_key ON tenant_configurations(key);
    CREATE INDEX IF NOT EXISTS idx_tenant_configurations_category ON tenant_configurations(category);
    
    -- 审计日志索引
    CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

    -- 创建行级安全策略（RLS）以确保数据隔离
    
    -- 启用行级安全
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tenant_configurations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    
    -- 创建RLS策略函数
    CREATE OR REPLACE FUNCTION get_current_tenant_id()
    RETURNS UUID AS \$\$
    BEGIN
        -- 这里可以从应用程序上下文中获取当前租户ID
        -- 在实际应用中，可以通过SET命令设置会话变量
        RETURN current_setting('app.current_tenant_id', true)::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
    \$\$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- 创建RLS策略
    CREATE POLICY tenant_isolation_policy ON users
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON organizations
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON departments
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON user_organizations
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON user_departments
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON notifications
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON notification_templates
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON user_notification_preferences
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON tenant_configurations
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id());
    
    CREATE POLICY tenant_isolation_policy ON audit_logs
        FOR ALL TO $POSTGRES_USER
        USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

    -- 插入默认租户数据
    INSERT INTO tenants (id, name, domain, status, settings, created_by) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default.aiofix.com', 'ACTIVE', '{"theme": "light", "timezone": "UTC"}', 'system'),
        ('00000000-0000-0000-0000-000000000002', 'Demo Tenant', 'demo.aiofix.com', 'ACTIVE', '{"theme": "dark", "timezone": "Asia/Shanghai"}', 'system'),
        ('00000000-0000-0000-0000-000000000003', 'Test Tenant', 'test.aiofix.com', 'ACTIVE', '{"theme": "light", "timezone": "UTC"}', 'system')
    ON CONFLICT (id) DO NOTHING;

    -- 插入默认平台配置
    INSERT INTO platform_configurations (key, value, description, category, is_public, created_by) VALUES
        ('platform.name', '"Aiofix AI SaaS Platform"', '平台名称', 'general', true, 'system'),
        ('platform.version', '"1.0.0"', '平台版本', 'general', true, 'system'),
        ('platform.max_tenants', '1000', '最大租户数量', 'limits', false, 'system'),
        ('platform.max_users_per_tenant', '10000', '每个租户最大用户数', 'limits', false, 'system'),
        ('notification.default_channels', '["email", "in_app", "push"]', '默认通知渠道', 'notification', true, 'system'),
        ('ai.vector_dimension', '1536', 'AI向量维度', 'ai', false, 'system'),
        ('ai.max_embeddings_per_tenant', '1000000', '每个租户最大嵌入数量', 'ai', false, 'system')
    ON CONFLICT (key) DO NOTHING;

    -- 授予权限
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $POSTGRES_USER;
EOSQL

echo "Table-level isolation schema initialized successfully!"
echo "All tables now include tenant_id for data isolation"
