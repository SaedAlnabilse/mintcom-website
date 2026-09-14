import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportSections } from './export';
import { api } from '../config/api';

vi.mock('../config/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('PDF export error handling and download', () => {
  let downloaded: Blob | null = null;
  let downloadedName: string | null = null;
  let originalCreate: typeof URL.createObjectURL;
  let originalRevoke: typeof URL.revokeObjectURL;

  beforeEach(() => {
    downloaded = null;
    downloadedName = null;
    originalCreate = URL.createObjectURL;
    originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      downloaded = blob;
      return 'blob:mock';
    }) as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedName = this.download;
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  it('triggers PDF download when API succeeds', async () => {
    const mockPdfBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockPdfBlob });

    await exportSections('pdf', {
      filename: 'sales_report',
      title: 'Sales Report',
      sections: [
        {
          name: 'Sales',
          columns: [{ key: 'item', label: 'Item' }],
          rows: [{ item: 'Coffee' }],
        },
      ],
    });

    expect(api.post).toHaveBeenCalledWith(
      '/api/reports/export-pdf',
      expect.objectContaining({
        title: 'Sales Report',
        filename: 'sales_report',
      }),
      { responseType: 'blob' },
    );
    expect(downloaded).not.toBeNull();
    expect(downloadedName).toMatch(/^sales_report_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('surfaces parsed message from Blob error response when API fails with JSON blob', async () => {
    const errorJson = JSON.stringify({ message: 'Rate limit exceeded for PDF export' });
    const errorBlob = new Blob([errorJson], { type: 'application/json' });
    const axiosError = {
      response: {
        status: 429,
        data: errorBlob,
      },
    };
    vi.mocked(api.post).mockRejectedValueOnce(axiosError);

    await expect(
      exportSections('pdf', {
        title: 'Test Report',
        sections: [
          {
            name: 'Test',
            columns: [{ key: 'col', label: 'Col' }],
            rows: [],
          },
        ],
      }),
    ).rejects.toThrow('Rate limit exceeded for PDF export');
  });

  it('surfaces joined messages when Blob error response contains an array of validation errors', async () => {
    const errorJson = JSON.stringify({
      message: ['sections must contain at least 1 elements', 'title must be a string'],
      error: 'Bad Request',
    });
    const errorBlob = new Blob([errorJson], { type: 'application/json' });
    const axiosError = {
      response: {
        status: 400,
        data: errorBlob,
      },
    };
    vi.mocked(api.post).mockRejectedValueOnce(axiosError);

    await expect(
      exportSections('pdf', {
        title: 'Test',
        sections: [{ name: 'Test', columns: [{ key: 'col', label: 'Col' }], rows: [] }],
      }),
    ).rejects.toThrow('sections must contain at least 1 elements, title must be a string');
  });
});
