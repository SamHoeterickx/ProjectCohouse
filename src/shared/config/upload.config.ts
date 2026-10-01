import { homedir } from 'os';
import { join, resolve } from 'path';

/** URL prefix under which uploaded files are served. */
export const UPLOADS_ROUTE = '/uploads';

/**
 * Directory for uploaded receipts. Must live outside the app folder: Hostinger deploys every
 * build into a new versions/<id> directory, so files stored next to the code are lost on
 * the next deploy. Defaults to ~/cohouse-uploads, which survives deploys.
 */
export function uploadDir() {
    return resolve(process.env.UPLOAD_DIR || join(homedir(), 'cohouse-uploads'));
}

/** Public base URL of this API, used to build links to uploaded files. */
export function publicApiUrl() {
    return (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, '');
}
