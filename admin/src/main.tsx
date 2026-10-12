import React, { Suspense, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import jaJP from 'antd/locale/ja_JP'
import koKR from 'antd/locale/ko_KR'
import esES from 'antd/locale/es_ES'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ja'
import 'dayjs/locale/ko'
import 'dayjs/locale/es'

import './i18n' // 初始化 i18next
import App from './App'

// antd locale 映射
const ANTD_LOCALES: Record<string, typeof zhCN> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'es-ES': esES,
}

// dayjs locale 映射（key 为 dayjs 的 locale 名）
const DAYJS_LOCALES: Record<string, string> = {
  'zh-CN': 'zh-cn',
  'en-US': 'en',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'es-ES': 'es',
}

function AntdLocaleWrapper({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'zh-CN'
  const antdLocale = ANTD_LOCALES[lang] || zhCN

  // 同步 dayjs 语言
  useEffect(() => {
    const dayjsLang = DAYJS_LOCALES[lang] || 'en'
    dayjs.locale(dayjsLang)
  }, [lang])

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<Spin style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }} />}>
      <BrowserRouter basename="/admin">
        <AntdLocaleWrapper>
          <App />
        </AntdLocaleWrapper>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>,
)
