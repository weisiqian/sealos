import { connectToDatabase } from './mongodb';
import { TemplateStore } from '@/types/templateStore';
import { v4 as uuid } from 'uuid';

async function connectToTemplateStoreCollection() {
  const client = await connectToDatabase();
  const collection = client.db().collection<TemplateStore>('template-store');
  // await collection.createIndex({ storeId: 1 }, { unique: true });
  return collection;
}

export async function createTemplateStore(storeName: string, repositoryUrl: string, branch: string) {
  const collection = await connectToTemplateStoreCollection();
  const storeId = uuid();
  const templateStore: TemplateStore = { storeId, storeName, repositoryUrl, branch };
  const res = await collection.insertOne(templateStore);
  return res.acknowledged ? res : null;
}

export async function updateTemplateStore(storeId: string, newData: Partial<Pick<TemplateStore, 'storeName' | 'repositoryUrl' | 'branch' | 'templateJson'>>): Promise<boolean> {
  const collection = await connectToTemplateStoreCollection();
  let parameter: Partial<Pick<TemplateStore, 'storeName' | 'repositoryUrl' | 'branch' | 'templateJson'>> = {};
  if (newData.storeName) {
    parameter['storeName'] = newData.storeName;
  }
  if (newData.repositoryUrl) {
    parameter['repositoryUrl'] = newData.repositoryUrl;
  }
  if (newData.branch) {
    parameter['branch'] = newData.branch;
  }
  if (newData.templateJson) {
    parameter['templateJson'] = newData.templateJson;
  }
  try {
    const result = await collection.updateOne(
      { storeId: storeId },
      { $set: parameter }
    );

    if (result.modifiedCount === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getTemplateStore(storeName: string): Promise<TemplateStore | null> {
  const collection = await connectToTemplateStoreCollection();
  return await collection.findOne({ storeName });
}

export async function getTemplateStoreById(storeId: string): Promise<TemplateStore | null> {
  const collection = await connectToTemplateStoreCollection();
  return await collection.findOne({ storeId });
}

export async function deleteByStoreId(storeId: string): Promise<boolean> {
  const collection = await connectToTemplateStoreCollection();
  try {
    const result = await collection.deleteOne({ storeId });
    if (result.deletedCount === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function queryStoreList(): Promise<TemplateStore[]> {
  try {
    const collection = await connectToTemplateStoreCollection();
    const storeList = await collection.find().toArray();
    return storeList;
  } catch (error) {
    console.error(error);
    return []
  }
}