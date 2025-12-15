import '@/styles/main.css'

import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Buttons from './Buttons'
import Settings from './Settings'
import ProfilePrompt from './ProfilePrompt'
import HotkeyPrompt from './HotkeyPrompt'

function themed(children: React.ReactNode) {
    return children; // later we can add theme providers here
}

function Router() {
    const urlParams = new URLSearchParams(window.location.search)
    const page = urlParams.get('page') || '';

    if (page.endsWith('settings')) {
        return themed(<Settings />)
    } else if (page.endsWith('hotkeyPrompt')) {
        return themed(<HotkeyPrompt />)
    } else if (page.endsWith('profilePrompt')) {
        return themed(<ProfilePrompt />)
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
