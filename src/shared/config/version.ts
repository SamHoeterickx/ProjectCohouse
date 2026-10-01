import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Version from package.json, bumped automatically on every push to main
 * (.github/workflows/version.yml). Read at startup: this file lives in dist/shared/config
 * (or src/shared/config in dev), three levels below the project root.
 */
function readVersion() {
    try {
        const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
        return (JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')) as { version: string }).version;
    } catch {
        return 'unknown';
    }
}

export const APP_VERSION = readVersion();
export const STARTED_AT = new Date().toISOString();
