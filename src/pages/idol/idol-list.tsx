import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import DataTable from "@/pages/users/components/data-table"
import DataTablePagination from "@/pages/users/components/data-table-pagination"
import { columns } from "./components/team-columns"
import { TeamForm } from "./components/team-form"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Team } from "@/types"
import { useNavigate } from "@tanstack/react-router"

export default function IdolListPage() {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["admin-teams", sorting, columnFilters],
    queryFn: async () => {
      const res = await api.get("/idol/teams")
      return res.data
    },
  })

  const handleOpenCreate = () => {
    setSelectedTeam(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (team: Team) => {
    setSelectedTeam(team)
    setIsFormOpen(true)
  }

  const handleOpenDelete = (team: Team) => {
    setTeamToDelete(team)
    setIsDeleteOpen(true)
  }

  const handleManageMembers = (team: Team) => {
    navigate({ to: "/idols/$teamId" as any, params: { teamId: team.id } as any })
  }

  const handleDelete = async () => {
    if (!teamToDelete) return
    try {
      setIsSubmitting(true)
      await api.delete(`/idol/teams/${teamToDelete.id}`)
      toast.success("Xóa nhóm thành công")
      setIsDeleteOpen(false)
      refetch()
    } catch (_e) {
      toast.error("Xóa nhóm thất bại")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      if (selectedTeam) {
        await api.put(`/idol/teams/${selectedTeam.id}`, formData, {
           headers: { "Content-Type": "multipart/form-data" }
        })
        toast.success("Cập nhật nhóm thành công")
      } else {
        await api.post("/idol/teams", formData, {
           headers: { "Content-Type": "multipart/form-data" }
        })
        toast.success("Tạo nhóm thành công")
      }
      setIsFormOpen(false)
      refetch()
    } catch (_e) {
      toast.error("Lưu thất bại")
    } finally {
      setIsSubmitting(false)
    }
  }

  const table = useReactTable({
    data: data?.teams || [],
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
      manageMembers: handleManageMembers,
      editTeam: handleOpenEdit,
      deleteTeam: handleOpenDelete,
    },
  })

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Đã xảy ra lỗi: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nhóm Idol (Teams)</h2>
          <p className="text-muted-foreground">Quản lý các nhóm Idol trên hệ thống.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm nhóm
        </Button>
      </div>

      <Card className="bg-sidebar w-full min-h-full flex flex-col">
        <CardContent className="flex-1 p-0">
          {isPending ? (
             <div className="p-4">Đang tải...</div>
          ) : (
             <DataTable table={table} columns={columns} />
          )}
        </CardContent>
        {!isPending && (
           <div className="p-4 border-t">
              <DataTablePagination table={table} className="w-full" />
           </div>
        )}
      </Card>

      <ResponsiveDialog
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        title={selectedTeam ? "Cập nhật nhóm Idol" : "Thêm nhóm Idol mới"}
      >
         <TeamForm
            initialData={selectedTeam}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
         />
      </ResponsiveDialog>

      <ResponsiveDialog
         isOpen={isDeleteOpen}
         setIsOpen={setIsDeleteOpen}
         title="Xác nhận xóa"
      >
         <div className="space-y-4">
             <p>Bạn có chắc chắn muốn xóa nhóm <b>{teamToDelete?.name}</b> không? Hành động này sẽ xóa tất cả thành viên trong nhóm và không thể hoàn tác.</p>
             <div className="flex justify-end gap-2">
                 <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>Hủy</Button>
                 <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                    {isSubmitting ? "Đang xóa..." : "Xóa"}
                 </Button>
             </div>
         </div>
      </ResponsiveDialog>
    </div>
  )
}
