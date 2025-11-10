# my-next-backend — README

## README — English

Project purpose

This repository contains a Next.js backend (app router) intended to be deployed on Vercel as a cloud backend that connects to a remote MySQL database. The project currently implements API routes only (no frontend pages). The main example is `GET /api/mysql-test` which queries the `users` table and returns the rows.

Quick start (local)

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file `.env.local` in the project root with these variables (example):

```env
MYSQL_HOST=example.sqlpub.com
MYSQL_PORT=ExampleNumber
MYSQL_DATABASE=ExampleDatabase
MYSQL_USER=ExampleUser
MYSQL_PASSWORD=ExamplePassword
```

3. Run the development server:

```bash
npm run dev
```

4. Call the API route (default port 3000; if 3000 is busy Next will pick another port such as 3001):

```
GET http://localhost:3000/api/mysql-test
```

What the API returns

- On success: JSON with `success: true` and `data` containing all rows from the `users` table.
- On failure: `success: false` and an `error` message.

Example success response:

```json
{
  "success": true,
  "message": "查询 users 表成功",
  "data": [
    { "id": 1, "name": "Alice", "age": 28 },
    { "id": 2, "name": "Bob", "age": 35 }
  ]
}
```

Database and schema

The repository contains `lib/mysql.js` which uses `mysql2/promise` and a connection pool. The backend expects a `users` table. If you need a simple schema for testing, run:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, age) VALUES ('Alice', 28), ('Bob', 35);
```

Environment & deployment notes (Vercel)

- When deploying to Vercel, set the same environment variables under the Project Settings -> Environment Variables. Do NOT commit `.env.local` to version control.
- Vercel will run the serverless Node runtime for API routes. Ensure the remote MySQL instance allows connections from Vercel IP ranges or configure a database proxy / private networking if needed.
- Keep credentials secret. Use Vercel environment variables for production credentials.

Import path notes

- The project currently uses relative imports for the `lib` folder (for example `import pool from '../../../../lib/mysql'`). If you prefer using an alias like `@`, add or adjust `tsconfig.json` and `next.config.js` to map the alias and make sure the alias resolves at build time.

Dependencies

- `next` (app router)
- `mysql2` (database driver)

Troubleshooting

- Module not found errors for `@/lib/mysql`: use the correct relative path or configure path aliases.
- Database connection errors: check `.env.local`, network access, and credentials. Common MySQL errors include `ECONNREFUSED` (host/port unreachable) and `ER_ACCESS_DENIED_ERROR` (invalid credentials).
- If port 3000 is in use, Next dev will select another available port (3001 etc). Check the terminal output.

Security

- Never commit `.env.local` or credentials. Use environment variables in Vercel for production.
- Use parameterized queries (the code uses `?` parameter placeholders in POST handlers) to avoid SQL injection.

## README — 中文

项目用途

该仓库实现了一个基于 Next.js（app 路由）的云后端，用于部署到 Vercel 并连接远程 MySQL 数据库。项目目前仅包含后端 API 路由，示例接口为 `GET /api/mysql-test`，用于查询 `users` 表并返回数据行。

本地快速运行

1. 安装依赖：

```bash
npm install
```

2. 在项目根目录创建 `.env.local` 并写入如下环境变量（示例）：

```env
MYSQL_HOST=mysql5.sqlpub.com
MYSQL_PORT=3310
MYSQL_DATABASE=sqlpubchonghe
MYSQL_USER=testusersqlpub
MYSQL_PASSWORD=iDNOaRaK1SOUaDFS
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 访问接口（默认 3000 端口；若 3000 被占用，Next 会选择其它端口如 3001）：

```
GET http://localhost:3000/api/mysql-test
```

接口返回

- 成功时：返回 JSON，`success: true`，并且 `data` 包含 `users` 表的所有数据。
- 失败时：`success: false`，并带有 `error` 字段说明错误。

示例成功响应同上。

数据库与表结构

项目使用 `lib/mysql.js` 中通过 `mysql2/promise` 创建的连接池。后端示例依赖 `users` 表。测试建表语句参考：

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, age) VALUES ('Alice', 28), ('Bob', 35);
```

部署到 Vercel 的注意事项

- 在 Vercel 项目设置中配置与 `.env.local` 相同的环境变量（Project -> Settings -> Environment Variables）。切勿把 `.env.local` 提交到仓库。
- 确保数据库允许来自 Vercel 的连接，或采用数据库代理 / 私有网络等方案以保证连接安全。

导入路径提示

- 如果出现 `@/lib/mysql` 无法解析的问题，请使用相对路径或在 `tsconfig.json` / `next.config.js` 中添加并同步路径别名配置。

故障排查

- 模块找不到（Module not found）：检查导入路径或别名配置。
- 数据库连接失败：检查 `.env.local` 的配置、网络连通性和数据库账号密码。常见错误包括 `ECONNREFUSED`（无法连接）和 `ER_ACCESS_DENIED_ERROR`（权限/账号密码错误）。
- 当 3000 端口被占用时，开发服务器会自动选择可用端口（如 3001），请查看终端输出确认实际访问端口。

安全性

- 切勿提交包含凭据的文件。生产环境使用 Vercel 的环境变量来保存敏感信息。
- 使用参数化查询避免 SQL 注入（示例中的 POST 使用 `?` 占位符）。

更多帮助

如果你希望我：

- 把项目改为使用 `@` 别名并自动配置 `next.config.ts` 和 `tsconfig.json`；
- 添加一个小的 Postman / curl 使用示例脚本；
- 或者为 `users` 表编写更完整的 CRUD API（分页、验证等）；

