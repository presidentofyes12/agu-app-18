import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useLocation, useNavigate } from '@reach/router';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useTranslation from 'hooks/use-translation';
import useMediaBreakPoint from 'hooks/use-media-break-point';
import usePopover from 'hooks/use-popover';
import useModal from 'hooks/use-modal';
import PrivRequester from 'views/components/app-wrapper/priv-requester';
import { backupWarnAtom } from 'atoms';
import Alert from 'svg/alert';

// New imports for font size control
import { atom } from 'jotai';
import { Typography, Slider, IconButton } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Create a persistent font size atom
export const fontSizeAtom = atom(
  // Get initial value from localStorage or default to 100
  typeof window !== 'undefined' 
    ? Number(localStorage.getItem('preferredFontSize')) || 100 
    : 100
);

interface AppWrapperProps {
    children: React.ReactNode;
}

const FontSizeControl = () => {
    const theme = useTheme();
    const { isSm } = useMediaBreakPoint();
    const [t] = useTranslation();
    const [fontSize, setFontSize] = useAtom(fontSizeAtom);

    useEffect(() => {
        // Update root font size and save to localStorage
        document.documentElement.style.fontSize = `${fontSize}%`;
        localStorage.setItem('preferredFontSize', fontSize.toString());
    }, [fontSize]);

    const adjustSize = (amount: number) => {
        setFontSize((prev) => Math.min(Math.max(prev + amount, 50), 200));
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: theme.spacing(2),
                right: theme.spacing(2),
                zIndex: theme.zIndex.drawer + 1,
                backgroundColor: theme.palette.background.paper,
                padding: theme.spacing(1.5),
                borderRadius: theme.shape.borderRadius,
                boxShadow: theme.shadows[3],
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: isSm ? '90%' : 'auto',
                maxWidth: '300px',
            }}
        >
            <IconButton
                size="small"
                onClick={() => adjustSize(-10)}
                sx={{ bgcolor: 'action.hover' }}
                aria-label={t('Decrease font size')}
            >
                <RemoveIcon />
            </IconButton>

            <Slider
                value={fontSize}
                onChange={(_, value) => setFontSize(Array.isArray(value) ? value[0] : value)}
                min={50}
                max={200}
                step={5}
                aria-label={t('Font size')}
                sx={{ mx: 2 }}
            />

            <IconButton
                size="small"
                onClick={() => adjustSize(10)}
                sx={{ bgcolor: 'action.hover' }}
                aria-label={t('Increase font size')}
            >
                <AddIcon />
            </IconButton>

            <Typography 
                variant="caption" 
                sx={{ 
                    minWidth: '3em',
                    textAlign: 'right'
                }}
            >
                {fontSize}%
            </Typography>

            <IconButton
                size="small"
                onClick={() => setFontSize(100)}
                sx={{ bgcolor: 'action.hover' }}
                aria-label={t('Reset font size')}
            >
                <RefreshIcon />
            </IconButton>
        </Box>
    );
};

const AppWrapper: React.FC<AppWrapperProps> = (props) => {
    const theme = useTheme();
    const { isSm } = useMediaBreakPoint();
    const [t] = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [backupWarn, setBackupWarn] = useAtom(backupWarnAtom);
    const [, setPopover] = usePopover();
    const [, setModal] = useModal();

    useEffect(() => {
        setPopover(null);
        setModal(null);
    }, [location.pathname]);

    const warnHeight = isSm ? '36px' : '50px';

    return (
        <>
            {backupWarn && (
                <Box
                    sx={{
                        width: '100%',
                        height: warnHeight,
                        background: theme.palette.warning.main,
                        color: '#000',
                        fontSize: '0.9em',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            navigate('/settings/keys').then();
                            setBackupWarn(false);
                        }}
                    >
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: '10px',
                                ml: isSm ? null : '10px',
                            }}
                        >
                            <Alert height={18} />
                        </Box>
                        {t('Please take a moment to save a copy of your private key and Mnemonic Seed Phrase.')}
                    </Box>
                </Box>
            )}
            <Box
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    height: backupWarn ? `calc(100% - ${warnHeight})` : '100%',
                    overflow: 'hidden',
                    display: 'flex',
                }}
            >
                {props.children}
            </Box>
            <FontSizeControl />
            <PrivRequester />
        </>
    );
};

export default AppWrapper;
