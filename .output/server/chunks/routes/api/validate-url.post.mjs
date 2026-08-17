import { d as defineEventHandler, r as readBody, v as validateUrl, c as createError } from '../../nitro/nitro.mjs';
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

const validateUrl_post = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const rawUrl = typeof (body == null ? void 0 : body.url) === "string" ? body.url : "";
  const validation = validateUrl(rawUrl);
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      statusMessage: (_a = validation.message) != null ? _a : "The URL is invalid."
    });
  }
  return {
    valid: true,
    normalizedUrl: validation.normalizedUrl,
    host: validation.host,
    message: "The media URL passed validation."
  };
});

export { validateUrl_post as default };
//# sourceMappingURL=validate-url.post.mjs.map
