// src/app/api/mysql-test/route.js
import pool from '../../../../lib/mysql'; // 导入数据库连接池（使用相对路径指向项目根目录下的 lib）
import { NextResponse } from 'next/server'; // Next.js 内置响应工具

// 处理 GET 请求（用于查询数据库数据）
export async function GET() {
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