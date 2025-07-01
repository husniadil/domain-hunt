#!/usr/bin/env node

/**
 * TLD Data Extraction Script
 * Converts HTML-formatted TLD data into structured JSON format
 *
 * Usage: node scripts/extract-tld-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input and output paths
const HTML_FILE = path.join(__dirname, '../data/tld.html');
const OUTPUT_FILE = path.join(__dirname, '../data/tlds.json');
const BACKUP_FILE = path.join(__dirname, '../data/tlds-backup.json');

/**
 * Known TLD name mappings for common extensions
 */
const TLD_NAMES = {
  com: 'Commercial',
  net: 'Network',
  org: 'Organization',
  co: 'Company',
  io: 'Input/Output',
  ai: 'Artificial Intelligence',
  xyz: 'Generic',
  info: 'Information',
  biz: 'Business',
  inc: 'Incorporated',
  online: 'Online',
  tech: 'Technology',
  pro: 'Professional',
  app: 'Application',
  dev: 'Developer',
  club: 'Club',
  shop: 'Shop',
  store: 'Store',
  live: 'Live',
  me: 'Personal',
  tv: 'Television',
  fm: 'Radio',
  email: 'Email',
  blog: 'Blog',
  news: 'News',
  game: 'Gaming',
  cloud: 'Cloud Computing',
};

/**
 * Generate a readable name for a TLD extension
 * @param {string} extension - TLD extension (without dot)
 * @param {string} category - Category name for context
 * @returns {string} Human-readable name
 */
function generateTldName(extension, category) {
  // Use predefined mapping if available
  if (TLD_NAMES[extension]) {
    return TLD_NAMES[extension];
  }

  // For country codes and cities, capitalize
  if (category === 'International' || category === 'Cities') {
    return extension.toUpperCase();
  }

  // For compound extensions like co.uk, use as-is
  if (extension.includes('.')) {
    return extension.toUpperCase();
  }

  // Default: capitalize first letter
  return extension.charAt(0).toUpperCase() + extension.slice(1);
}

/**
 * Validate TLD extension format
 * @param {string} extension - TLD extension
 * @returns {boolean} True if valid
 */
function validateTldExtension(extension) {
  if (!extension || typeof extension !== 'string') return false;

  // Should start with dot
  if (!extension.startsWith('.')) return false;

  // Should have content after dot
  if (extension.length <= 1) return false;

  // Should not have spaces or invalid characters
  if (/[\s<>"]/.test(extension)) return false;

  return true;
}

/**
 * Extract TLD data from HTML content
 * @param {string} htmlContent - Raw HTML content
 * @returns {Object} Structured TLD data
 */
function extractTldData(htmlContent) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  const categories = [];
  const allTlds = [];
  const tldMap = new Map(); // Track unique TLDs and their primary category
  let tldCount = 0;

  // Find all div elements containing TLD categories
  const categoryDivs = document.querySelectorAll('div');

  categoryDivs.forEach(div => {
    const textContent = div.textContent.trim();
    if (!textContent) return;

    // Extract category name (first line of text content)
    const lines = textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
    if (lines.length === 0) return;

    const categoryName = lines[0];

    // Find all span elements within this div
    const tldSpans = div.querySelectorAll('span');
    if (tldSpans.length === 0) return;

    const categoryTlds = [];

    tldSpans.forEach(span => {
      const extension = span.textContent.trim();
      if (!extension) return;

      // Add dot prefix if not present
      const formattedExtension = extension.startsWith('.')
        ? extension
        : `.${extension}`;

      // Validate extension
      if (!validateTldExtension(formattedExtension)) {
        console.warn(`Skipping invalid TLD: ${formattedExtension}`);
        return;
      }

      // Check if TLD already exists
      if (tldMap.has(formattedExtension)) {
        const existingTld = tldMap.get(formattedExtension);

        // If current category is Popular, update the existing TLD
        if (categoryName === 'Popular') {
          existingTld.popular = true;
          existingTld.category = categoryName;
        }

        // Add to current category but don't duplicate in allTlds
        categoryTlds.push(existingTld);
        return;
      }

      const tld = {
        extension: formattedExtension,
        name: generateTldName(extension, categoryName),
        popular: categoryName === 'Popular',
        category: categoryName,
      };

      // Store in map and arrays
      tldMap.set(formattedExtension, tld);
      categoryTlds.push(tld);
      allTlds.push(tld);
      tldCount++;
    });

    if (categoryTlds.length > 0) {
      categories.push({
        id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: categoryName,
        description: `${categoryName} TLD extensions`,
        tlds: categoryTlds,
      });
    }
  });

  // Get unique TLD count
  const uniqueTldCount = allTlds.length;
  console.log(
    `Extracted ${uniqueTldCount} unique TLDs across ${categories.length} categories (${tldCount} total TLD references)`
  );

  return {
    categories,
    tlds: allTlds, // Flattened for backward compatibility
    metadata: {
      totalTlds: uniqueTldCount,
      totalCategories: categories.length,
      totalReferences: tldCount,
      extractedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

/**
 * Main extraction function
 */
function main() {
  try {
    console.log('Starting TLD data extraction...');

    // Check if HTML file exists
    if (!fs.existsSync(HTML_FILE)) {
      throw new Error(`HTML file not found: ${HTML_FILE}`);
    }

    // Backup existing JSON file if it exists
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log(`Backing up existing file to ${BACKUP_FILE}`);
      fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
    }

    // Read HTML content
    console.log('Reading HTML content...');
    const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');

    // Extract TLD data
    console.log('Extracting TLD data...');
    const tldData = extractTldData(htmlContent);

    // Validate extracted data
    if (tldData.categories.length === 0) {
      throw new Error('No categories found in HTML content');
    }

    if (tldData.tlds.length === 0) {
      throw new Error('No TLDs found in HTML content');
    }

    // Ensure Popular category exists
    const popularCategory = tldData.categories.find(
      cat => cat.name === 'Popular'
    );
    if (!popularCategory) {
      throw new Error('Popular category not found in extracted data');
    }

    console.log(
      `Popular category contains ${popularCategory.tlds.length} TLDs`
    );

    // Write JSON output
    console.log(`Writing extracted data to ${OUTPUT_FILE}`);
    const jsonOutput = JSON.stringify(tldData, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonOutput, 'utf-8');

    // Summary
    console.log('\n✅ Extraction completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Total Categories: ${tldData.metadata.totalCategories}`);
    console.log(`   - Total TLDs: ${tldData.metadata.totalTlds}`);
    console.log(`   - Popular TLDs: ${popularCategory.tlds.length}`);
    console.log(`   - Output: ${OUTPUT_FILE}`);

    // Display category breakdown
    console.log('\n📋 Category breakdown:');
    tldData.categories.forEach(category => {
      console.log(`   - ${category.name}: ${category.tlds.length} TLDs`);
    });
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractTldData, generateTldName, validateTldExtension };
