import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { createPortalToken } from "@/lib/portal-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const sliderVerified = Boolean(body?.sliderVerified);

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "请输入用户名和密码" }, { status: 400 });
    }
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ success: false, message: "用户名长度须为 3~20 个字符" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "密码长度不能少于 6 位" }, { status: 400 });
    }
    if (!sliderVerified) {
      return NextResponse.json({ success: false, message: "请先完成滑块验证" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ success: false, message: "用户名已被注册，请更换" }, { status: 409 });
    }

    const user = await prisma.user.create({ data: { username, password: await hashPassword(password) } });
    const token = createPortalToken({ id: user.id, username: user.username });

    return NextResponse.json({
      success: true,
      message: "注册成功",
      token,
      profile: { id: user.id, username: user.username, identity: user.identity },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "注册失败，请稍后再试" },
      { status: 500 },
    );
  }
}
