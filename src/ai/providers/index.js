import { llamaConfig } from '../config.js'
import * as httpProvider from './httpLlamaProvider.js'
import * as mobileProvider from './mobileLlamaProvider.js'

export function getLlamaProvider() {
  if (llamaConfig.provider === 'mobile') {
    return mobileProvider
  }
  return httpProvider
}
