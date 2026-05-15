import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ColumnFiltersState,
    SortingState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import DataTable from "@/pages/users/components/data-table";
import DataTablePagination from "@/pages/users/components/data-table-pagination";
import { bannerColumns } from "./banner-columns";
import { type Banner } from "@/types";
import { exactImageUrl } from "@/lib/utils";

export default function BannerManagement() {
    const queryClient = useQueryClient();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        link: "",
        order: "0",
        isActive: "1" as "0" | "1",
    });

    const { data, isPending } = useQuery({
        queryKey: ["banners"],
        queryFn: async () => {
            const res = await api.get("/banner");
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (payload: FormData) => {
            await api.post("/banner", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Đã thêm banner");
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            setIsDialogOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Thêm banner thất bại");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: FormData }) => {
            await api.put(`/banner/${id}`, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Đã cập nhật banner");
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            setIsDialogOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Cập nhật banner thất bại");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/banner/${id}`);
        },
        onSuccess: () => {
            toast.success("Đã xóa banner");
            queryClient.invalidateQueries({ queryKey: ["banners"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || "Xóa banner thất bại");
        },
    });

    const handleOpenAdd = () => {
        setSelectedBanner(null);
        setFormData({ link: "", order: "0", isActive: "1" });
        setFile(null);
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (banner: Banner) => {
        setSelectedBanner(banner);
        setFormData({
            link: banner.link || "",
            order: banner.order,
            isActive: banner.isActive,
        });
        setFile(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa banner này?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append("link", formData.link);
        fd.append("order", formData.order);
        fd.append("isActive", formData.isActive);
        if (file) {
            fd.append("image", file);
        }

        if (selectedBanner) {
            updateMutation.mutate({ id: selectedBanner.id, payload: fd });
        } else {
            if (!file) {
                toast.error("Vui lòng chọn ảnh cho banner");
                return;
            }
            createMutation.mutate(fd);
        }
    };

    const table = useReactTable({
        data: data?.banners || [],
        columns: bannerColumns,
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
            deleteBanner: handleDelete,
        },
    });

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Danh sách Banner</h3>
                <Button onClick={handleOpenAdd} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Thêm Banner
                </Button>
            </div>

            {isPending ? (
                <div className="py-10 text-center">Đang tải...</div>
            ) : (
                <>
                    <CardContent className="flex-1 p-0">
                        <DataTable table={table} columns={bannerColumns} />
                    </CardContent>
                    <CardFooter className="px-0 pt-4">
                        <DataTablePagination table={table} className="w-full" />
                    </CardFooter>
                </>
            )}

            <ResponsiveDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                title={selectedBanner ? "Chỉnh sửa Banner" : "Thêm Banner mới"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="image">Hình ảnh {selectedBanner ? "" : "*"}</Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setFile(e.target.files[0]);
                                }
                            }}
                            required={!selectedBanner}
                        />
                        {selectedBanner?.imageUrl && !file && (
                            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                Ảnh hiện tại:{" "}
                                <img
                                    src={exactImageUrl(selectedBanner.imageUrl)}
                                    alt="current"
                                    className="h-12 w-24 object-cover rounded border"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="link">Đường dẫn (Link)</Label>
                        <Input
                            id="link"
                            type="url"
                            placeholder="https://example.com"
                            value={formData.link}
                            onChange={(e) =>
                                setFormData({ ...formData, link: e.target.value })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="order">Thứ tự hiển thị</Label>
                            <Input
                                id="order"
                                type="number"
                                min="0"
                                value={formData.order}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "" || parseInt(value) >= 0) {
                                        setFormData({ ...formData, order: value });
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="isActive">Trạng thái</Label>
                            <Select
                                value={formData.isActive}
                                onValueChange={(val) =>
                                    setFormData({ ...formData, isActive: val as "0" | "1" })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Hoạt động</SelectItem>
                                    <SelectItem value="0">Tạm dừng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {selectedBanner ? "Cập nhật" : "Thêm mới"}
                        </Button>
                    </div>
                </form>
            </ResponsiveDialog>
        </>
    );
}
