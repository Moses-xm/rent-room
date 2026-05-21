"use client";

import { LogOut } from "lucide-react";
import { Modal } from "@/components/Modal";

export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[90vw] max-w-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-base font-medium text-[#333]">确认退出登录？</p>
          <p className="text-sm text-[#999] mt-1">退出后需重新登录才能访问个人中心</p>
        </div>
        <div className="flex border-t border-[#eee]">
          <button
            onClick={onClose}
            className="flex-1 h-11 text-sm text-[#666] hover:bg-[#f5f5f5] transition-colors cursor-pointer border-r border-[#eee]"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 text-sm text-red-500 font-medium hover:bg-red-50 transition-colors cursor-pointer"
          >
            退出登录
          </button>
        </div>
      </div>
    </Modal>
  );
}
