import { d as defineEventHandler, e as getQuery, c as createError, b as direct_media_download } from '../../../nitro/nitro.mjs';
import { readFile } from 'node:fs/promises';
import 'node:path';
import 'mime-types';
import '@distube/ytdl-core';
import 'file-type';
import 'node:fs';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:crypto';
import 'node:url';
import '@iconify/utils';
import 'consola';

const file_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const rawUrl = typeof query.url === "string" ? query.url : "";
  const format = query.format === "mp3" || query.format === "mp4" ? query.format : "auto";
  if (!rawUrl) {
    throw createError({ statusCode: 400, statusMessage: "A media URL is required." });
  }
  try {
    const result = await direct_media_download(rawUrl, {
      title: typeof query.title === "string" ? query.title : "media-download",
      format
    });
    if (!result.tempPath) {
      throw new Error("No temporary file was created for this media download.");
    }
    const fileBuffer = await readFile(result.tempPath);
    const finalFileName = result.fileName.includes(".") ? result.fileName : `${result.fileName}.${result.fileType === "audio" ? "mp3" : "mp4"}`;
    const safeFileName = finalFileName.replace(/['"]/g, "");
    const encodedFileName = encodeURIComponent(safeFileName);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": result.mimeType || "application/octet-stream",
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || "Unable to prepare the media download."
    });
  }
});

export { file_get as default };
//# sourceMappingURL=file.get.mjs.map
