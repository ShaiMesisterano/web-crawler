import { crawl } from '../src/crawler';
import * as fs from 'fs';
import fetch from 'node-fetch';

jest.mock('node-fetch');
jest.mock('fs');

describe('crawl', () => {
  beforeEach(() => {
    (fetch as any).mockClear();
    (fs.writeFileSync as jest.Mock).mockClear();
  });

  it('should crawl a site and save results to results.json', async () => {
    (fetch as any).mockResolvedValueOnce({
      text: async () => '<img src="image1.jpg"><a href="nextPage.html">',
    });

    (fetch as any).mockResolvedValueOnce({
      text: async () => '<img src="image2.jpg">',
    });

    await crawl('http://example.com', 1);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'results.json',
      JSON.stringify(
        {
          results: [
            {
              imageUrl: 'image1.jpg',
              sourceUrl: 'http://example.com',
              depth: 0,
            },
            {
              imageUrl: 'image2.jpg',
              sourceUrl: 'http://example.com/nextPage.html',
              depth: 1,
            },
          ],
        },
        null,
        2
      )
    );
  });
});
