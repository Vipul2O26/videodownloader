import { d as defineEventHandler, r as readBody, c as createError, g as get_media_info } from '../../nitro/nitro.mjs';
import 'node:path';
import 'mime-types';
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

const mediaInfo_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const rawUrl = typeof (body == null ? void 0 : body.url) === "string" ? body.url : "";
  if (!rawUrl) {
    throw createError({ statusCode: 400, statusMessage: "A media URL is required." });
  }
  try {
    return await get_media_info(rawUrl);
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || "Unable to retrieve media metadata."
    });
  }
});

export { mediaInfo_post as default };
//# sourceMappingURL=media-info.post.mjs.map
