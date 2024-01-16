import {
  Box,
  Flex,
  Icon,
  Text,
  Button,
  FormControl,
  Input,
  useTheme
} from '@chakra-ui/react';
import { serviceSideProps } from '@/utils/i18n';
import MyIcon from '@/components/Icon';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useConfirm } from '@/hooks/useConfirm';
import { useLoading } from '@/hooks/useLoading';
import { useToast } from '@/hooks/useToast';
import { deepSearch } from '@/utils/tools';
import { updateStore } from '@/api/store';
import { useQuery } from '@tanstack/react-query';
import { GET } from '@/services/request';
import { useState } from 'react';

export default function editTemplateStore() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  const boxStyles = {
    border: theme.borders.base,
    borderRadius: 'sm',
    bg: 'white'
  };

  const headerStyles = {
    py: 4,
    pl: '42px',
    fontSize: '2xl',
    color: 'myGray.900',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'myWhite.600'
  };

  // form
  const formHook = useForm({
    defaultValues: {
      storeName: '',
      repositoryUrl: '',
      branch: ''
    },
    values: {
      storeName: '',
      repositoryUrl: '',
      branch: ''
    }
  });

  const [storeData, setStoreData] = useState(null);
  if (!storeData) {
    GET(`/api/store/getStore?storeId=${router.query.storeId}`).then((res) => {
      setStoreData(res)
      formHook.setValue('storeName', res.storeName)
      formHook.setValue('repositoryUrl', res.repositoryUrl)
      formHook.setValue('branch', res.branch)
    });
  }

  const {
    register,
    formState: { errors }
  } = formHook;

  const { openConfirm, ConfirmChild } = useConfirm({
    content: '是否确认保存？'
  });

  const { Loading, setIsLoading } = useLoading();
  const submitSuccess = async () => {
    setIsLoading(true);
    try {
      const { storeName, repositoryUrl, branch } = formHook.getValues()
      await updateStore(router.query.storeId as string, storeName, repositoryUrl, branch);
      toast({
        title: '保存成功',
        status: 'success'
      });
      router.push({ pathname: '/' });
    } catch (e) {
      console.error(e);
      toast({
        title: `${e}`,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
    setIsLoading(false);
  };

  const { toast } = useToast();
  const submitError = async () => {
    await formHook.trigger();
    toast({
      title: deepSearch(formHook.formState.errors),
      status: 'error',
      position: 'top',
      duration: 3000,
      isClosable: true
    });
  };

  return (
    <Flex
      flexDirection={'column'}
      height={'100vh'}
      overflow={'hidden'}
      position={'relative'}
      borderRadius={'12px'}
      background={'linear-gradient(180deg, #FFF 0%, rgba(255, 255, 255, 0.70) 100%)'}>
      <Box
        flexDirection={'column'}
        height={'100%'}
        overflow={'auto'}
        position={'relative'}
        borderRadius={'12px'}
        background={'linear-gradient(180deg, #FFF 0%, rgba(255, 255, 255, 0.70) 100%)'}>
        <Flex
          height={'85px'}
          width={'100%'}
          mb={'36px'}
          justifyContent={'space-between'}
          align={'center'}
          borderBottom={'1px solid #EAEBF0'}>
          <Flex
            alignItems={'center'}
            fontWeight={500}
            fontSize={16}
            color={'#7B838B'}
            cursor={'pointer'}>
            <Flex
              alignItems={'center'}
              css={{
                ':hover': {
                  fill: '#219BF4',
                  color: '#219BF4',
                  '> svg': {
                    fill: '#219BF4'
                  }
                }
              }}>
              <Icon
                ml={'19px'}
                viewBox="0 0 15 15"
                fill={'#24282C'}
                w={'15px'}
                h="15px"
                onClick={() => router.push('/')}>
                <path d="M9.1875 13.1875L3.92187 7.9375C3.85937 7.875 3.81521 7.80729 3.78937 7.73438C3.76312 7.66146 3.75 7.58333 3.75 7.5C3.75 7.41667 3.76312 7.33854 3.78937 7.26562C3.81521 7.19271 3.85937 7.125 3.92187 7.0625L9.1875 1.79687C9.33333 1.65104 9.51562 1.57812 9.73438 1.57812C9.95312 1.57812 10.1406 1.65625 10.2969 1.8125C10.4531 1.96875 10.5312 2.15104 10.5312 2.35938C10.5312 2.56771 10.4531 2.75 10.2969 2.90625L5.70312 7.5L10.2969 12.0938C10.4427 12.2396 10.5156 12.4192 10.5156 12.6325C10.5156 12.8463 10.4375 13.0312 10.2812 13.1875C10.125 13.3438 9.94271 13.4219 9.73438 13.4219C9.52604 13.4219 9.34375 13.3438 9.1875 13.1875Z" />
              </Icon>
              <Text ml="4px" onClick={() => router.push('/')}>
                {t('Template List')}
              </Text>
            </Flex>
            <Text px="6px">/</Text>
            <Text
              color={router.pathname === '/deploy' ? '#262A32' : '#7B838B'}>
              {router.pathname === '/store/add' ? '添加仓库' : '编辑仓库'}
            </Text>
          </Flex>
          <Button
            px={4}
            minW={'140px'}
            h={'40px'}
            variant={'primary'}
            mr={'20px'}
            onClick={() => formHook.handleSubmit(openConfirm(submitSuccess), submitError)()}>
            保存仓库
          </Button>
        </Flex>
        <Box mx="42px" mb="36px" flexGrow={1} id={'baseInfo'} {...boxStyles}>
          <Box {...headerStyles}>
            <MyIcon name={'formInfo'} mr={5} w={'24px'} color={'myGray.500'} />
            仓库配置
          </Box>
          <Box px={'42px'} py={'24px'}>
            <FormControl mb={7} isInvalid={!!errors.storeName}>
              <Flex alignItems={'center'} align="stretch">
                <Flex
                  position={'relative'}
                  w="200px"
                  className="template-dynamic-label"
                  color={'#333'}
                  userSelect={'none'}
                >
                  仓库名称
                  <Text ml="2px" color={'#E53E3E'}>
                    *
                  </Text>
                </Flex>
                <Input
                  type={'input'}
                  maxW={'500px'}
                  ml={'20px'}
                  defaultValue={''}
                  autoFocus={true}
                  placeholder={'请输入仓库名称'}
                  {...register('storeName', {
                    required: `请输入仓库名称`,
                    maxLength: {
                      value: 10,
                      message: '仓库地址名称不能超过10个字符',
                    }
                  })}
                />
              </Flex>
            </FormControl>
            <FormControl mb={7} isInvalid={!!errors.repositoryUrl}>
              <Flex alignItems={'center'} align="stretch">
                <Flex
                  position={'relative'}
                  w="200px"
                  className="template-dynamic-label"
                  color={'#333'}
                  userSelect={'none'}
                >
                  仓库地址
                  <Text ml="2px" color={'#E53E3E'}>
                    *
                  </Text>
                </Flex>
                <Input
                  type={'input'}
                  maxW={'500px'}
                  ml={'20px'}
                  defaultValue={''}
                  autoFocus={true}
                  placeholder={'请输入仓库地址'}
                  {...register('repositoryUrl', {
                    required: `请输入仓库地址`,
                    maxLength: {
                      value: 100,
                      message: '仓库地址不能超过100个字符',
                    },
                    pattern: {
                      value: /^(https?:\/\/)?([\w\d.-]+)(\.[\w\d.-]+)([\w\d.-]*)/,
                      message: '请输入有效的URL地址',
                    }
                  })}
                />
              </Flex>
            </FormControl>
            <FormControl mb={7} isInvalid={!!errors.branch}>
              <Flex alignItems={'center'} align="stretch">
                <Flex
                  position={'relative'}
                  w="200px"
                  className="template-dynamic-label"
                  color={'#333'}
                  userSelect={'none'}
                >
                  仓库分支
                  <Text ml="2px" color={'#E53E3E'}>
                    *
                  </Text>
                </Flex>
                <Input
                  type={'input'}
                  maxW={'500px'}
                  ml={'20px'}
                  defaultValue={''}
                  autoFocus={true}
                  placeholder={'请输入仓库分支'}
                  {...register('branch', {
                    required: `请输入仓库分支`,
                    maxLength: {
                      value: 10,
                      message: '仓库分支名称不能超过10个字符',
                    }
                  })}
                />
              </Flex>
            </FormControl>
          </Box>
          <ConfirmChild />
          <Loading />
        </Box>
      </Box>
    </Flex>
  )
}

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
