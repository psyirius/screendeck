import './styles/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Buttons from './Buttons'
import Settings from './Settings'
import ProfilePrompt from './ProfilePrompt'
import HotkeyPrompt from './HotkeyPrompt'

function Router() {
    const urlParams = new URLSearchParams(window.location.search)
    const page = urlParams.get('page') || '';

    if (page.endsWith('settings')) {
        return <Settings />
    } else if (page.endsWith('hotkeyPrompt')) {
        return <HotkeyPrompt />
    } else if (page.endsWith('profilePrompt')) {
        return <ProfilePrompt />
    } else {
        return <Buttons />
    }
}

// const target = document.getElementById('root')!
const target = document.body;

createRoot(target).render(
    <StrictMode>
        <Router />
    </StrictMode>
)
