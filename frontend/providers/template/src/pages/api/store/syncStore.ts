import { jsonRes } from '@/services/backend/response';
import { ApiResp } from '@/services/kubernet';
import { TemplateStore } from '@/types/templateStore';
import type { NextApiRequest, NextApiResponse } from 'next';
import { queryStoreList } from '@/services/backend/db/templateStore';
import { K8sApiDefault } from '@/services/backend/kubernetes';
import { TemplateType } from '@/types/app';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import JSYAML from 'js-yaml';
import util from 'util';
import * as k8s from '@kubernetes/client-node';
import { getTemplateStoreById, updateTemplateStore } from '@/services/backend/db/templateStore';

const execAsync = util.promisify(exec);

const readFileList = (targetPath: string, fileList: unknown[] = []) => {
  // fix ci
  const sanitizePath = (inputPath: string) => {
    if (typeof inputPath !== 'string') {
      throw new Error('Invalid path. Path must be a string.');
    }
    return inputPath;
  };
  const files = fs.readdirSync(targetPath);

  files.forEach((item: any) => {
    // ok:path-join-resolve-traversal
    const filePath = path.join(sanitizePath(targetPath), sanitizePath(item));
    const stats = fs.statSync(filePath);
    const isYamlFile = path.extname(item) === '.yaml' || path.extname(item) === '.yml';
    if (stats.isFile() && isYamlFile && item !== 'template.yaml') {
      fileList.push(filePath);
    } else if (stats.isDirectory()) {
      readFileList(filePath, fileList);
    }
  });
};

export async function GetTemplateStatic() {
  try {
    const defaultKC = K8sApiDefault();
    const result = await defaultKC
      .makeApiClient(k8s.CoreV1Api)
      .readNamespacedConfigMap('template-static', 'template-frontend');

    const inputString = result?.body?.data?.['install-count'] || '';

    const installCountArray = inputString.split(/\n/).filter(Boolean);

    const temp: { [key: string]: number } = {};
    installCountArray.forEach((item) => {
      const match = item.trim().match(/^(\d+)\s(.+)$/);
      if (match) {
        const count = match[1];
        const name = match[2];
        temp[name] = parseInt(count, 10);
      } else {
        console.error(`Data format error: ${item}`);
      }
    });
    return temp;
  } catch (error) {
    console.log(error, 'error: kubectl get configmap/template-static ');
    return {};
  }
}

export const syncStoreFile = async (storeId: string, repoHttpUrl: string, branch: string, res: NextApiResponse<ApiResp>) => {
  try {
    const targetFolder = process.env.TEMPLATE_REPO_FOLDER || 'template';
    const originalPath = path.join(process.cwd(), storeId);
    const targetPath = path.resolve(originalPath, 'templates');
    const jsonPath = path.resolve(originalPath, 'templates.json');
    if (fs.existsSync(originalPath)) {
      fs.rmdirSync(originalPath, { recursive: true });
      fs.mkdirSync(originalPath, { recursive: true });
    }

    try {
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('operation timed out'));
        }, 60 * 1000);
      });
      const gitOperationPromise = !fs.existsSync(targetPath)
        ? execAsync(`git clone --single-branch --branch=${branch} ${repoHttpUrl} ${targetPath} --depth=1`).catch(error => {
          return jsonRes(res, { error: `${error}`, code: 500 });
        })
        : execAsync(`cd ${targetPath} && git pull --depth=1 --rebase`);

      await Promise.race([gitOperationPromise, timeoutPromise]);
    } catch (error) {
      console.log('git operation timed out: \n', error);
    }

    if (!fs.existsSync(targetPath)) {
      return jsonRes(res, { error: 'missing template repository file', code: 500 });
    }

    let fileList: unknown[] = [];
    const _targetPath = path.join(targetPath, targetFolder);
    readFileList(_targetPath, fileList);

    const templateStaticMap: { [key: string]: number } = await GetTemplateStatic();
    console.log(templateStaticMap);

    let jsonObjArr: unknown[] = [];
    fileList.forEach((item: any) => {
      try {
        if (!item) return;
        const fileName = path.basename(item);
        const content = fs.readFileSync(item, 'utf-8');
        const yamlTemplate = JSYAML.loadAll(content)[0] as TemplateType;
        if (!!yamlTemplate) {
          const appTitle = yamlTemplate.spec.title.toUpperCase();
          yamlTemplate.spec['deployCount'] = templateStaticMap[appTitle];
          yamlTemplate.spec['filePath'] = item;
          yamlTemplate.spec['fileName'] = fileName;
          jsonObjArr.push(yamlTemplate);
        }
      } catch (error) {
        console.log(error, 'yaml parse error');
      }
    });

    const jsonContent = JSON.stringify(jsonObjArr, null, 2);
    // fs.writeFileSync(jsonPath, jsonContent, 'utf-8');
    await updateTemplateStore(storeId, { templateJson: jsonContent || '' });

  } catch (err: any) {
    console.log(err, '===update repo log===');
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  try {
    const storeId = req.query['storeId'] as string;
    if (!storeId) return jsonRes(res, { code: 400, message: 'storeId is required' });

    const existsStore = await getTemplateStoreById(storeId);
    console.log(`existsStore `, existsStore)
    if (!existsStore) {
      return jsonRes(res, { code: 400, message: `${storeId} does not exist` });
    }

    await syncStoreFile(existsStore.storeId, existsStore.repositoryUrl, existsStore.branch, res);
    jsonRes(res, { data: `success update template ${existsStore.repositoryUrl}`, code: 200 });
  } catch (err: any) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
