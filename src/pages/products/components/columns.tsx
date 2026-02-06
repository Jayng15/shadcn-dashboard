
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { SafeImage } from "@/components/safe-image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { toast } from "sonner"

export type Product = {
  id: string;
  name: string;
  storeId: string; // Or store object if joined? API usually returns just IDs or minimal info.
  price: string;
  currency: string;
  status: string;
  isVerified: boolean;
  thumbnailUrl: string;
  createdAt: string;
  // TODO: Add storeName if available in projection
}

// Helper to verify from column action
const verifyProduct = async (id: string, tableMeta: any) => {
    try {
        await api.post(`/product/${id}/verify`);
        toast.success("Product verified");
        // Trigger refetch
        tableMeta?.refetch();
    } catch (e: any) {
        toast.error("Failed to verify product");
    }
}

export const columns: ColumnDef<Product>[] = [
  {
      accessorKey: "thumbnailUrl",
      header: "Image",
      cell: ({ row }) => (
          <SafeImage
            src={row.original.thumbnailUrl}
            alt={row.original.name}
            className="w-10 h-10 object-cover rounded"
          />
      )
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
          return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: row.original.currency }).format(Number(row.original.price));
      }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge variant="outline">{status}</Badge>
    }

  },
  {
    accessorKey: "isVerified",
    header: "Verified",
    cell: ({ row }) => {
        return row.original.isVerified ?
            <Badge className="bg-green-500 hover:bg-green-600">Yes</Badge> :
            <Badge variant="destructive">No</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const product = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id)}
            >
              Copy ID
            </DropdownMenuItem>
            {!product.isVerified && (
                 <DropdownMenuItem onClick={() => verifyProduct(product.id, table.options.meta)}>
                    Verify Product
                 </DropdownMenuItem>
            )}
            {/* Add Delete if needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
