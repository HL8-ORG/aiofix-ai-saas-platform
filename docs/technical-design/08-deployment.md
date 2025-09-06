# 部署与运维

## 概述

本文档描述了SAAS平台的部署策略、运维管理、监控告警、性能优化等关键运维方面的技术实现。平台支持从单体应用到微服务架构的渐进式演进，提供灵活的部署选项。

## 部署架构

### 整体部署架构

```
部署架构
├── 负载均衡层 (Load Balancer)
│   ├── Nginx/HAProxy
│   ├── SSL终端
│   └── 健康检查
├── 应用层 (Application Layer)
│   ├── 单体应用部署
│   ├── 微服务部署
│   └── 容器编排 (Kubernetes)
├── 数据层 (Data Layer)
│   ├── PostgreSQL集群
│   ├── MongoDB集群
│   └── Redis集群
├── 消息队列 (Message Queue)
│   ├── Redis Streams
│   ├── RabbitMQ
│   └── Apache Kafka
└── 监控层 (Monitoring Layer)
    ├── Prometheus + Grafana
    ├── ELK Stack
    └── Jaeger分布式追踪
```

## 部署策略

### 单体应用部署

#### Docker容器化

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/saas_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=saas_platform
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'

  mongodb:
    image: mongo:6
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
    ports:
      - '27017:27017'

volumes:
  postgres_data:
  redis_data:
  mongodb_data:
```

### 微服务部署

#### Kubernetes部署配置

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: saas-platform

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: saas-config
  namespace: saas-platform
data:
  NODE_ENV: 'production'
  LOG_LEVEL: 'info'
  DATABASE_URL: 'postgresql://user:pass@postgres-service:5432/saas_platform'
  REDIS_URL: 'redis://redis-service:6379'
  MONGODB_URL: 'mongodb://mongodb-service:27017/saas_platform'

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: saas-secrets
  namespace: saas-platform
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
  SMTP_PASSWORD: <base64-encoded-password>
  TWILIO_AUTH_TOKEN: <base64-encoded-token>

---
# k8s/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: saas-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: saas-platform/user-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: SERVICE_NAME
              value: 'user-service'
            - name: PORT
              value: '3000'
          envFrom:
            - configMapRef:
                name: saas-config
            - secretRef:
                name: saas-secrets
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

---
# k8s/user-service-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: saas-platform
spec:
  selector:
    app: user-service
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP

---
# k8s/tenant-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tenant-service
  namespace: saas-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tenant-service
  template:
    metadata:
      labels:
        app: tenant-service
    spec:
      containers:
        - name: tenant-service
          image: saas-platform/tenant-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: SERVICE_NAME
              value: 'tenant-service'
            - name: PORT
              value: '3001'
          envFrom:
            - configMapRef:
                name: saas-config
            - secretRef:
                name: saas-secrets
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
```

#### Helm Chart配置

```yaml
# helm/saas-platform/Chart.yaml
apiVersion: v2
name: saas-platform
description: SAAS Platform Helm Chart
version: 1.0.0
appVersion: '1.0.0'

---
# helm/saas-platform/values.yaml
replicaCount: 3

image:
  repository: saas-platform
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: 'nginx'
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: api.saas-platform.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: saas-platform-tls
      hosts:
        - api.saas-platform.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

postgresql:
  enabled: true
  auth:
    postgresPassword: 'postgres'
    username: 'saas'
    password: 'saas'
    database: 'saas_platform'
  primary:
    persistence:
      enabled: true
      size: 20Gi

redis:
  enabled: true
  auth:
    enabled: true
    password: 'redis'
  master:
    persistence:
      enabled: true
      size: 8Gi

mongodb:
  enabled: true
  auth:
    enabled: true
    rootUsername: 'admin'
    rootPassword: 'password'
  persistence:
    enabled: true
    size: 20Gi
```

## 数据库部署

### PostgreSQL集群部署

