import { d as defineEventHandler, r as readBody, c as createError, b as direct_media_download } from '../../../nitro/nitro.mjs';
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
import 'node:module';

const download_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const rawUrl = typeof (body == null ? void 0 : body.url) === "string" ? body.url : "";
  if (!rawUrl) {
    throw createError({ statusCode: 400, statusMessage: "A media URL is required." });
  }
  try {
    const format = (body == null ? void 0 : body.format) === "mp3" || (body == null ? void 0 : body.format) === "mp4" ? body.format : "auto";
    const result = await direct_media_download(rawUrl, {
      title: typeof (body == null ? void 0 : body.title) === "string" ? body.title : "Remote media asset",
      format
    });
    return result;
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || "Unable to download the remote media."
    });
  }
});

export { download_post as default };
//# sourceMappingURL=download.post.mjs.map
