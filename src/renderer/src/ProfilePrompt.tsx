// @ts-nocheck
import React, { useCallback, useEffect } from 'react'
import { getAPIClient } from '@/api/client'

const api = getAPIClient()

function injectCSS() {
    if (injectCSS.injected) return;

    const styles = `
body {
    font-family: sans-serif;
    margin: 20px;
}
input {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    font-size: 16px;
}
button {
    padding: 8px 16px;
    margin-right: 8px;
}
    `
    const styleSheet = document.createElement('style')
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    injectCSS.injected = true;
}

function ProfilePrompt() {
    injectCSS();

    const profileNameRef = React.useRef(null);

    useEffect(() => {
        api.getNextProfileName().then((value) => {
            profileNameRef.current!.value = value
            profileNameRef.current!.focus()
        })
    }, []);

    const submit = useCallback(() => {
        const name = profileNameRef.current!.value
        api.sendProfileName(name)
    }, []);

    const cancel = useCallback(() => {
        api.sendProfileName(null)
    }, []);

    return (
        <>
            <h2>Save Profile</h2>
            <input
                ref={profileNameRef}
                type="text"
                placeholder="Profile Name"
            />
            <div>
                <button onClick={submit}>OK</button>
                <button onClick={cancel}>Cancel</button>
            </div>
        </>
    )
}

export default ProfilePrompt
