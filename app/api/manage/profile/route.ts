import { NextResponse } from "next/server";
import { serializeAdmin } from "@/lib/admin";
import { requireManageAuth } from "@/lib/manage-auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { deleteUploadedAvatar } from "@/lib/uploaded-file";
import { normalizeUploadPathForStorage } from "@/lib/upload-path";

export async function GET(req: Request) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const admin = await prisma.admin.findUnique({
      where: { id: auth.admin.id },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "管理员不存在" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeAdmin(admin),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";
    const hasAvatar = typeof body?.avatar === "string";
    const normalizedAvatar = hasAvatar
      ? normalizeUploadPathForStorage(body.avatar)
      : undefined;

    const existingAdmin = await prisma.admin.findUnique({
      where: { id: auth.admin.id },
      select: { avatar: true },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        { success: false, message: "管理员不存在" },
        { status: 404 },
      );
    }

    const admin = await prisma.admin.update({
      where: { id: auth.admin.id },
      data: {
        ...(hasAvatar ? { avatar: normalizedAvatar || null } : {}),
        ...(password ? { password: await hashPassword(password) } : {}),
      },
    });

    const previousAvatar = existingAdmin.avatar?.trim() || "";
    const nextAvatar = normalizedAvatar || "";

    if (hasAvatar && previousAvatar && previousAvatar !== nextAvatar) {
      try {
        await deleteUploadedAvatar(previousAvatar);
      } catch (cleanupError) {
        console.error("Failed to delete previous avatar:", cleanupError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "个人资料已更新",
      data: serializeAdmin(admin),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
