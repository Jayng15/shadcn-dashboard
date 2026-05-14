
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "@/pages/users/components/data-table";
import { columns } from "./components/columns";
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import DataTablePagination from "@/pages/users/components/data-table-pagination";
import api from "@/lib/api";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { type FAQ } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function FaqPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    isActive: "TRUE" as "TRUE" | "FALSE",
  });

  const { error, data } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
        const res = await api.get('/faq');
        return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newData: typeof formData) => {
      await api.post('/faq', newData);
    },
    onSuccess: () => {
      toast.success("Đã tạo FAQ mới");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Tạo FAQ thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<typeof formData> }) => {
      await api.put(`/faq/${payload.id}`, payload.data);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật FAQ");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Cập nhật FAQ thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/faq/${id}`);
    },
    onSuccess: () => {
      toast.success("Đã xóa FAQ");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setIsDeleteDialogOpen(false);
    },
    onError: () => toast.error("Xóa FAQ thất bại"),
  });

  const handleOpenCreate = () => {
    setSelectedFaq(null);
    setFormData({ question: "", answer: "", isActive: "TRUE" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFaq) {
      updateMutation.mutate({ id: selectedFaq.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const sortedFaqs = useMemo(() => {
    const faqs = data?.faqs || [];
    return [...faqs].sort((a: FAQ, b: FAQ) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data?.faqs]);

  const table = useReactTable({
    data: sortedFaqs,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      openEditDialog: handleOpenEdit,
      openDeleteDialog: (faq: FAQ) => {
        setSelectedFaq(faq);
        setIsDeleteDialogOpen(true);
      },
    }
  });

  if (error) return <div className="p-4 text-red-500">Đã xảy ra lỗi: {(error as Error).message}</div>;

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Quản lý FAQ</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </div>

      <Card className="bg-sidebar w-full min-h-full flex flex-col">
        <CardContent className="flex-1 pt-6">
          <DataTable table={table} columns={columns} />
        </CardContent>
        <CardFooter>
          <DataTablePagination table={table} className="w-full" />
        </CardFooter>
      </Card>

      <ResponsiveDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        title={selectedFaq ? "Chỉnh sửa FAQ" : "Thêm FAQ mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Câu hỏi</Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="answer">Câu trả lời</Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isActive">Trạng thái</Label>
            <Select
              value={formData.isActive}
              onValueChange={(val: "TRUE" | "FALSE") => setFormData({ ...formData, isActive: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRUE">Hoạt động</SelectItem>
                <SelectItem value="FALSE">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {selectedFaq ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p>Bạn có chắc chắn muốn xóa FAQ này? Thao tác này không thể hoàn tác.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={() => selectedFaq && deleteMutation.mutate(selectedFaq.id)} disabled={deleteMutation.isPending}>
              Xóa
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
