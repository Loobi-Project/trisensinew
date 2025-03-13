import { useEffect } from "react";

interface AlertProps {
    type: "success" | "warning" | "userError" | "systemError";
    message: string;
    onClose: () => void;
}

const CustomAlert: React.FC<AlertProps> = ({ type, message, onClose }) => {
    const colors: Record<string, string> = {
        success: "bg-green-500",
        warning: "bg-orange-400",
        userError: "bg-red-500",
        systemError: "bg-purple-500",
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Alert hilang setelah 3 detik

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50">
            <div className="relative flex items-center px-4 py-3 bg-white shadow-lg rounded-lg">
                <div className={`absolute left-0 w-8 h-full ${colors[type]} rounded-l-full`}></div>
                <p className="ml-10 text-gray-700">{message}</p>
            </div>
        </div>
    );
};

export default CustomAlert;