```yaml
# k8s/postgres-cluster.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: saas-platform
spec:
  instances: 3

  postgresql:
    parameters:
      max_connections: '200'
      shared_buffers: '256MB'
      effective_cache_size: '1GB'
      maintenance_work_mem: '64MB'
      checkpoint_completion_target: '0.9'
      wal_buffers: '16MB'
      default_statistics_target: '100'
      random_page_cost: '1.1'
      effective_io_concurrency: '200'
      work_mem: '4MB'
      min_wal_size: '1GB'
      max_wal_size: '4GB'

  bootstrap:
    initdb:
      database: saas_platform
      owner: saas_user
      secret:
        name: postgres-credentials

  storage:
    size: 100Gi
    storageClass: fast-ssd

  monitoring:
    enabled: true
    customQueriesConfigMap:
      name: postgres-custom-queries

  backup:
    barmanObjectStore:
      destinationPath: 's3://saas-platform-backups/postgres'
      s3Credentials:
        accessKeyId:
          name: backup-credentials
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: backup-credentials
          key: SECRET_ACCESS_KEY
      wal:
        retention: '7d'
      data:
        retention: '30d'
```

### MongoDB集群部署

```yaml
# k8s/mongodb-cluster.yaml
apiVersion: mongodbcommunity.mongodb.com/v1
kind: MongoDBCommunity
metadata:
  name: mongodb-cluster
  namespace: saas-platform
spec:
  members: 3
  type: ReplicaSet

  security:
    authentication:
      modes: ['SCRAM']
    tls:
      enabled: true
      certificateKeySecretRef:
        name: mongodb-tls-cert
      caConfigMapRef:
        name: mongodb-tls-ca

  statefulSet:
    spec:
      template:
        spec:
          containers:
            - name: mongod
              resources:
                requests:
                  cpu: 500m
                  memory: 1Gi
                limits:
                  cpu: 1000m
                  memory: 2Gi

  additionalMongodConfig:
    storage.wiredTiger.engineConfig.cacheSizeGB: 1
    storage.wiredTiger.engineConfig.journalCompressor: snappy
    storage.wiredTiger.collectionConfig.blockCompressor: snappy

  volumeClaimTemplates:
    - metadata:
        name: data-volume
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 50Gi
        storageClassName: fast-ssd
```

### Redis集群部署

```yaml
# k8s/redis-cluster.yaml
apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: redis-cluster
  namespace: saas-platform
spec:
  clusterSize: 6
  clusterVersion: v7

  redisExporter:
    enabled: true
    image: oliver006/redis_exporter:latest
    port: 9121

  persistence:
    enabled: true
    storageClassName: fast-ssd
    accessModes:
      - ReadWriteOnce
    size: 10Gi

  resources:
    requests:
      memory: '256Mi'
      cpu: '250m'
    limits:
      memory: '512Mi'
      cpu: '500m'

  redisConfig:
    maxmemory: '400mb'
    maxmemory-policy: 'allkeys-lru'
    save: '900 1 300 10 60 10000'
    appendonly: 'yes'
    appendfsync: 'everysec'
```

## 监控与告警

### Prometheus配置

```yaml
# monitoring/prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'rules/*.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'saas-platform-services'
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - saas-platform
    relabel_configs:
      - source_labels:
          [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels:
          [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_service_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_service_name]
        action: replace
        target_label: kubernetes_name

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']
```

### Grafana仪表板

```json
{
  "dashboard": {
    "title": "SAAS Platform Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}} - {{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "PostgreSQL connections"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes",
            "legendFormat": "{{pod}}"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total[5m])",
            "legendFormat": "{{pod}}"
          }
        ]
      }
    ]
  }
}
```

### 告警规则

```yaml
# monitoring/alert-rules.yml
groups:
  - name: saas-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value }} errors per second'

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High response time detected'
          description: '95th percentile response time is {{ $value }} seconds'

      - alert: DatabaseConnectionHigh
        expr: pg_stat_database_numbackends > 150
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High database connections'
          description: 'Database has {{ $value }} active connections'

      - alert: MemoryUsageHigh
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High memory usage'
          description: 'Memory usage is {{ $value }}% of limit'

      - alert: CPUUsageHigh
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High CPU usage'
          description: 'CPU usage is {{ $value }}%'
```

