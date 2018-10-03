/*
 * @Author: shunjinchan
 * @Date: 2018-09-22 09:58:30
 * @Last Modified by: shunjinchan
 * @Last Modified time: 2018-09-25 19:42:25
 * 封装 wx.storage
 */

import wxApi from './wxApiPromisify'

const getCurrentTime = () => {
  return new Date().getTime()
}

/**
* 异步保存值到本地存储
* @param {String} key     需要保存的键名
* @param {Object|String|Array|Boolean} value  需要保存的值
* @param {Number} [expires] 存储的过期时间，时间单位秒
* @returns {promise}
*/
export const setStorage = (key, value, expires) => {
  const data = { value }

  if (expires) {
    data.expire = getCurrentTime() + expires * 1000
  }

  return wxApi.setStorage({
    key: key,
    data: data
  })
}

/**
* 同步保存值到本地存储
* @param {String} key     需要保存的键名
* @param {Object|String|Array|Boolean|Number} value  需要保存的值
* @param {Number} [expires] 存储的过期时间
*/
export const setStorageSync = (key, value, expires) => {
  const data = { value }

  if (expires) {
    data.expire = getCurrentTime() + expires * 1000
  }

  try {
    wx.setStorageSync(key, data)
  } catch (err) {
    console.warn('setStorageSync fail:  ' + err)
  }
}

/**
 * 删除一个本地存储
 * @param  {String} key 需要删除的key
 */
export const removeStorage = (key) => {
  return wxApi.removeStorage(key)
}

/**
 * 删除一个本地存储
 * @param  {String} key 需要删除的key
 */
export const removeStorageSync = (key) => {
  try {
    wx.removeStorageSync(key)
  } catch (err) {
    console.warn('removeStorageSync fail:  ' + err)
  }
}

/**
 * 需要获取的本地存储
 * @param  {String} key 对应的key
 * @return {Object|String|Array|Boolean}  返回值
 */
export const getStorageSync = (key) => {
  let data = {}

  try {
    data = wx.getStorageSync(key)
  } catch (err) {
    console.warn('getStorageSync fail:  ' + err)
  }

  // 兼容处理
  if (data === null || typeof data === 'undefined') data = {}

  // 如果 value 不存在，默认是空字符串
  const { expire, value = '' } = data

  // 过期了返回空字符串
  if (expire && /^\d{13}$/.test(expire) && expire <= getCurrentTime()) {
    removeStorageSync(key)
    return ''
  }

  return value
}

/**
 * 需要获取的本地存储
 * @param  {String} key 对应的key
 * @return {Promise}  返回值
 */
export const getStorage = (key) => {
  return new Promise((resolve, reject) => {
    wx.getStorageSync(key).then(data => {
      // 兼容处理
      if (data === null || typeof data === 'undefined') data = {}

      // 如果 value 不存在，默认是空字符串
      const { expire, value = '' } = data

      // 过期了返回空字符串
      if (expire && /^\d{13}$/.test(expire) && expire <= getCurrentTime()) {
        removeStorageSync(key)
        resolve('')
      }
      resolve(value)
    })
  })
}
