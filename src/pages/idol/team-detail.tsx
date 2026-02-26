import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "@tanstack/react-router"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
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
import { columns } from "./components/member-columns"
import { MemberForm } from "./components/member-form"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Member, Team } from "@/types"

export default function TeamDetailPage() {
  const { teamId } = useParams({ from: '/idols/$teamId' as any })

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)

  // Fetch team details just to show the name
  const { data: teamsData } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const res = await api.get("/teams")
      return res.data
    },
  })
  const team = teamsData?.teams?.find((t: Team) => t.id === teamId)

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["admin-team-members", teamId, sorting, columnFilters],
    queryFn: async () => {
      const res = await api.get(`/teams/${teamId}/members`)
      return res.data
    },
  })

  const handleOpenCreate = () => {
    setSelectedMember(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (member: Member) => {
    setSelectedMember(member)
    setIsFormOpen(true)
  }

  const handleOpenDelete = (member: Member) => {
    setMemberToDelete(member)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!memberToDelete) return
    try {
      setIsSubmitting(true)
      await api.delete(`/members/${memberToDelete.id}`)
      toast.success("Xóa thành viên thành công")
      setIsDeleteOpen(false)
      refetch()
    } catch (_e) {
      toast.error("Xóa thất bại")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      if (selectedMember) {
        await api.put(`/members/${selectedMember.id}`, formData, {
           headers: { "Content-Type": "multipart/form-data" }
        })
        toast.success("Cập nhật thành viên thành công")
      } else {
        await api.post("/members", formData, {
           headers: { "Content-Type": "multipart/form-data" }
        })
        toast.success("Thêm thành viên thành công")
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
    data: data?.members || [],
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
      editMember: handleOpenEdit,
      deleteMember: handleOpenDelete,
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
    <div className="flex flex-col space-y-4 h-full p-6">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" asChild>
            <Link to={"/idols" as any}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="text-muted-foreground">Quay lại danh sách nhóm</div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Thành viên {team ? `- ${team.name}` : ""}</h2>
          <p className="text-muted-foreground">Quản lý các thành viên trong nhóm.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm thành viên
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
        title={selectedMember ? "Cập nhật thành viên" : "Thêm thành viên mới"}
      >
         <MemberForm
            teamId={teamId}
            initialData={selectedMember}
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
             <p>Bạn có chắc chắn muốn xóa thành viên <b>{memberToDelete?.name}</b> không? Hành động này không thể hoàn tác.</p>
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
