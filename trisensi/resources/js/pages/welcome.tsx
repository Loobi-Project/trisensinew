import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import styles from './welcome.module.css';

export default function Welcome() {
    const [isTransitioning, setIsTransitioning] = useState(false);

    const smoothScrollTo = (targetId) => {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;

        let startTime = null;
        const duration = 1000; // Durasi scroll dalam milidetik

        // Fungsi easing dengan tempo lambat-cepat-lambat
        const easeInOutQuart = (t) => {
            return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
        };

        const animateScroll = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easing = easeInOutQuart(progress);

            window.scrollTo(0, startPosition + distance * easing);

            if (timeElapsed < duration) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    };

    const handleNavigation = (e, href) => {
        e.preventDefault();

        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            smoothScrollTo(targetId);
        } else {
            setIsTransitioning(true);
            setTimeout(() => {
                window.location.href = href;
            }, 500);
        }
    };

    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center">
            {/* Efek transisi blur */}
            <div className={`${styles.pageTransition} ${isTransitioning ? 'active' : ''}`} />
            <Head title="Selamat Datang" />
            <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-16">
                    <div className={`flex items-center gap-2 font-bold ${styles.pacifico}`} style={{ fontSize: '30px' }}>
                        <span className={styles.gradientText}>TriSenSi</span>
                    </div>

                    <nav className="hidden items-center gap-6 xl:flex">
                        <Link
                            href="#home"
                            onClick={(e) => handleNavigation(e, '#home')}
                            className="hover:text-primary text-sm font-medium transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="#about"
                            onClick={(e) => handleNavigation(e, '#about')}
                            className="hover:text-primary text-sm font-medium transition-colors"
                        >
                            About Trisensi
                        </Link>
                        <Link
                            href="#how-to-use"
                            onClick={(e) => handleNavigation(e, '#how-to-use')}
                            className="hover:text-primary text-sm font-medium transition-colors"
                        >
                            Cara Penggunaan
                        </Link>
                        <Link
                            href={route('staff-role')}
                            onClick={(e) => handleNavigation(e, route('staff-role'))}
                            className="bg-primary/30 text-primary hover:bg-primary/90 hover:text-primary-foreground focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-all duration-500 focus-visible:ring-1 focus-visible:outline-none"
                        >
                            Pegawai
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link
                            href={route('student.login')}
                            onClick={(e) => handleNavigation(e, route('student.login'))}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow focus-visible:ring-1 focus-visible:outline-none"
                        >
                            Siswa
                        </Link>
                        <MobileNav smoothScrollTo={smoothScrollTo} />
                    </div>
                </div>
            </header>
            <main>
                <section id="home" className="container mx-auto px-4 py-24 md:py-32 lg:px-16">
                    <div className="grid items-center gap-10 md:grid-cols-2">
                        <div className="space-y-6">
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                                Selamat Datang Siswa dan Siswi SMA Negeri 3 Purwokerto
                            </h1>
                            <p className="text-muted-foreground md:text-xl">
                                Trisensi merupakan singkatan dari <span className="font-semibold">Tiga Presensi</span>, yang terinspirasi dari SMAN 3
                                Purwokerto. Sistem ini dirancang untuk menghadirkan solusi presensi berbasis QR yang akurat, efisien, dan real-time.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="#how-to-use"
                                    onClick={(e) => handleNavigation(e, '#how-to-use')}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                >
                                    Mulai
                                </Link>
                                <Link
                                    href="#about"
                                    onClick={(e) => handleNavigation(e, '#about')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md border px-8 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                >
                                    Pelajari Selanjutnya
                                </Link>
                            </div>
                        </div>
                        <div className="bg-muted aspect-video overflow-hidden rounded-xl">
                            <img
                                src="/images/ed-us-_y4FqRhxkR8-unsplash.jpg"
                                alt="Trisensi Platform Preview"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </section>

                <section id="about" className="bg-muted/50 py-24">
                    <div className="container mx-auto space-y-12 px-4 lg:px-16">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Tentang Kami</h2>
                            <p className="text-muted-foreground mx-auto max-w-[700px] md:text-xl">
                                Terima kasih kepada SMA Negeri 3 Purwokerto yang telah mempercayakan Trisensi sebagai solusi presensi siswa yang lebih
                                modern dan efisien.
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            <div className="bg-card rounded-lg border p-6 shadow-sm">
                                <h3 className="mb-2 text-xl font-bold">Solusi Praktis</h3>
                                <p className="text-muted-foreground">
                                    Presensi kini lebih mudah dipantau tanpa hambatan. Trisensi menawarkan kemudahan akses di berbagai perangkat tanpa
                                    perlu instalasi tambahan.
                                </p>
                            </div>
                            <div className="bg-card rounded-lg border p-6 shadow-sm">
                                <h3 className="mb-2 text-xl font-bold">Berorientasi Masa Depan</h3>
                                <p className="text-muted-foreground">
                                    Setiap fitur dirancang untuk keberlanjutan dan kemudahan dalam pengelolaan presensi, memastikan sistem yang lebih
                                    rapi dan efisien bagi semua pihak.
                                </p>
                            </div>
                            <div className="bg-card rounded-lg border p-6 shadow-sm">
                                <h3 className="mb-2 text-xl font-bold">Akses Cepat & Andal</h3>
                                <p className="text-muted-foreground">
                                    Dengan sistem yang responsif dan stabil, Trisensi memberikan pengalaman penggunaan yang lancar dan dapat
                                    diandalkan kapan saja.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="how-to-use" className="container mx-auto px-4 py-24 md:py-32 lg:px-16">
                    <div className="space-y-12">
                        <div className="space-y-4 text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Mulai dengan Hal Baru</h2>
                            <p className="text-muted-foreground mx-auto max-w-[700px] md:text-xl">
                                Ikuti langkah-langkah sederhana untuk mulai menggunakan Trisensi dengan mudah.
                            </p>
                        </div>

                        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col items-center space-y-3 text-center">
                                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full">1</div>
                                <h3 className="text-xl font-bold">Buat Akun</h3>
                                <p className="text-muted-foreground">
                                    Akun Tata Usaha dapat dibuat melalui <span className="text-primary cursor-pointer underline">Super Admin</span>.
                                    Akun Guru bisa dibuat dengan menghubungi <span className="text-primary cursor-pointer underline">Tata Usaha</span>
                                    . Sementara itu, siswa bisa mendaftar sendiri melalui halaman login.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-3 text-center">
                                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full">2</div>
                                <h3 className="text-xl font-bold">Konfirmasi Akun</h3>
                                <p className="text-muted-foreground">
                                    Untuk siswa yang telah mendaftar, akun akan melalui proses verifikasi oleh Tata Usaha sebelum bisa digunakan di
                                    Trisensi.
                                </p>
                            </div>
                            <div className="flex flex-col items-center space-y-3 text-center">
                                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full">3</div>
                                <h3 className="text-xl font-bold">Mulai Menggunakan</h3>
                                <p className="text-muted-foreground">
                                    Setelah akun aktif, Anda bisa langsung menggunakan Trisensi untuk keperluan presensi dengan akses yang cepat dan
                                    mudah.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Link
                                href={route('student.login')}
                                onClick={(e) => handleNavigation(e, route('student.login'))}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none"
                            >
                                Mulai Sekarang
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-muted/50 w-full border-t">
                <div className="mx-auto max-w-screen-lg px-4 py-8 text-center md:px-8 md:py-12 md:text-left">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className={`flex items-center gap-2 font-bold ${styles.pacifico}`} style={{ fontSize: '32px' }}>
                            <span className={styles.gradientText}>TriSenSi</span>
                            <img src="/images/sman3pwt.png" alt="SMAN 3 Purwokerto Logo" className="h-12 w-auto object-contain md:h-16" />
                        </div>
                        <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Trisensi. Semua hak dilindungi undang-undang.</p>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-foreground">
                                Terms
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground">
                                Privacy
                            </Link>
                            <Link href="#" className="text-muted-foreground hover:text-foreground">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function MobileNav({ smoothScrollTo }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleMobileNavigation = (e, href) => {
        e.preventDefault();
        setIsOpen(false);

        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            smoothScrollTo(targetId);
        } else {
            window.location.href = href;
        }
    };

    return (
        <div className="relative xl:hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="hover:bg-muted/10 dark:hover:bg-muted/80 inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition-all duration-300 hover:backdrop-blur-sm dark:text-gray-300"
            >
                {isOpen ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 rotate-180 transition-all duration-300"
                    >
                        <line x1="18" x2="6" y1="6" y2="18" />
                        <line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 transition-all duration-300"
                    >
                        <line x1="4" x2="20" y1="12" y2="12" />
                        <line x1="4" x2="20" y1="6" y2="6" />
                        <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                )}
                <span className="sr-only">Toggle menu</span>
            </button>

            <div
                className={`bg-muted/80 absolute right-2 z-50 mt-7 w-48 rounded-md py-2 shadow-lg backdrop-blur-sm transition-all duration-300 ${
                    isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                }`}
            >
                <Link
                    href="#home"
                    onClick={(e) => handleMobileNavigation(e, '#home')}
                    className="text-muted-foreground hover:bg-muted/90 block px-4 py-2 text-sm font-medium transition-colors hover:rounded-md hover:text-white"
                >
                    Home
                </Link>
                <Link
                    href="#about"
                    onClick={(e) => handleMobileNavigation(e, '#about')}
                    className="text-muted-foreground hover:bg-muted/90 block px-4 py-2 text-sm font-medium transition-colors hover:rounded-md hover:text-white"
                >
                    About Trisensi
                </Link>
                <Link
                    href="#how-to-use"
                    onClick={(e) => handleMobileNavigation(e, '#how-to-use')}
                    className="text-muted-foreground hover:bg-muted/90 block px-4 py-2 text-sm font-medium transition-colors hover:rounded-md hover:text-white"
                >
                    How to Use
                </Link>

                {/* Tombol "Masuk Sebagai Pegawai" hanya muncul di Mobile */}
                <Link
                    href={route('staff-role')}
                    onClick={(e) => handleMobileNavigation(e, route('staff-role'))}
                    className="bg-primary/30 text-primary hover:bg-primary/90 hover:text-primary-foreground focus-visible:ring-ring block w-full rounded-md px-4 py-2 text-center text-sm font-medium shadow transition-all duration-500 focus-visible:ring-1 focus-visible:outline-none xl:hidden"
                >
                    Pegawai
                </Link>
            </div>
        </div>
    );
}
