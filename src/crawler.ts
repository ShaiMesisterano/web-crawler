import * as axios from 'axios';
import * as fs from 'fs';
import { URL } from 'url';
import { ImageResult } from './types';

export const crawl = async (url: string, depth: number): Promise<void> => {
  const visited: Set<string> = new Set(); // flag visited URLs
  const results: ImageResult[] = [];

  const processPage = async (
    pageUrl: string,
    currentDepth: number
  ): Promise<void> => {
    if (visited.has(pageUrl) || currentDepth > depth) {
      return;
    }

    visited.add(pageUrl);

    try {
      const response = await axios.get(pageUrl);
      const base = new URL(pageUrl);

      const images = response.data.match(/<img[^>]*src="([^"]*)"[^>]*>/g);

      if (images) {
        images.forEach(imageTag => {
          const imageUrl = imageTag.match(/src="([^"]*)"/)[1];
          results.push({
            imageUrl,
            sourceUrl: pageUrl,
            depth: currentDepth,
          });
        });
      }

      const links = response.data.match(/<a[^>]*href="([^"]*)"[^>]*>/g);

      if (links) {
        for (const linkTag of links) {
          const linkUrl = linkTag.match(/href="([^"]*)"/)[1];
          const resolvedLinkUrl = new URL(linkUrl, base).href;
          await processPage(resolvedLinkUrl, currentDepth + 1);
        }
      }
    } catch (error) {
      console.error(`Error crawling ${pageUrl}: ${error.message}`);
    }
  };

  await processPage(url, 0);

  const output = {
    results,
  };

  fs.writeFileSync('results.json', JSON.stringify(output, null, 2));

  console.log('Crawling completed. Results saved to results.json.');
};

// store arguments
const startUrl: string = process.argv[2];
const depth: number = parseInt(process.argv[3]);
const usageInstructions = 'Usage: node crawler.js <start_url> <depth>';

if (!startUrl) {
  // validate first argument
  console.error(`<start_url> is missing. ${usageInstructions}`);
} else if (isNaN(depth)) {
  // validate second argument
  console.error(`<depth> is missing. ${usageInstructions}`);
} else {
  // all is valid
  crawl(startUrl, depth);
}