## 日志管理

### ELK Stack配置

```yaml
# logging/elasticsearch.yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: elasticsearch
  namespace: logging
spec:
  version: 8.8.0
  nodeSets:
    - name: default
      count: 3
      config:
        node.roles: ['master', 'data', 'ingest']
      podTemplate:
        spec:
          containers:
            - name: elasticsearch
              resources:
                requests:
                  memory: 2Gi
                  cpu: 1000m
                limits:
                  memory: 4Gi
                  cpu: 2000m
      volumeClaimTemplates:
        - metadata:
            name: elasticsearch-data
          spec:
            accessModes:
              - ReadWriteOnce
            resources:
              requests:
                storage: 50Gi
            storageClassName: fast-ssd

---
# logging/kibana.yaml
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: kibana
  namespace: logging
spec:
  version: 8.8.0
  count: 1
  elasticsearchRef:
    name: elasticsearch
  podTemplate:
    spec:
      containers:
        - name: kibana
          resources:
            requests:
              memory: 1Gi
              cpu: 500m
            limits:
              memory: 2Gi
              cpu: 1000m

---
# logging/logstash.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logstash
  namespace: logging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: logstash
  template:
    metadata:
      labels:
        app: logstash
    spec:
      containers:
        - name: logstash
          image: logstash:8.8.0
          ports:
            - containerPort: 5044
            - containerPort: 9600
          env:
            - name: ELASTICSEARCH_HOSTS
              value: 'http://elasticsearch:9200'
          resources:
            requests:
              memory: 1Gi
              cpu: 500m
            limits:
              memory: 2Gi
              cpu: 1000m
          volumeMounts:
            - name: logstash-config
              mountPath: /usr/share/logstash/pipeline
      volumes:
        - name: logstash-config
          configMap:
            name: logstash-config
```

### 日志收集配置

```yaml
# logging/fluent-bit.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020

    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix     kube.var.log.containers.
        Merge_Log           On
        Merge_Log_Key       log_processed
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off

    [OUTPUT]
        Name  es
        Match *
        Host  elasticsearch
        Port  9200
        Index saas-platform-logs
        Type  _doc

  parsers.conf: |
    [PARSER]
        Name        docker
        Format      json
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L
        Time_Keep   On
```

## 性能优化

### 应用性能优化

```typescript
// 性能监控中间件
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, url } = req;
      const { statusCode } = res;

      this.logger.log({
        method,
        url,
        statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      // 记录慢查询
      if (duration > 1000) {
        this.logger.warn(
          `Slow request detected: ${method} ${url} took ${duration}ms`,
        );
      }
    });

    next();
  }
}

// 缓存装饰器
export function Cacheable(ttl: number = 300) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 执行方法并缓存结果
      const result = await method.apply(this, args);
      await this.cacheService.set(cacheKey, result, ttl);

      return result;
    };
  };
}

// 数据库连接池优化
@Injectable()
export class DatabaseConfigService {
  getPostgreSQLConfig(): any {
    return {
      type: 'postgresql',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [
        UserEntity,
        TenantEntity,
        OrganizationEntity,
        DepartmentEntity,
      ],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      poolSize: 20,
      maxQueryExecutionTime: 1000,
      cache: {
        type: 'redis',
        options: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
        },
      },
    };
  }

  getMongoDBConfig(): any {
    return {
      type: 'mongo',
      host: process.env.MONGODB_HOST,
      port: parseInt(process.env.MONGODB_PORT),
      username: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD,
      database: process.env.MONGODB_DB,
      entities: [UserDocument, AuditLogDocument, ConfigurationDocument],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
  }
}
```

### 数据库性能优化

