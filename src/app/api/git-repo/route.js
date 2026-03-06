import pool from '../../../../lib/mysql'; // 复用原有数据库连接池
import { NextResponse } from 'next/server';

// 复用你原有的验证逻辑（复制过来，保证权限一致）
const ALLOWED_DOMAIN = 'dpdns.org';
const ALLOWED_SUBDOMAINS = [ALLOWED_DOMAIN, `www.${ALLOWED_DOMAIN}`, `chonghe.${ALLOWED_DOMAIN}`];


  // 2. 验证域名（和原有逻辑完全一致）
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  const parseDomain = (url) => {
    try { return new URL(url).hostname; } catch { return ''; }
  };
  const originDomain = parseDomain(origin);
  const refererDomain = parseDomain(referer);
  const isFromAllowedDomain = ALLOWED_SUBDOMAINS.includes(originDomain) || ALLOWED_SUBDOMAINS.includes(refererDomain);
  
  if (!isFromAllowedDomain || (!origin && !referer)) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, message: `Forbidden: 仅允许 ${ALLOWED_DOMAIN} 域名访问` },
        { status: 403 }
      )
    };
  }

  return { valid: true, origin };
};

// OPTIONS 预检请求（仅针对 git-repos 接口）
export async function OPTIONS(request) {
  const origin = request.headers.get('Origin') || `https://${ALLOWED_DOMAIN}`;
  if (origin.includes(ALLOWED_DOMAIN)) {
    return new NextResponse(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Worker-Auth-Token, Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  return new NextResponse(null, { status: 403 });
}

// ====== 1. GET：查询仓库（对标 SpringBoot 的 @GetMapping）======
// 调用示例：GET /api/git-repos?user_id=1
export async function GET(request) {
  const validation = validateRequest(request);
  if (!validation.valid) return validation.response;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    let sql = 'SELECT * FROM user_git_repos';
    const params = [];
    if (userId) {
      sql += ' WHERE user_id = ?';
      params.push(userId);
    }

    const [rows] = await pool.query(sql, params);
    return NextResponse.json({
      success: true,
      message: '仓库列表查询成功',
      data: rows
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '查询失败',
      error: error.message
    }, { status: 500 });
  }
}

// ====== 2. POST：新增仓库（对标 SpringBoot 的 @PostMapping）======
// 调用示例：POST /api/git-repos + JSON 请求体
export async function POST(request) {
  const validation = validateRequest(request);
  if (!validation.valid) return validation.response;

  try {
    const { user_id, repo_name, repo_url, default_branch } = await request.json();
    // 必传字段校验
    if (!user_id || !repo_name || !repo_url) {
      return NextResponse.json({
        success: false,
        message: '缺少必填字段：user_id/repo_name/repo_url'
      }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO user_git_repos (user_id, repo_name, repo_url, default_branch) VALUES (?, ?, ?, ?)',
      [user_id, repo_name, repo_url, default_branch || 'master']
    );

    return NextResponse.json({
      success: true,
      message: '仓库新增成功',
      data: { insertId: result.insertId }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '新增失败',
      error: error.message
    }, { status: 500 });
  }
}

// ====== 3. PUT：更新仓库（对标 SpringBoot 的 @PutMapping）======
// 调用示例：PUT /api/git-repos + JSON 请求体（含 id）
export async function PUT(request) {
  const validation = validateRequest(request);
  if (!validation.valid) return validation.response;

  try {
    const { id, repo_name, repo_url, default_branch } = await request.json();
    if (!id) {
      return NextResponse.json({
        success: false,
        message: '缺少必填字段：id'
      }, { status: 400 });
    }

    // 动态拼接更新字段（只更传入的字段）
    const updateFields = [];
    const params = [];
    if (repo_name) {
      updateFields.push('repo_name = ?');
      params.push(repo_name);
    }
    if (repo_url) {
      updateFields.push('repo_url = ?');
      params.push(repo_url);
    }
    if (default_branch) {
      updateFields.push('default_branch = ?');
      params.push(default_branch);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: false,
        message: '无需要更新的字段'
      }, { status: 400 });
    }

    params.push(id); // 最后拼接 id 作为 WHERE 条件
    const [result] = await pool.query(
      `UPDATE user_git_repos SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    return NextResponse.json({
      success: true,
      message: result.affectedRows > 0 ? '更新成功' : '无匹配记录',
      data: { affectedRows: result.affectedRows }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '更新失败',
      error: error.message
    }, { status: 500 });
  }
}

// ====== 4. DELETE：删除仓库（对标 SpringBoot 的 @DeleteMapping）======
// 调用示例：DELETE /api/git-repos?id=1
export async function DELETE(request) {
  const validation = validateRequest(request);
  if (!validation.valid) return validation.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        success: false,
        message: '缺少必填字段：id'
      }, { status: 400 });
    }

    const [result] = await pool.query(
      'DELETE FROM user_git_repos WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: result.affectedRows > 0 ? '删除成功' : '无匹配记录',
      data: { affectedRows: result.affectedRows }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '删除失败',
      error: error.message
    }, { status: 500 });
  }
}