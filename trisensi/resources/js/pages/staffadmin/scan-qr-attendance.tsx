import React, { useState, useRef, useEffect } from 'react';
import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
    {
        title: 'QR Presensi',
        href: '/staffadmin/scan-qr-attendance',
    }
];

export default function ScanQrAttendancePage() {
    const [isScanning, setIsScanning] = useState(false);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // idle, success, error, loading
    const [lastScanned, setLastScanned] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Load jsQR library
    useEffect(() => {
        const loadJsQR = async () => {
            if (!window.jsQR) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
                script.async = true;
                document.body.appendChild(script);
            }
        };
        
        loadJsQR();
        
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        setStatus('loading');
        setMessage('Memuat kamera...');
        setIsScanning(true);
        
        try {
            // Try to access camera
            let stream;
            try {
                // First try back camera
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });
            } catch (backCameraError) {
                console.warn("Back camera access failed, trying front camera", backCameraError);
                
                try {
                    // Try front camera as fallback
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "user" }
                    });
                } catch (frontCameraError) {
                    throw new Error("Tidak dapat mengakses kamera. Periksa izin browser.");
                }
            }
            
            streamRef.current = stream;
            
            // Connect stream to video element
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                
                // Start scanning
                startScanInterval();
                setStatus('idle');
                setMessage('');
            }
        } catch (error) {
            console.error('Error starting scanner:', error);
            setStatus('error');
            setMessage(error.message || 'Gagal membuka kamera');
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        // Clear scan interval
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Reset video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsScanning(false);
    };

    const startScanInterval = () => {
        // Clear any existing interval
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
        
        // Process frame every 200ms (5 times per second)
        scanIntervalRef.current = setInterval(processVideoFrame, 200);
    };

    const processVideoFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas || video.paused || video.ended) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data for QR processing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process with jsQR
        if (window.jsQR) {
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code && code.data) {
                handleQrResult(code.data);
            }
        }
    };

    const playSound = (type) => {
        const sounds = {
            success: '/sounds/new-notification-on-your-device-138695.mp3',
            error: '/sounds/error-5-199276.mp3'
        };
        
        if (sounds[type]) {
            const audio = new Audio(sounds[type]);
            audio.play().catch(e => console.log(`Could not play ${type} sound`, e));
        }
    };
    
    const handleQrResult = (decodedText) => {
        try {
            // Temporarily pause scanning
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
           
            let data;
            try {
                data = JSON.parse(decodedText);
            } catch (e) {
                // If not valid JSON, check if it's just a number
                if (!isNaN(Number(decodedText))) {
                    data = { presence_id: Number(decodedText) };
                } else {
                    throw e;
                }
            }
            if (data.presence_id) {
                playSound('success');
                processAttendance(data.presence_id);
            } else {
                playSound('error');
                setStatus('error');
                setMessage('QR code tidak valid: Format tidak sesuai');
                console.error('Invalid QR data format:', data);
               
                // Resume scanning after delay
                setTimeout(() => {
                    startScanInterval();
                }, 2000);
            }
        } catch (error) {
            playSound('error');
            setStatus('error');
            setMessage('Format QR tidak valid');
            console.error('QR parsing error:', error, 'Raw text:', decodedText);
           
            // Resume scanning after delay
            setTimeout(() => {
                startScanInterval();
            }, 2000);
        }
    };

    const processAttendance = (presenceId) => {
        setStatus('loading');
        setMessage('Memproses data kehadiran...');
        
        // Use axios to call the backend API
        axios.post('/staffadmin/process-qr-attendance', { 
            presence_id: presenceId
        })
        .then(response => {
            const data = response.data;
            if (data.success) {
                // Extract student name from message if available
                const message = data.message || '';
                const studentName = message.split(' ')[0] || `Siswa ${presenceId}`;
                const timestamp = new Date().toLocaleTimeString('id-ID');
                
                setLastScanned({
                    name: studentName,
                    status: 'Hadir',
                    timestamp: timestamp
                });
                
                setStatus('success');
                setMessage(data.message || 'Presensi berhasil dicatat');
            } else {
                throw new Error(data.message || 'Terjadi kesalahan');
            }
            
            // Resume scanning after a short delay
            setTimeout(() => {
                setMessage('');
                startScanInterval();
            }, 3000);
        })
        .catch(error => {
            setStatus('error');
            setMessage(error.response?.data?.message || error.message || 'Terjadi kesalahan');
            
            // Resume scanning after a short delay
            setTimeout(() => {
                setMessage('');
                startScanInterval();
            }, 3000);
        });
    };

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Scan QR Presensi - Tata Usaha" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border bg-white dark:bg-gray-900 p-6 text-gray-800 dark:text-white md:min-h-min">
                        <h2 className="text-xl font-bold mb-4">Scan QR Presensi Siswa</h2>
                        
                        <div className="max-w-md mx-auto">
                            <div className="w-full relative bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-blue-500 overflow-hidden" style={{ height: '350px' }}>
                                {isScanning ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                            playsInline
                                        />
                                       
                                        {/* Scanning animation - Updated to fit the scanning area better */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="relative h-64 w-64 rounded-lg border-4 border-blue-500 border-opacity-60">
                                                {/* Horizontal scanning line */}
                                                <div 
                                                    className="absolute h-1 bg-blue-500 w-full left-0"
                                                    style={{
                                                        top: '50%',
                                                        animation: 'scan-horizontal 2s infinite ease-in-out',
                                                        WebkitAnimation: 'scan-horizontal 2s infinite ease-in-out'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="mx-auto w-16 h-16 mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400 dark:text-gray-500">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-2 0h-2m-4-8v1m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400">Klik tombol di bawah untuk memulai pemindaian</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Canvas for processing (hidden) */}
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                            </div>
                            
                            {/* Status messages */}
                            {message && (
                                <div className={`w-full mt-4 p-3 rounded-lg text-center ${
                                    status === 'error' ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700' : 
                                    status === 'success' ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700' :
                                    status === 'loading' ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' :
                                    'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
                                }`}>
                                    {status === 'loading' && (
                                        <div className="flex items-center justify-center">
                                            <div className="mr-2 w-4 h-4 border-2 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>{message}</span>
                                        </div>
                                    )}
                                    {status !== 'loading' && message}
                                </div>
                            )}
                            
                            {/* Action button */}
                            <div className="mt-4 flex justify-center">
                                {isScanning ? (
                                    <button
                                        onClick={stopScanner}
                                        className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        Berhenti Memindai
                                    </button>
                                ) : (
                                    <button
                                        onClick={startScanner}
                                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Mulai Pemindaian
                                    </button>
                                )}
                            </div>
                            
                            {/* Last scanned result */}
                            {lastScanned && (
                                <div className="w-full mt-6 p-4 bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-700 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Hasil Pemindaian Terakhir</h3>
                                    <div className="space-y-2">
                                        <div className="flex">
                                            <span className="font-medium w-20">Nama:</span>
                                            <span>{lastScanned.name}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium w-20">Status:</span>
                                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm rounded-full">
                                                {lastScanned.status}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium w-20">Waktu:</span>
                                            <span>{lastScanned.timestamp}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Compatibility notice */}
                            <div className="w-full mt-6 p-3 bg-blue-100 border border-blue-200 dark:bg-blue-900/40 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium">Catatan Kompatibilitas:</p>
                                <p>Untuk hasil terbaik, gunakan Browser versi terbaru di perangkat Android atau iOS dengan protokol HTTPS.</p>
                            </div>
                            
                            {/* Link to attendance records */}
                            <div className="mt-4 text-center">
                                <a 
                                    href="/staffadmin/attendance-records" 
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                    Lihat Rekam Kehadiran
                                </a>
                            </div>
                        </div>
                        
                        <style jsx>{`
                            @keyframes scan-horizontal {
                                0% { transform: translateY(-3000%); }
                                50% { transform: translateY(3000%); }
                                100% { transform: translateY(-3000%); }
                            }
                            @-webkit-keyframes scan-horizontal {
                                0% { -webkit-transform: translateY(-3000%); }
                                50% { -webkit-transform: translateY(3000%); }
                                100% { -webkit-transform: translateY(-3000%); }
                            }
                        `}</style>
                    </div>
                </main>
            </div>
        </AppLayoutStaffAdmin>
    );
}
