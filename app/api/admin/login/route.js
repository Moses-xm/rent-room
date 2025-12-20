import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const { username, password } = body;

  console.log('username', username);
  console.log('password', password);

  return NextResponse.json({
    success: true,
    message: '登录成功',
  });
}
