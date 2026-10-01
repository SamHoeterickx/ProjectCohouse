import { join } from 'path';
import { FileUploadService } from './file-upload.service.js';

describe('FileUploadService.resolveStoredFile', () => {
    const service = new FileUploadService();
    const name = '3f2b8c1e-9a4d-4c7b-8e2f-1a2b3c4d5e6f.jpg';

    beforeAll(() => {
        process.env.UPLOAD_DIR = '/tmp/cohouse-test-uploads';
    });

    it('maps an upload URL to the file on disk', () => {
        expect(service.resolveStoredFile(`https://api.example.com/uploads/${name}`))
            .toBe(join('/tmp/cohouse-test-uploads', name));
    });

    it('rejects path traversal, other routes and unknown names', () => {
        expect(service.resolveStoredFile('https://api.example.com/uploads/../../etc/passwd')).toBeNull();
        expect(service.resolveStoredFile(`https://api.example.com/other/${name}`)).toBeNull();
        expect(service.resolveStoredFile('https://api.example.com/uploads/receipt.jpg')).toBeNull();
        expect(service.resolveStoredFile('not a url')).toBeNull();
    });
});
