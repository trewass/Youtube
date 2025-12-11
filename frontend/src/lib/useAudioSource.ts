import { useState, useEffect } from 'react'
import { audioStorage } from './audioStorage'
import { Audiobook } from './api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export enum AudioSource {
    CACHED = 'cached',
    STREAM = 'stream',
    UNAVAILABLE = 'unavailable'
}

export interface AudioSourceInfo {
    url: string | null
    source: AudioSource
    isOnline: boolean
    isCached: boolean
}

/**
 * Hook для умного управления источником аудио
 * Логика: Cached > Stream > Unavailable
 */
export function useAudioSource(audiobook: Audiobook | null) {
    const [sourceInfo, setSourceInfo] = useState<AudioSourceInfo>({
        url: null,
        source: AudioSource.UNAVAILABLE,
        isOnline: navigator.onLine,
        isCached: false
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const updateOnlineStatus = () => {
            setSourceInfo(prev => ({ ...prev, isOnline: navigator.onLine }))
        }

        window.addEventListener('online', updateOnlineStatus)
        window.addEventListener('offline', updateOnlineStatus)

        return () => {
            window.removeEventListener('online', updateOnlineStatus)
            window.removeEventListener('offline', updateOnlineStatus)
        }
    }, [])

    useEffect(() => {
        if (!audiobook) {
            setLoading(false)
            return
        }

        loadAudioSource()
    }, [audiobook, sourceInfo.isOnline])

    const loadAudioSource = async () => {
        if (!audiobook) return

        setLoading(true)

        try {
            // 1. Проверяем IndexedDB (приоритет)
            const cached = await audioStorage.hasAudio(audiobook.id)

            if (cached) {
                const blob = await audioStorage.getAudio(audiobook.id)
                if (blob) {
                    const url = URL.createObjectURL(blob)
                    setSourceInfo({
                        url,
                        source: AudioSource.CACHED,
                        isOnline: navigator.onLine,
                        isCached: true
                    })
                    setLoading(false)
                    return
                }
            }

            // 2. Если online - используем stream
            if (navigator.onLine) {
                const streamUrl = `${API_BASE_URL}/api/stream/${audiobook.id}`
                setSourceInfo({
                    url: streamUrl,
                    source: AudioSource.STREAM,
                    isOnline: true,
                    isCached: false
                })
                setLoading(false)
                return
            }

            // 3. Offline без кэша
            setSourceInfo({
                url: null,
                source: AudioSource.UNAVAILABLE,
                isOnline: false,
                isCached: false
            })
        } catch (error) {
            console.error('Error loading audio source:', error)
            setSourceInfo({
                url: null,
                source: AudioSource.UNAVAILABLE,
                isOnline: navigator.onLine,
                isCached: false
            })
        } finally {
            setLoading(false)
        }
    }

    const refresh = () => {
        loadAudioSource()
    }

    return {
        ...sourceInfo,
        loading,
        refresh
    }
}
