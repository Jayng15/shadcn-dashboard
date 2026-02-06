
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SafeImage } from "@/components/safe-image";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle } from "lucide-react";

export default function UserDetailPage() {
    const { userId } = useParams({ strict: false }) as { userId: string };
    const queryClient = useQueryClient();

    const { isPending, error, data } = useQuery({
        queryKey: ["user", userId],
        queryFn: async () => {
            const res = await api.get(`/user/${userId}`);
            return res.data;
        },
        enabled: !!userId,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            await api.patch(`/user/${userId}/status`, { status });
        },
        onSuccess: (_, status) => {
            toast.success(`User status updated to ${status}`);
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Status update failed");
        }
    });

    if (isPending) return <div className="p-8">Loading user details...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {(error as Error).message}</div>;
    if (!data || !data.user) return <div className="p-8">User not found</div>;

    const { user, profile } = data;
    // Assuming backend serves avatars via a similar mechanism or public URL
    // If not, we might need to adjust. Profile mostly has 'avatar'.

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {profile?.fullName || user.email}
                        <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}>{user.status}</Badge>
                        <Badge variant="outline">{user.role}</Badge>
                         {user.isSeller && <Badge className="bg-blue-500">Seller</Badge>}
                    </h1>
                    <p className="text-muted-foreground text-sm">User ID: {user.id}</p>
                </div>
                <div className="flex gap-2">
                    {user.status === 'ACTIVE' && (
                         <Button
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate('BAN')}
                            disabled={updateStatusMutation.isPending}
                        >
                            <Ban className="mr-2 h-4 w-4" /> Ban User
                        </Button>
                    )}
                     {user.status === 'BAN' && (
                         <Button
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate('ACTIVE')}
                            disabled={updateStatusMutation.isPending}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Activate User
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Email</h3>
                                <p>{user.email}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Full Name</h3>
                                <p>{profile?.fullName || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Phone</h3>
                                <p>{profile?.phone || 'N/A'}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Joined</h3>
                                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                         </div>
                    </CardContent>
                </Card>

                {/* Avatar / Identity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Identity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        {profile?.avatar ? (
                             <SafeImage
                                src={profile.avatar} // Assuming this is a full URL or handled by SafeImage if it matches pattern
                                alt="User Avatar"
                                className="w-32 h-32 rounded-full object-cover border mb-4"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                                No Avatar
                            </div>
                        )}
                        <div className="text-center w-full">
                            <h3 className="font-semibold">Bio</h3>
                            <p className="text-sm text-muted-foreground mt-2">{profile?.bio || 'No bio provided'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
