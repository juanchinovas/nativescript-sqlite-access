import { NativeScriptConfig } from '@nativescript/core'

export default {
  id: 'org.nativescript.sqliteacces',
  appPath: 'src',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
  },
  useLegacyWorkflow: false,
} as NativeScriptConfig
