/*
 * @Author: shunjinchan 
 * @Date: 2018-09-25 17:14:51 
 * @Last Modified by:   shunjinchan 
 * @Last Modified time: 2018-09-25 17:14:51 
 */

 const noPromisifyMethods = [
  'stopRecord',
  'stopVoice',
  'stopBackgroundAudio',
  'stopPullDownRefresh',
  'hideKeyboard',
  'hideToast',
  'hideLoading',
  'showNavigationBarLoading',
  'hideNavigationBarLoading',
  'canIUse',
  'navigateBack',
  'closeSocket',
  'closeSocket',
  'pageScrollTo',
  'drawCanvas',
  'createAudioContext',
  'createInnerAudioContext',
  'createCameraContext',
  'createLivePusherContext',
  'createLivePlayerContext',
  'createVideoContext',
  'createAnimation',
  'createWorker',
  'createIntersectionObserver',
  'createSelectorQuery',
  'createMapContext',
  'createCanvasContext'
]

const arrToObj = arr => {
  let obj = {}
  arr.forEach(val => {
    obj[val] = 1
  })
  return obj
}

/**
 * 将函数 promise 化
 * @param {function} method
 * @returns {function}
 */
const promisify = method => {
  return (options, ...params) => {
    return new Promise((resolve, reject) => {
      method(
        Object.assign({}, options, {
          success: resolve,
          fail: reject
        }),
        ...params
      )
    })
  }
}

const shouldPromisify = (methodName, methods) => {
  const noPromisifyMethodsRe = /^(on)|^(pause)|(Sync)$|(Manager)$/g
  return !(noPromisifyMethodsRe.test(methodName) || methods[methodName] === 1)
}

const promisifyWxApi = () => {
  const methods = {}
  const noPromisifyMethodsMap = arrToObj(noPromisifyMethods)
  Object.keys(wx).forEach(key => {
    if (
      typeof wx[key] === 'function' &&
      shouldPromisify(key, noPromisifyMethodsMap)
    ) {
      methods[key] = promisify(wx[key])
    }
  })
  return methods
}

const promiseMethods = promisifyWxApi()

export default promiseMethods
