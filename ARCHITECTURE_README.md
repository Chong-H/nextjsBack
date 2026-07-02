# 架构概览（OOP 风格）

本文档以面向对象（OOP）方式描述本项目中的功能模块，将每个主要模块抽象为“类”，说明其职责（Responsibility）、属性（Attributes）、方法（Methods）和协作者（Collaborators）。目标是帮助开发者快速理解系统边界、调用流程与数据模型。

---

**项目结构（关键文件）**
- **数据库连接池**: [lib/mysql.js](lib/mysql.js)
- **仓库管理 API**: [src/app/api/git-repo/route.js](src/app/api/git-repo/route.js)
- **MySQL 测试 API**: [src/app/api/mysql-test/route.js](src/app/api/mysql-test/route.js)
- **全局布局**: [src/app/layout.tsx](src/app/layout.tsx)
- **首页组件**: [src/app/page.tsx](src/app/page.tsx)
- **项目元信息 / 配置**: [package.json](package.json), [next.config.ts](next.config.ts)

---

## 类（模块）清单

以下以类的形式描述项目中的核心模块。注意：源代码并非以类声明实现，此处为便于理解而做的面向对象抽象。

### Class: DatabasePool
- 源文件: [lib/mysql.js](lib/mysql.js)
- 责任: 管理与 MySQL 的连接池，提供复用连接以提升性能与稳定性。
- 属性:
  - `config`: 数据库连接配置（host, port, database, user, password, connectionLimit 等，来自环境变量）
  - `pool`: mysql2/promise 创建的连接池实例
- 方法:
  - `query(sql, params)`: 在连接池中执行查询并返回结果（内部由 `pool.query` 提供）
  - `getConnection()`（隐含）: 从池中获取单个连接以便事务（若需要）
- 协作者:
  - API 控制器（GitRepoController、MysqlTestController）通过 `import pool from 'lib/mysql'` 调用 `query` 接口。

### Class: GitRepoController
- 源文件: [src/app/api/git-repo/route.js](src/app/api/git-repo/route.js)
- 责任: 提供面向仓库（git repo）的增删改查 HTTP API，实现对 `user_git_repos` 表的 CRUD 操作，并包含跨域/来源验证逻辑。
- 属性:
  - `ALLOWED_DOMAIN`: 允许的域名后缀（例如 `dpdns.org`）
  - `ALLOWED_SUBDOMAINS`（可选）: 若使用白名单子域名列表
  - `pool`: 引用 `DatabasePool`（即 `lib/mysql.js` 导出的连接池）
- 方法(对应 HTTP 动作):
  - `OPTIONS(request)`: 处理预检请求，返回 CORS 相关头
  - `GET(request)`: 支持按 `user_id` 查询仓库列表；查询 `user_git_repos` 表并返回行集合
  - `POST(request)`: 新增仓库记录；参数验证（user_id, repo_name, repo_url 必填），执行 INSERT
  - `PUT(request)`: 更新仓库；动态拼接更新字段并执行 UPDATE
  - `DELETE(request)`: 删除仓库记录，按 id 删除
  - `validateRequest(request)`: 验证请求来源（Origin/Referer）是否属于允许域名，决定是否放行（部分验证在文件中已注释/可开启）
- 协作者:
  - `DatabasePool`（读写数据库）
  - Next.js 路由层（作为 App Router 中的 API Route）

### Class: MysqlTestController
- 源文件: [src/app/api/mysql-test/route.js](src/app/api/mysql-test/route.js)
- 责任: 提供一个简单的数据库连通性与测试接口，演示如何使用连接池查询 `user`（或 `users`）表并返回结果，同时包含来源验证逻辑。
- 属性:
  - `ALLOWED_DOMAIN` / `ALLOWED_SUBDOMAINS`: 用于验证跨域来源
  - `pool`: 引用 `DatabasePool`
- 方法:
  - `OPTIONS(request)`: 返回适配 CORS 的响应头
  - `GET(request)`: 执行 `SELECT * FROM user`（或 `users`），返回查询结果
  - `POST(request)`: 示例插入方法，演示如何用参数化查询插入数据
  - `validateRequest(request)`: 与 `GitRepoController` 类似的来源验证逻辑（实际实现略有差别）
- 协作者:
  - `DatabasePool`

### Class: RootLayout (UI Component)
- 源文件: [src/app/layout.tsx](src/app/layout.tsx)
- 责任: 应用级布局组件（Next.js App Router 的根布局），负责注入字体、全局样式与基本 HTML 结构。
- 属性:
  - `children`: React 子元素
  - `metadata`: 页面元信息（title、description）
- 方法/行为:
  - 返回 HTML/Body，并应用全局字体变量与样式
  - 不直接依赖后端，作为静态/客户端渲染的壳

### Class: HomePage (UI Component)
- 源文件: [src/app/page.tsx](src/app/page.tsx)
- 责任: 项目的示例主页，展示静态内容与外链，用于开发时快速定位与验证前端构建。
- 属性:
  - 无复杂状态，主要渲染静态资源与链接
- 协作者:
  - 静态资源（public/*），样式表 [src/app/page.module.css](src/app/page.module.css)

### Class: Config
- 源文件: [package.json](package.json), [next.config.ts](next.config.ts), [tsconfig.json](tsconfig.json)
- 责任: 定义依赖、运行脚本和构建配置（Next.js 配置位于 next.config.ts）

---

## 数据模型（抽象）
- `users` / `user` 表（用于 mysql-test 示例）
  - 字段示例: `id`, `name`, `age`, `created_at`
- `user_git_repos` 表（仓库管理）
  - 字段示例: `id`, `user_id`, `repo_name`, `repo_url`, `default_branch`, `created_at`

以上表并未在代码中以 ORM 表达，示例 SQL 和建表语句见项目 README（README.md）。

---

## 请求调用流程（示例：新增仓库 POST）
1. 客户端发起 `POST /api/git-repos`，请求体含 `user_id/repo_name/repo_url`。
2. `GitRepoController.POST` 解析 JSON，进行必填字段校验。
3. 控制器调用 `DatabasePool.query('INSERT ...', params)` 执行写入。
4. 返回 201 与插入 ID，或在错误时返回 500 与错误信息。

## 安全与扩展建议（面向对象的改进方向）
- 将“验证逻辑”封装为单独类 `RequestValidator`，支持策略注入（例如按域名后缀或白名单子域名两种策略）。
- 将数据库访问抽象为 `Repository` 层：例如 `UserRepo`、`GitRepo`，每个 Repo 提供 CRUD 方法，控制器仅调用 Repo，而不直接写 SQL。
- 增加 `Service` 层用于业务聚合：例如 `GitRepoService` 组合 `GitRepoRepository` 与外部校验，便于单元测试。
- 考虑使用 TypeScript 将接口与类型显式化（当前项目混用 JS/TS）。

---

## 快速查看点
- 查看数据库连接实现（连接池）: [lib/mysql.js](lib/mysql.js)
- 查看仓库 API 实现: [src/app/api/git-repo/route.js](src/app/api/git-repo/route.js)
- 查看 MySQL 测试接口: [src/app/api/mysql-test/route.js](src/app/api/mysql-test/route.js)

---

如果需要，我可以：
- 将上述抽象转换为 UML 类图（文本或 mermaid）
- 将控制器中的验证逻辑重构为 `RequestValidator` 类并抽取公共函数
- 将 SQL 访问抽象为 `Repository` 类并补充单元测试

请告诉我你希望我优先执行哪个后续动作。