```sql
-- PostgreSQL性能优化配置
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB

-- 索引优化
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_tenant_id ON users(tenant_id);
CREATE INDEX CONCURRENTLY idx_users_organization_id ON users(organization_id);
CREATE INDEX CONCURRENTLY idx_users_department_id ON users(department_id);
CREATE INDEX CONCURRENTLY idx_users_status ON users(status);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- 复合索引
CREATE INDEX CONCURRENTLY idx_users_tenant_status ON users(tenant_id, status);
CREATE INDEX CONCURRENTLY idx_users_org_dept ON users(organization_id, department_id);

-- 部分索引
CREATE INDEX CONCURRENTLY idx_users_active ON users(id) WHERE status = 'ACTIVE';
CREATE INDEX CONCURRENTLY idx_users_tenant_active ON users(tenant_id) WHERE status = 'ACTIVE';
```

## 安全配置

### SSL/TLS配置

```yaml
# security/tls-certificate.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: saas-platform-tls
  namespace: saas-platform
spec:
  secretName: saas-platform-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - api.saas-platform.com
    - admin.saas-platform.com

---
# security/ingress-tls.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: saas-platform-ingress
  namespace: saas-platform
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/force-ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/ssl-protocols: 'TLSv1.2 TLSv1.3'
    nginx.ingress.kubernetes.io/ssl-ciphers: 'ECDHE-RSA-AES128-GCM-SHA256,ECDHE-RSA-AES256-GCM-SHA384'
spec:
  tls:
    - hosts:
        - api.saas-platform.com
        - admin.saas-platform.com
      secretName: saas-platform-tls
  rules:
    - host: api.saas-platform.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 80
```

### 网络安全策略

```yaml
# security/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: saas-platform-network-policy
  namespace: saas-platform
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
        - protocol: TCP
          port: 3001
    - from:
        - namespaceSelector:
            matchLabels:
              name: saas-platform
      ports:
        - protocol: TCP
          port: 3000
        - protocol: TCP
          port: 3001
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: saas-platform
      ports:
        - protocol: TCP
          port: 5432
        - protocol: TCP
          port: 6379
        - protocol: TCP
          port: 27017
    - to: []
      ports:
        - protocol: TCP
          port: 53
        - protocol: UDP
          port: 53
    - to: []
      ports:
        - protocol: TCP
          port: 443
```

## 备份与恢复

### 数据库备份策略

```bash
#!/bin/bash
# backup/backup-script.sh

# PostgreSQL备份
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB \
  --format=custom --compress=9 --verbose \
  --file=postgres-backup-$(date +%Y%m%d_%H%M%S).dump

# MongoDB备份
mongodump --host $MONGODB_HOST --username $MONGODB_USER --password $MONGODB_PASSWORD \
  --db $MONGODB_DB --gzip --archive=mongodb-backup-$(date +%Y%m%d_%H%M%S).gz

# Redis备份
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD --rdb redis-backup-$(date +%Y%m%d_%H%M%S).rdb

# 上传到S3
aws s3 cp postgres-backup-*.dump s3://saas-platform-backups/postgres/
aws s3 cp mongodb-backup-*.gz s3://saas-platform-backups/mongodb/
aws s3 cp redis-backup-*.rdb s3://saas-platform-backups/redis/

# 清理本地备份文件
rm -f postgres-backup-*.dump mongodb-backup-*.gz redis-backup-*.rdb
```

### 恢复脚本

```bash
#!/bin/bash
# backup/restore-script.sh

# PostgreSQL恢复
pg_restore -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB \
  --clean --if-exists --verbose $BACKUP_FILE

# MongoDB恢复
mongorestore --host $MONGODB_HOST --username $MONGODB_USER --password $MONGODB_PASSWORD \
  --db $MONGODB_DB --gzip --archive=$BACKUP_FILE

# Redis恢复
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD --rdb $BACKUP_FILE
```

## 相关文档

- [基础设施实现](./06-infrastructure.md)
- [事件溯源设计](./07-event-sourcing.md)
- [多租户数据隔离](./09-multitenant.md)
- [总结](./10-summary.md)

---

**上一篇**：[基础设施实现](./06-infrastructure.md)  
**下一篇**：[总结](./10-summary.md)
