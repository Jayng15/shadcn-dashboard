import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { BotIcon } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="w-full h-full border border-sidebar-border bg-sidebar rounded-lg flex items-center">
      <div className="w-full text-center space-y-6">
        <div className="space-y-3">
          <BotIcon className="h-24 w-24 sm:h-32 sm:w-32 text-gray-500 dark:text-gray-400 inline-block" />
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            Rất tiếc!{" "}
            <span className="animate-bounce inline-block text-5xl sm:text-6xl">
              404
            </span>{" "}
            Không tìm thấy trang
          </h1>
          <p className="text-gray-500">
            Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
          </p>
        </div>
        <Button asChild>
          <Link to="/">Quay lại trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
