import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext({
    lang: 'ru',
    toggle: () => { }
})

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState('ru')
    const toggle = () => setLang((prev) => (prev === 'ru' ? 'en' : 'ru'))
    return (
        <LanguageContext.Provider value={{ lang, toggle }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLang() {
    return useContext(LanguageContext)
} 