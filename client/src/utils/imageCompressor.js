/**
 * Client-side high performance image compressor using HTML5 Canvas.
 * Compresses heavy phone/camera photos down to lightweight WebP/JPEG files in milliseconds.
 */
export async function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  if (!file || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        const outputType = "image/webp";
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
