import { HTMLAttributes } from 'react';
import styles from '../pages/welcome.module.css';

export default function AppLogoIcon(props: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={`flex items-center gap-2 font-bold ${styles.pacifico}`} style={{ fontSize: '50px' }}>
            <span className={styles.gradientText}>TriSenSi</span>
        </div>
    );
}
