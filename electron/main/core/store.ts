import { promises as fs } from 'fs';
import { dirname } from 'path';

/**
 * Abstract Store definition for arbitrary key-value persistence.
 */
export abstract class Store {
    abstract get<T>(key: string): Promise<T | undefined>;
    abstract set<T>(key: string, value: T): Promise<void>;
    abstract delete(key: string): Promise<void>;
}

/**
 * A simple file-based store implementation using JSON.
 * Node.js compatible (fs/promises).
 */
export class FileStore extends Store {
    private filePath: string;
    private cache: Record<string, any> = {};
    private loaded = false;

    constructor(filePath: string) {
        super();
        this.filePath = filePath;
    }

    private async ensureLoaded(): Promise<void> {
        if (this.loaded) return;

        try {
            await fs.access(this.filePath);
            const content = await fs.readFile(this.filePath, 'utf-8');
            this.cache = JSON.parse(content);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                console.error(`FileStore: Failed to load from ${this.filePath}`, error);
            }
            // If file doesn't exist or error, start empty
            this.cache = {};
        }
        this.loaded = true;
    }

    private async save(): Promise<void> {
        try {
            const dir = dirname(this.filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
        } catch (error) {
            console.error(`FileStore: Failed to save to ${this.filePath}`, error);
            throw error;
        }
    }

    async get<T>(key: string): Promise<T | undefined> {
        await this.ensureLoaded();
        return this.cache[key] as T;
    }

    async set<T>(key: string, value: T): Promise<void> {
        await this.ensureLoaded();
        this.cache[key] = value;
        await this.save();
    }

    async delete(key: string): Promise<void> {
        await this.ensureLoaded();
        delete this.cache[key];
        await this.save();
    }
}
