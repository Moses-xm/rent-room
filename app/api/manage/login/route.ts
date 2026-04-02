import { NextResponse } from "next/server";
import { serializeAdmin } from "@/lib/admin";
import { createManageToken } from "@/lib/manage-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const sliderVerified = Boolean(body?.sliderVerified);

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "请输入用户名和密码" },
        { status: 400 },
      );
    }

    if (!sliderVerified) {
      return NextResponse.json(
        { success: false, message: "请先完成滑块验证" },
        { status: 400 },
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "管理员账号不存在" },
        { status: 404 },
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, message: "当前账号已停用，暂时无法登录" },
        { status: 403 },
      );
    }

    if (admin.password !== password) {
      return NextResponse.json(
        { success: false, message: "密码错误，请重新输入" },
        { status: 401 },
      );
    }

    const token = createManageToken({ id: admin.id, username: admin.username });

    return NextResponse.json({
      success: true,
      message: "登录成功",
      "manage-token": token,
      manageToken: token,
      admin: serializeAdmin(admin),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "登录失败，请稍后再试",
      },
      { status: 500 },
    );
  }
}
