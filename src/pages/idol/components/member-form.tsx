import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Member } from "@/types"

const formSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên thành viên"),
  description: z.string().optional(),
})

interface MemberFormProps {
    teamId: string;
    initialData?: Member | null;
    onSubmit: (formData: FormData) => void;
    isLoading: boolean;
}

export function MemberForm({ teamId, initialData, onSubmit, isLoading }: MemberFormProps) {
    const [file, setFile] = useState<File | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                description: initialData.description || "",
            })
        } else {
            form.reset({
                name: "",
                description: "",
            })
        }
        setFile(null);
    }, [initialData, form]);

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        const formData = new FormData();
        formData.append("teamId", teamId);
        formData.append("name", values.name);
        if (values.description) {
            formData.append("description", values.description);
        }
        if (file) {
            formData.append("thumbnail", file);
        }
        onSubmit(formData);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên thành viên *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên thành viên..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Nhập mô tả..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormItem>
                    <FormLabel>Ảnh đại diện (Thumbnail)</FormLabel>
                    <FormControl>
                         <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setFile(e.target.files[0]);
                                }
                            }}
                        />
                    </FormControl>
                    {initialData?.thumbnailUrl && !file && (
                        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                             Đã có ảnh: <img src={initialData.thumbnailUrl} alt="current" className="h-8 w-8 object-cover rounded" />
                        </div>
                    )}
                </FormItem>

                <div className="flex justify-end pt-4">
                     <Button type="submit" disabled={isLoading}>
                         {isLoading ? "Đang lưu..." : "Lưu thành viên"}
                     </Button>
                </div>
            </form>
        </Form>
    )
}
