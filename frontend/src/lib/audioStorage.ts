/**
 * IndexedDB Audio Storage
 * Хранение аудиофайлов для offline прослушивания
 */

const DB_NAME = 'audiobook-library'
const DB_VERSION = 1
const STORE_NAME = 'audio'

interface AudioRecord {
    id: number
    blob: Blob
    timestamp: number
    size: number
    title: string
}

class AudioStorage {
    private db: IDBDatabase | null = null

    /**
     * Инициализация базы данных
     */
    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result

                // Создаём object store если его нет
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                    store.createIndex('timestamp', 'timestamp', { unique: false })
                }
            }
        })
    }

    /**
     * Получить доступ к хранилищу
     */
    private async getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
        if (!this.db) {
            await this.init()
        }
        const transaction = this.db!.transaction(STORE_NAME, mode)
        return transaction.objectStore(STORE_NAME)
    }

    /**
     * Сохранить аудиофайл
     */
    async saveAudio(
        id: number,
        blob: Blob,
        title: string
    ): Promise<void> {
        const store = await this.getStore('readwrite')
        const record: AudioRecord = {
            id,
            blob,
            timestamp: Date.now(),
            size: blob.size,
            title
        }

        return new Promise((resolve, reject) => {
            const request = store.put(record)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    }

    /**
     * Получить аудиофайл
     */
    async getAudio(id: number): Promise<Blob | null> {
        const store = await this.getStore('readonly')

        return new Promise((resolve, reject) => {
            const request = store.get(id)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                const record = request.result as AudioRecord | undefined
                resolve(record?.blob || null)
            }
        })
    }

    /**
     * Проверить наличие файла
     */
    async hasAudio(id: number): Promise<boolean> {
        const store = await this.getStore('readonly')

        return new Promise((resolve, reject) => {
            const request = store.get(id)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                resolve(!!request.result)
            }
        })
    }

    /**
     * Удалить аудиофайл
     */
    async deleteAudio(id: number): Promise<void> {
        const store = await this.getStore('readwrite')

        return new Promise((resolve, reject) => {
            const request = store.delete(id)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    }

    /**
     * Получить все скачанные ID
     */
    async getAllDownloaded(): Promise<number[]> {
        const store = await this.getStore('readonly')

        return new Promise((resolve, reject) => {
            const request = store.getAllKeys()
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                resolve(request.result as number[])
            }
        })
    }

    /**
     * Получить информацию о хранилище
     */
    async getStorageInfo(): Promise<{
        count: number
        totalSize: number
        files: Array<{ id: number; title: string; size: number; timestamp: number }>
    }> {
        const store = await this.getStore('readonly')

        return new Promise((resolve, reject) => {
            const request = store.getAll()
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                const records = request.result as AudioRecord[]
                const totalSize = records.reduce((sum, r) => sum + r.size, 0)
                const files = records.map(r => ({
                    id: r.id,
                    title: r.title,
                    size: r.size,
                    timestamp: r.timestamp
                }))

                resolve({
                    count: records.length,
                    totalSize,
                    files
                })
            }
        })
    }

    /**
     * Очистить всё хранилище
     */
    async clearAll(): Promise<void> {
        const store = await this.getStore('readwrite')

        return new Promise((resolve, reject) => {
            const request = store.clear()
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    }

    /**
     * Скачать аудио с URL и сохранить
     */
    async downloadAndSave(
        id: number,
        url: string,
        title: string,
        onProgress?: (progress: number) => void
    ): Promise<void> {
        try {
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const contentLength = response.headers.get('content-length')
            const total = contentLength ? parseInt(contentLength, 10) : 0

            if (!response.body) {
                throw new Error('Response body is null')
            }

            const reader = response.body.getReader()
            const chunks: BlobPart[] = []
            let loaded = 0

            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                chunks.push(value)
                loaded += value.length

                if (onProgress && total > 0) {
                    onProgress((loaded / total) * 100)
                }
            }

            // Создаём blob из chunks
            const blob = new Blob(chunks, { type: 'audio/mpeg' })

            // Сохраняем в IndexedDB
            await this.saveAudio(id, blob, title)
        } catch (error) {
            console.error('Download error:', error)
            throw error
        }
    }
}

// Singleton instance
export const audioStorage = new AudioStorage()

// Инициализируем при импорте
audioStorage.init().catch(console.error)
