// Simple number-to-image/text mappings for 00-99
// Images are generated using picsum with a deterministic seed per number

export const numberGallery = Array.from({ length: 100 }).map((_, i) => {
  const id = String(i).padStart(2, "0");
  const sampleTexts = {
    "00": "Ocean waves",
    10: "toro",
    "01": "Bright sun",
    "02": "Green tree",
    "07": "Lucky clover",
    13: "Black cat (superstition)",
    21: "Skyscraper",
    42: "The answer to everything",
    77: "Dice showing double sevens",
    99: "Two nines together",
  };

  return {
    id,
    // deterministic placeholder image for the number
    image: `https://picsum.photos/seed/num${id}/800/600`,
    // optional short reminder text
    text: sampleTexts[id] || "",
  };
});
