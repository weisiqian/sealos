import { jsonRes } from '@/services/backend/response';
import { ApiResp } from '@/services/kubernet';
import { TemplateStore } from '@/types/templateStore';
import type { NextApiRequest, NextApiResponse } from 'next';
import { updateTemplateStore, getTemplateStoreById } from '@/services/backend/db/templateStore';

const isUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  try {
    const { storeId, storeName, repositoryUrl, branch } = req.body as TemplateStore;
    if (!storeId) return jsonRes(res, { code: 400, message: 'storeId is required' });
    if (!storeName) return jsonRes(res, { code: 400, message: 'storeName is required' });
    if (storeName.length > 10) return jsonRes(res, { code: 400, message: 'storeName must not exceed 10 characters in length' });
    if (!repositoryUrl) return jsonRes(res, { code: 400, message: 'repositoryUrl is required' });
    if (repositoryUrl.length > 100) return jsonRes(res, { code: 400, message: 'repositoryUrl must not exceed 100 characters in length' });
    if (!isUrl(repositoryUrl)) return jsonRes(res, { code: 400, message: 'repositoryUrl is invalid URL' });
    if (!branch) return jsonRes(res, { code: 400, message: 'branch is required' });
    if (branch.length > 10) return jsonRes(res, { code: 400, message: 'branch must not exceed 10 characters in length' });
    const existsStore = await getTemplateStoreById(storeId);
    if (!existsStore) {
      return jsonRes(res, { code: 400, message: `storeId ${storeId} does note exists` });
    }
    await updateTemplateStore(storeId, { storeName, repositoryUrl, branch });
    jsonRes(res, { data: `successfully`, code: 200 });
  } catch (err: any) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
