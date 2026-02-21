import { getSetting } from "./settings.mjs";

const MODULE_ID = "shaak-loot-helper";
const DEFAULT_IMAGE_PATH = `modules/${MODULE_ID}/assets/tokens`;
const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg", ".svg"];

const DEFAULT_CHEST_CANDIDATES = ["chest-01.png", "chest-01.webp", "chest-01.svg"];

let _imageCache = null;
let _imageCachePath = null;
let _defaultChestIcon = null;

/**
 * Resolve the default chest icon by checking for chest-01.png, .webp, .svg in order.
 * Caches the result after first resolution.
 */
export async function getDefaultChestIcon() {
  if (_defaultChestIcon) return _defaultChestIcon;

  for (const filename of DEFAULT_CHEST_CANDIDATES) {
    const path = `modules/${MODULE_ID}/assets/tokens/${filename}`;
    try {
      const result = await FilePicker.browse("data", DEFAULT_IMAGE_PATH, {
        extensions: [`.${filename.split(".").pop()}`]
      });
      if (result.files.some(f => f.endsWith(filename))) {
        _defaultChestIcon = path;
        return _defaultChestIcon;
      }
    } catch {
      // continue to next candidate
    }
  }

  // Final fallback — return the preferred name even if not found
  _defaultChestIcon = `modules/${MODULE_ID}/assets/tokens/chest-01.png`;
  return _defaultChestIcon;
}

/**
 * Get a random token image from the configured folder.
 * Falls back to bundled defaults if the custom folder is empty or invalid.
 */
export async function getRandomTokenImage() {
  const images = await getAvailableImages();

  if (images.length === 0) {
    console.warn(`${MODULE_ID} | No token images found! Using fallback.`);
    return await getDefaultChestIcon();
  }

  const index = Math.floor(Math.random() * images.length);
  return images[index];
}

/**
 * Get all available token images from the configured folder.
 * Uses caching to avoid repeated FilePicker.browse calls.
 */
export async function getAvailableImages() {
  const customFolder = getSetting("tokenImageFolder");
  const targetPath = customFolder || DEFAULT_IMAGE_PATH;

  if (_imageCache !== null && _imageCachePath === targetPath) {
    return _imageCache;
  }

  try {
    const result = await FilePicker.browse("data", targetPath, {
      extensions: IMAGE_EXTENSIONS
    });

    const images = result.files.filter(f =>
      IMAGE_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext))
    );

    _imageCache = images;
    _imageCachePath = targetPath;

    console.log(`${MODULE_ID} | Found ${images.length} token images in "${targetPath}"`);
    return images;
  } catch (err) {
    console.error(`${MODULE_ID} | Error browsing for images in "${targetPath}":`, err);

    // If custom folder failed, try the default bundled path
    if (targetPath !== DEFAULT_IMAGE_PATH) {
      console.warn(`${MODULE_ID} | Falling back to bundled default images.`);
      try {
        const fallbackResult = await FilePicker.browse("data", DEFAULT_IMAGE_PATH, {
          extensions: IMAGE_EXTENSIONS
        });
        _imageCache = fallbackResult.files.filter(f =>
          IMAGE_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext))
        );
        _imageCachePath = DEFAULT_IMAGE_PATH;
        return _imageCache;
      } catch (fallbackErr) {
        console.error(`${MODULE_ID} | Fallback image browse also failed:`, fallbackErr);
      }
    }

    return [];
  }
}

/**
 * Invalidate the image cache (call when settings change).
 */
export function invalidateImageCache() {
  _imageCache = null;
  _imageCachePath = null;
  _defaultChestIcon = null;
}
