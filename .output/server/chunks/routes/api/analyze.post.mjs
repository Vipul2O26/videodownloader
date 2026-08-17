import { d as defineEventHandler, r as readBody, c as createError, a as analyze_media } from '../../nitro/nitro.mjs';
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

const analyze_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const rawUrl = typeof (body == null ? void 0 : body.url) === "string" ? body.url : "";
  if (!rawUrl) {
    throw createError({ statusCode: 400, statusMessage: "A media URL is required." });
  }
  try {
    return analyze_media(rawUrl);
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || "Unable to analyze the media URL."
    });
  }
});

export { analyze_post as default };
//# sourceMappingURL=analyze.post.mjs.map
