import { useState } from "react";
import { router } from "@inertiajs/react";
import { LoaderCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import InputError from "@/components/input-error";
import AuthLayout from "@/layouts/auth-layout";

const SuperAdminLogin = () => {
    const [adminCode, setAdminCode] = useState("");
    const [errors, setErrors] = useState<{ admin_code?: string }>({});
    const [processing, setProcessing] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(
            "/superadmin/login",
            { admin_code: adminCode },
            {
                onError: (err) => setErrors(err),
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <AuthLayout title="Super Admin Login" description="Enter your admin code to access the dashboard">
            <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="admin_code">Admin Code</Label>
                        <Input
                            id="admin_code"
                            type="text"
                            required
                            autoFocus
                            autoComplete="off"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            placeholder="Enter admin code"
                        />
                        <InputError message={errors.admin_code} />
                    </div>

                    <Button type="submit" className="mt-4 w-full" disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Masuk
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
};

export default SuperAdminLogin;
