import { NextResponse } from "next/server";
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
    if (!sliderVerified) {
      return NextResponse.json({ success: false, message: "请先完成滑块验证" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ success: false, message: "用户名不存在" }, { status: 404 });
    }
    if (!user.isActive) {
      return NextResponse.json({ success: false, message: "账号已停用，请联系客服" }, { status: 403 });
    }
    if (user.password !== password) {
      return NextResponse.json({ success: false, message: "密码错误，请重新输入" }, { status: 401 });
    }

    const token = createPortalToken({ id: user.id, username: user.username });

    return NextResponse.json({
      success: true,
      message: "登录成功",
      token,
      profile: {
        username: user.username,
        nickname: user.nickname ?? undefined,
        avatar: user.avatar ?? undefined,
        identity: user.identity,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "登录失败，请稍后再试" },
      { status: 500 },
    );
  }
}
