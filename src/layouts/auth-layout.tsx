interface AuthLayoutProps {
    children?: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm">
                        {children}
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:block bg-muted">
                <img
                    src="/admin/assets/login-bg.png"
                    alt="Login Background"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4] dark:grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                    <h2 className="text-3xl font-bold text-white mb-2">Lova-Selcard</h2>
                    <p className="text-white/70 max-w-md">
                        Hệ thống quản lý thông tin và thành viên chuyên nghiệp.
                        Chào mừng bạn quay trở lại trang quản trị.
                    </p>
                </div>
            </div>
        </div>
    );
}
