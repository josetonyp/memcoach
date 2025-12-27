#!/usr/bin/env node

/**
 * Script to generate images for the number gallery using OpenAI DALL-E
 * Usage: npm run create_images
 *
 * Set your OpenAI API key in .env:
 * VITE_OPENAI_API_KEY=sk-your-key-here
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sharp from "sharp";
import wordsDictionary from "../src/libs/games/pairNumber/wordsDictionary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const API_KEY = process.env.VITE_OPENAI_API_KEY;
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "games",
  "numbers"
);

/**
 * Generate an image using OpenAI DALL-E API
 */
async function generateImage(prompt, size = "1024x1024") {
  if (!API_KEY) {
    throw new Error("VITE_OPENAI_API_KEY not found in .env file");
  }

  console.log(`Generating image: "${prompt}"`);

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: "standard",
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenAI API error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.data[0].url;
}

/**
 * Download image from URL and save to file
 */
async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Resize image to 300x300 pixels
  await sharp(Buffer.from(buffer))
    .resize(300, 300, {
      fit: "cover",
      position: "center",
    })
    .png()
    .toFile(filepath);

  console.log(`✓ Saved and resized to 300x300: ${filepath}`);
}

/**
 * Generate and save an image for a number
 */
async function generateNumberImage(number, word, explanation = "") {
  const filename = String(number).padStart(2, "0") + ".png";
  const filepath = path.join(OUTPUT_DIR, filename);

  // Delete existing file if it exists
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`🗑 Deleted existing file: ${filename}`);
  }

  const prompt = `Una ${word}, en un estilo realista, memorable, fácil de reconocer, fondo simple, objeto centrado, ${explanation}`;

  console.log(`\nGenerating image for number ${number} (${word})... ${prompt}`);
  try {
    const imageUrl = await generateImage(prompt);
    await downloadImage(imageUrl, filepath);
    console.log(`✓ Generated image for number ${number} (${word})\n`);
  } catch (error) {
    console.error(`✗ Failed to generate image for ${number}:`, error.message);
  }
}

/**
 * Main function to generate all images
 */
async function main() {
  console.log("🎨 Starting image generation...\n");

  // Check API key
  if (!API_KEY) {
    console.error("❌ Error: VITE_OPENAI_API_KEY not found in .env file");
    console.error("Please add your OpenAI API key to .env:\n");
    console.error("VITE_OPENAI_API_KEY=sk-your-key-here\n");
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}\n`);
  }

  // Get numbers to generate from command line args or use defaults
  const args = process.argv.slice(2);
  let numbersToGenerate = [];
  let fromNumber = 0;

  // Parse --from argument
  const fromArg = args.find((arg) => arg.startsWith("--from="));
  if (fromArg) {
    fromNumber = parseInt(fromArg.split("=")[1]);
    if (isNaN(fromNumber) || fromNumber < 0 || fromNumber > 99) {
      console.error("❌ Invalid --from value. Must be between 0 and 99.");
      process.exit(1);
    }
  }

  // Get specific numbers or all numbers
  const specificNumbers = args
    .filter((arg) => !arg.startsWith("--"))
    .map((n) => parseInt(n))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 99);

  if (specificNumbers.length > 0) {
    // Generate specific numbers from command line
    numbersToGenerate = specificNumbers.filter((n) => n >= fromNumber);
  } else {
    // Generate all numbers in dictionary starting from fromNumber
    numbersToGenerate = Object.keys(wordsDictionary)
      .map((n) => parseInt(n))
      .filter((n) => n >= fromNumber);
  }

  console.log(
    `Generating images for numbers: ${numbersToGenerate.join(", ")}\n`
  );

  // Generate images with delay to avoid rate limits
  for (const number of numbersToGenerate) {
    const entry = wordsDictionary[number];
    if (!entry) {
      console.warn(`⚠ No word found for number ${number}, skipping...`);
      continue;
    }

    const word = entry.words[0].word;
    const explanation = entry.words[0].memory || "";
    await generateNumberImage(number, word, explanation);

    // Wait 2 seconds between requests to avoid rate limits
    if (numbersToGenerate.indexOf(number) < numbersToGenerate.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n✨ Image generation complete!");
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
