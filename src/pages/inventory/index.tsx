import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import CreateProductForm from "./components/create-product-form"

export default function InventoryPage() {
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Tạo mới</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo sản phẩm mới</DialogTitle>
            <DialogDescription>
              Tạo sản phẩm mới tại đây. Nhấn lưu khi bạn hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <CreateProductForm />
          <DialogFooter>
            <Button type="submit">Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
