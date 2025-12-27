/**
 * Generate and download an image using OpenAI's DALL-E API
 * @param {string} prompt - Description of the image to generate
 * @param {string} filename - Name for the downloaded file (without extension)
 * @param {object} options - Additional options
 * @param {string} options.size - Image size: "256x256", "512x512", or "1024x1024"
 * @param {string} options.apiKey - OpenAI API key
 * @returns {Promise<string>} URL of the generated image
 */
export const generateAndDownloadImage = async (
  prompt,
  filename,
  options = {}
) => {
  const { size = "512x512", apiKey = import.meta.env.VITE_OPENAI_API_KEY } =
    options;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Set VITE_OPENAI_API_KEY in your .env file"
    );
  }

  try {
    // Call OpenAI API to generate image
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: size,
          quality: "standard",
          response_format: "url",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI API error: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log(`Image generated and downloaded: ${filename}.png`);
    return imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Generate an image and save it to a specific path (browser limitation - downloads to default folder)
 * @param {string} prompt - Description of the image to generate
 * @param {string} targetPath - Desired path (e.g., "public/images/games/numbers/10.png")
 * @param {object} options - Additional options
 * @returns {Promise<string>} URL of the generated image
 */
export const generateImageForGallery = async (
  prompt,
  targetPath,
  options = {}
) => {
  const filename = targetPath.split("/").pop().replace(".png", "");
  console.log(`Generating image for: ${targetPath}`);
  console.log(
    `Note: Browser will download to default Downloads folder as ${filename}.png`
  );
  console.log(`Manually move the file to: ${targetPath}`);

  return await generateAndDownloadImage(prompt, filename, options);
};

/**
 * Batch generate images for multiple numbers
 * @param {Array<{number: number, prompt: string}>} items - Array of items to generate
 * @param {string} basePath - Base path for images (e.g., "public/images/games/numbers")
 * @param {object} options - Additional options
 * @returns {Promise<void>}
 */
export const batchGenerateImages = async (items, basePath, options = {}) => {
  const { delayMs = 2000 } = options; // Delay between requests to avoid rate limits

  for (const item of items) {
    const targetPath = `${basePath}/${String(item.number).padStart(
      2,
      "0"
    )}.png`;
    try {
      await generateImageForGallery(item.prompt, targetPath, options);
      // Wait before next request to avoid rate limits
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(
        `Failed to generate image for number ${item.number}:`,
        error
      );
    }
  }
};

// Example usage:
// import { generateImageForGallery, batchGenerateImages } from './utils/imageGenerator';
//
// Single image:
// await generateImageForGallery(
//   "A powerful bull in a meadow, 3D illustration style",
//   "public/images/games/numbers/10.png",
//   { size: "512x512" }
// );
//
// Batch generation:
// await batchGenerateImages([
//   { number: 10, prompt: "A powerful bull in a meadow, 3D illustration" },
//   { number: 11, prompt: "A baby bottle, 3D illustration" },
//   { number: 12, prompt: "A tuna fish, 3D illustration" },
// ], "public/images/games/numbers");
