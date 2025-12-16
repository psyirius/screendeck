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

function TinyRouter() {
    const urlParams = new URLSearchParams(window.location.search)
    const page = urlParams.get('page') || ''

    switch (page) {
        case 'settings':
            return themed(<Settings />)
        case 'hotkeyPrompt':
            return themed(<HotkeyPrompt />)
        case 'profilePrompt':
            return themed(<ProfilePrompt />)
        default:
            return <Buttons />
    }
}

// const target = document.getElementById('root')!
const target = document.body;

const root = createRoot(target);

root.render(
    <StrictMode>
        <TinyRouter />
    </StrictMode>
)

export default root;
