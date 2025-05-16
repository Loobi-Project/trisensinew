import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square items-center justify-center rounded-md text-black dark:text-white">
                <AppLogoIcon className="size-5 fill-current text-black dark:text-white" />
            </div>
        </>
    );
}
