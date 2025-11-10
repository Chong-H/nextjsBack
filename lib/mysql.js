// lib/mysql.js
import mysql from 'mysql2/promise';

// 从环境变量读取数据库配置（后续会配置）
const dbConfig = {
  host: process.env.MYSQL_HOST,       // 你的数据库地址
  port: process.env.MYSQL_PORT,       // 端口
  database: process.env.MYSQL_DATABASE, // 数据库名
  user: process.env.MYSQL_USER,       // 账号
  password: process.env.MYSQL_PASSWORD, // 密码
  // 连接池配置（避免频繁创建连接，提升性能）
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
};

// 创建连接池（全局复用，不要每次请求都新建连接）
const pool = mysql.createPool(dbConfig);

export default pool;