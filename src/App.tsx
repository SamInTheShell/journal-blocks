import './App.css';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { Routes, Route, HashRouter } from "react-router-dom";

import NotFoundPage from './components/pages/404';
import ScrollToTop from './components/layout/ScrollToTop';
import WelcomePage from './components/pages/welcome';
import EditorPage from './components/pages/editor';
import { JournalProvider } from './context/JournalContext.tsx';

const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: '#0a0a0a',
            paper: '#1a1a1a',
        },
        primary: {
            main: '#90caf9',
        },
        secondary: {
            main: '#f48fb1',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1a1a1a',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    color: '#b3b3b3',
                    '&.Mui-selected': {
                        color: '#90caf9',
                    },
                },
            },
        },
    },
});

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <JournalProvider>
                <HashRouter>
                    <ScrollToTop />
                    <Routes>
                        <Route path="/" element={<WelcomePage />} />
                        <Route path="/editor" element={<EditorPage />} />

                        {/* Catch-all 404 Route - MUST REMAIN AT BOTTOM */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </HashRouter>
            </JournalProvider>
        </ThemeProvider>
    );
}
