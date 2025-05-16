// src/pages/_app.tsx
import '../styles/globals.css';
import '@fontsource/roboto';
import '@fontsource/amiri';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import type { AppProps } from 'next/app';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';

function AppContent({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const isAdminRoute = false; // Desactivar la lógica de rutas admin para que siempre muestre el header normal

    return (
        <>
            {!isAdminRoute && <Header />}
            <Component {...pageProps} />
            {!isAdminRoute && <Footer />}
            <Toaster position="top-right" />
        </>
    );
}

export default function App(props: AppProps) {
    return (
        <AuthProvider>
            <AppContent {...props} />
        </AuthProvider>
    );
}
