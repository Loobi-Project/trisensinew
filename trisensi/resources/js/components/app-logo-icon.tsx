import { HTMLAttributes } from 'react';
import styles from '../pages/welcome.module.css';

export default function AppLogoIcon(props: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={`flex items-center gap-2 text-[32px] font-bold select-none ${styles.pacifico}`}
            style={{ fontSize: '32px', userSelect: 'none' }}
        >
            <span className={`${styles.gradientText} focus:outline-none`}>TriSenSi</span>
        </div>
    );
}
