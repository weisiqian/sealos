import { jsonRes } from '@/services/backend/response';
import { ApiResp } from '@/services/kubernet';
import { TemplateType } from '@/types/app';
import { parseGithubUrl } from '@/utils/tools';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { getTemplateStoreById } from '@/services/backend/db/templateStore';
import { syncStoreFile } from './store/syncStore';

export function replaceRawWithCDN(url: string, cdnUrl: string) {
  let parsedUrl = parseGithubUrl(url);
  if (!parsedUrl || !cdnUrl) return url;
  if (parsedUrl.hostname === 'raw.githubusercontent.com') {
    const newUrl = `https://${cdnUrl}/gh/${parsedUrl.organization}/${parsedUrl.repository}@${parsedUrl.branch}/${parsedUrl.remainingPath}`;
    return newUrl;
  }
  return url;
}

const handleTemplateData = (jsonData: string) => {
  const cdnUrl = process.env.CDN_URL;
  const _templates: TemplateType[] = JSON.parse(jsonData);
  const templates = _templates
    .filter((item) => item?.spec?.draft !== true)
    .map((item) => {
      if (!!cdnUrl) {
        item.spec.readme = replaceRawWithCDN(item.spec.readme, cdnUrl);
        item.spec.icon = replaceRawWithCDN(item.spec.icon, cdnUrl);
      }
      return item;
    });
  return templates;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  const storeId = req.query['storeId'] as string;
  const originalPath = process.cwd();
  const jsonPath = path.resolve(originalPath, 'templates.json');
  try {
    if (storeId) {
      let templateStore = await getTemplateStoreById(storeId);
      if (!templateStore) {
        return jsonRes(res, { code: 400, message: 'storeId is invalid' });
      }
      let jsonData = templateStore?.templateJson || '';
      if (!jsonData) {
        await syncStoreFile(storeId, templateStore.repositoryUrl, templateStore.branch, res);
        templateStore = await getTemplateStoreById(storeId);
        jsonData = templateStore?.templateJson || '';
      }
      const templates = handleTemplateData(jsonData);
      return jsonRes(res, { data: templates, code: 200 });
    } else if (fs.existsSync(jsonPath)) {
      const jsonData = fs.readFileSync(jsonPath, 'utf8');
      const templates = handleTemplateData(jsonData);
      return jsonRes(res, { data: templates, code: 200 });
    } else {
      return jsonRes(res, { data: [], code: 200 });
    }
  } catch (error) {
    console.log(error);
    jsonRes(res, { code: 500, data: 'error' });
  }
}
