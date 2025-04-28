import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

// Define the AcademicYear type that was missing
type AcademicYear = {
    id: string;
    batch: string;
    description: string;
};

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    academic_year_id: string;
    nis: string; 
};

type RegisterProps = {
    academicYears: AcademicYear[];
};

export default function Register({ academicYears }: RegisterProps) {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        academic_year_id: '',
        nis: '', 
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('student.register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // Fungsi untuk membatasi NIS hingga 10 digit
    const handleNisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Hanya mengambil 10 digit pertama jika lebih dari 10
        const value = e.target.value;
        // Membatasi input hanya angka dan maksimal 10 karakter
        const sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
        setData('nis', sanitizedValue);
    };

    return (
        <AuthLayout title="Daftar sebagai siswa" description="Sebelum menggunakan trisensi, mohon untuk mengisi formulir dibawah berikut">
            <Head title="Register" />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder="Nama Lengkap"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nis">Nomor Induk Siswa (NIS)</Label>
                        <Input
                            id="nis"
                            type="text"
                            required
                            tabIndex={2}
                            value={data.nis}
                            onChange={handleNisChange}
                            maxLength={10}
                            disabled={processing}
                            placeholder="NIS (maksimal 10 digit)"
                        />
                        <p className="text-xs text-muted-foreground">
                            {data.nis.length}/10 digit
                        </p>
                        <InputError message={errors.nis} className="mt-2" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Alamat Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={3}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Kata Sandi</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            disabled={processing}
                            placeholder="Kata Sandi"
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Konfirmasi Kata Sandi"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="academic_year_id">Angkatan</Label>
                        <select
                            id="academic_year_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.academic_year_id}
                            onChange={(e) => setData('academic_year_id', e.target.value)}
                            required
                            tabIndex={6}
                            disabled={processing}
                        >
                            <option value="">Pilih Angkatan</option>
                            {academicYears.map((year) => (
                                <option key={year.id} value={year.id}>
                                    {year.batch} - {year.description}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.academic_year_id} />
                    </div>
                    <Button type="submit" className="mt-2 w-full" tabIndex={7} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                        Buat Akun
                    </Button>
                </div>
                <div className="text-muted-foreground text-center text-sm">
                    Sudah memiliki akun?{' '}
                    <TextLink href={route('student.login')} tabIndex={8}>
                        Silakan masuk
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
