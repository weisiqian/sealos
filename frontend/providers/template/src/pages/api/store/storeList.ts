import { jsonRes } from '@/services/backend/response';
import { ApiResp } from '@/services/kubernet';
import { TemplateStore } from '@/types/templateStore';
import type { NextApiRequest, NextApiResponse } from 'next';
import { queryStoreList } from '@/services/backend/db/templateStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  try {
    const storeList = await queryStoreList();
    storeList.unshift({
      isDefault: true,
      storeId: '',
      storeName: '官方仓库',
      repositoryUrl: 'https://github.com/labring-actions/templates',
      branch: 'main'
    })
    jsonRes(res, { data: storeList, code: 200 });
  } catch (err: any) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
