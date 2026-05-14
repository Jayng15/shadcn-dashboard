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
import { type Setting } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  
  const [formData, setFormData] = useState({
    value: "",
    description: "",
  });

  const { error, data, isPending } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
        const res = await api.get('/setting');
        return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { key: string; data: typeof formData }) => {
      await api.put(`/setting/${payload.key}`, payload.data);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật cấu hình");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
        const message = err.response?.data?.error || "Cập nhật cấu hình thất bại";
        toast.error(message);
    },
  });

  const handleOpenEdit = (setting: Setting) => {
    setSelectedSetting(setting);
    setFormData({
      value: setting.value,
      description: setting.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSetting) {
      updateMutation.mutate({ key: selectedSetting.key, data: formData });
    }
  };

  const sortedSettings = useMemo(() => {
    const settings = data?.settings || [];
    return [...settings].sort((a: Setting, b: Setting) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data?.settings]);

  const table = useReactTable({
    data: sortedSettings,
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
    }
  });

  if (error) return <div className="p-4 text-red-500">Đã xảy ra lỗi: {(error as Error).message}</div>;

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Cấu hình hệ thống</h2>
      </div>

      <Card className="bg-sidebar w-full min-h-full flex flex-col">
        {isPending ? (
          <CardContent className="pt-6">Đang tải...</CardContent>
        ) : (
          <>
            <CardContent className="flex-1 pt-6">
              <DataTable table={table} columns={columns} />
            </CardContent>
            <CardFooter>
              <DataTablePagination table={table} className="w-full" />
            </CardFooter>
          </>
        )}
      </Card>

      <ResponsiveDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        title={`Chỉnh sửa cấu hình: ${selectedSetting?.key}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">Giá trị</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              Cập nhật
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
