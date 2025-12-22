// src/app/api/mysql-test/route.js
import pool from '../../../../lib/mysql'; // 导入数据库连接池（使用相对路径指向项目根目录下的 lib）
import { NextResponse } from 'next/server'; // Next.js 内置响应工具

// 核心配置：允许的 Workers 域名（你的 dpdns.org）
const ALLOWED_DOMAIN = 'dpdns.org';
// 允许的子域名（按需扩展，比如 www.dpdns.org、api.dpdns.org）
const ALLOWED_SUBDOMAINS = [ALLOWED_DOMAIN, `www.${ALLOWED_DOMAIN}`, `api.${ALLOWED_DOMAIN}`];

// 通用验证函数：校验 Token + 域名来源
const validateRequest = (request) => {
  // 1. 验证专属 Token（从环境变量读取，避免硬编码）
  const authToken = request.headers.get('X-Worker-Auth-Token');
  const validToken = process.env.WORKER_AUTH_TOKEN;
  if (!authToken || authToken !== validToken) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, message: 'Unauthorized: 无效的验证 Token' },
        { status: 401 }
      )
    };
  }

  // 2. 严格校验请求来源为 dpdns.org
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';

  // 解析 Origin/Referer 中的域名（防止伪造，比如 dpdns.org.evil.com）
  const parseDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };
  const originDomain = parseDomain(origin);
  const refererDomain = parseDomain(referer);

  // 校验是否为允许的域名
  const isFromAllowedDomain = ALLOWED_SUBDOMAINS.includes(originDomain) || ALLOWED_SUBDOMAINS.includes(refererDomain);
  if (!isFromAllowedDomain) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, message: `Forbidden: 仅允许 ${ALLOWED_DOMAIN} 域名访问` },
        { status: 403 }
      )
    };
  }

  // 3. 无 Origin/Referer 直接拒绝（防止绕过）
  if (!origin && !referer) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, message: 'Forbidden: 缺少 Origin/Referer 验证头' },
        { status: 403 }
      )
    };
  }

  // 验证通过
  return { valid: true, origin };
};
// 处理 OPTIONS 预检请求（跨域必备）
export async function OPTIONS(request) {
  const origin = request.headers.get('Origin') || `https://${ALLOWED_DOMAIN}`;
  // 仅放行 dpdns.org 域名的预检请求
  if (origin.includes(ALLOWED_DOMAIN)) {
    return new NextResponse(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Worker-Auth-Token, Content-Type',
        'Access-Control-Max-Age': '86400' // 预检缓存 24 小时
      }
    });
  }
  // 非允许域名的预检请求直接拒绝
  return new NextResponse(null, { status: 403 });
}
// 处理 GET 请求（用于查询数据库数据）
export async function GET(request) {
  const validation = validateRequest(request);
  if (!validation.valid) {
    return validation.response;
  }
  try {
    // 1. 从连接池获取连接
    const [rows] = await pool.query('SELECT * FROM user'); // 简单测试 SQL（无需实际表）
    
    // 2. 返回成功响应
    return NextResponse.json({
      success: true,
      message: '数据库连接成功！',
      testData: rows // 返回测试结果（应该是 [{ test_result: 2 }]）
    });
  } catch (error) {
    // 3. 捕获错误并返回
    return NextResponse.json({
      success: false,
      message: '数据库连接失败',
      error: error.message // 错误信息（方便排查问题）
    }, { status: 500 }); // 500 表示服务器错误
  }
}
// （可选）处理 POST 请求（用于插入数据，后续可扩展）
export async function POST(request) {
  const validation = validateRequest(request);
  if (!validation.valid) {
    return validation.response;
  }
  try {
    // 1. 获取请求体中的数据（假设前端传了 name 和 age）
    const { name, age } = await request.json();
    
    // 2. 执行插入 SQL（注意：需先在数据库创建表，比如叫 `users`）
    const [result] = await pool.query(
      'INSERT INTO users (name, age) VALUES (?, ?)', // 参数化查询（防 SQL 注入）
      [name, age] // 对应 SQL 中的两个 ?
    );
    
    // 3. 返回插入结果
    return NextResponse.json({
      success: true,
      message: '数据插入成功',
      insertId: result.insertId // 插入数据的 ID
    }, { status: 201 }); // 201 表示创建成功
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '数据插入失败',
      error: error.message
    }, { status: 500 });
  }
}