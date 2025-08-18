import { useNavigate } from "react-router-dom";
import { Box, Typography } from '@mui/material';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
            <Typography variant="h2" color="error" gutterBottom>Error Loading</Typography>
            <Typography variant="body1">Sorry, this shouldn't happen.</Typography>
            <a
                href="#"
                style={{ display: 'inline-block', marginBottom: '1rem', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                onClick={e => {
                    e.preventDefault();
                    navigate(-1);
                }}
            >
                Go Back
            </a>
        </Box>
    );
}
