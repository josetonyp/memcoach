// Simple number-to-image/text mappings for 00-99
// Images are generated using picsum with a deterministic seed per number
import wordsDictionary from "../libs/games/pairNumber/wordsDictionary.js";

export const numberGallery = Object.keys(wordsDictionary).map((i) => {
  var id = i < 10 ? `0${i}`.toString() : i.toString();

  return {
    id: id,
    // deterministic placeholder image for the number
    image: `/memcoach/images/games/numbers/${id}.png`,
    // optional short reminder text
    words: wordsDictionary[i].words,
  };
});
