import { GET, POST } from '@/services/request';
import { TemplateStore } from '@/types/templateStore';

export const addStore = (
  storeName: string, 
  repositoryUrl: string, 
  branch: string
) => POST('/api/store/addStore', { storeName, repositoryUrl, branch });

export const updateStore = (
  storeId: string,
  storeName: string, 
  repositoryUrl: string, 
  branch: string
) => POST('/api/store/editStore', { storeId, storeName, repositoryUrl, branch });

export const storeList = ()=> GET('/api/store/storeList');