import { jsonRes } from '@/services/backend/response';
import { ApiResp } from '@/services/kubernet';
import { TemplateStore } from '@/types/templateStore';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getTemplateStoreById } from '@/services/backend/db/templateStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  try {
    const storeId = req.query['storeId'] as string;
    if (!storeId) return jsonRes(res, { code: 400, message: 'storeId is required' });
    const existsStore = await getTemplateStoreById(storeId);
    jsonRes(res, { data: existsStore, code: 200 });
  } catch (err: any) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
