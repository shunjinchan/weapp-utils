/*
 * @Author: shunjinchan
 * @Date: 2018-09-22 09:58:30
 * @Last Modified by: shunjinchan
 * @Last Modified time: 2018-10-13 16:33:25
 * 封装 wx.storage
 * 通过该模块 set 的数据，存储的都是对象
 * 格式：{ key: 'keyValue', data: { expire: 123456, data: 'dataValue' } }
 */

import wxApi from './wxApiPromisify'

const getCurrentTime = () => new Date().getTime()
const getExpires = expires => getCurrentTime() + expires * 1000

/**
 * 异步保存值到本地存储
 * @param {String} key     需要保存的键名
 * @param {Object|String|Array|Boolean} value  需要保存的值
 * @param {Number} [expires] 存储的过期时间，时间单位秒
 * @returns {promise}
 */
export const setStorage = (key, value, expires) => {
  const data = { value }

  if (expires) data.expires = getExpires(expires)

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

  if (expires) data.expires = getExpires(expires)

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
export const removeStorage = key => {
  return wxApi.removeStorage(key)
}

/**
 * 删除一个本地存储
 * @param  {String} key 需要删除的key
 */
export const removeStorageSync = key => {
  try {
    wx.removeStorageSync(key)
  } catch (err) {
    console.warn('removeStorageSync fail:  ' + err)
  }
}

const isExpired = expires => {
  return expires && /^\d{13}$/.test(expires) && expires <= getCurrentTime()
}

/**
 * 需要获取的本地存储
 * @param  {String} key 对应的key
 * @return {Object|String|Array|Boolean}  返回值
 */
export const getStorageSync = key => {
  let data = {}

  try {
    data = wx.getStorageSync(key)
  } catch (err) {
    console.warn('getStorageSync fail:  ' + err)
  }

  // 兼容处理
  if (data === null || typeof data === 'undefined') data = {}

  // 如果 value 不存在，默认是空字符串
  const { expires, value = '' } = data

  // 过期了返回空字符串
  if (isExpired(expires)) {
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
export const getStorage = key => {
  return new Promise((resolve, reject) => {
    wx.getStorage(key)
      .then(data => {
        // 兼容处理
        if (data === null || typeof data === 'undefined') data = {}

        // 如果 value 不存在，默认是空字符串
        let { expires, value = '' } = data

        // 过期了返回空字符串
        if (isExpired(expires)) {
          removeStorageSync(key)
          value = ''
        }
        resolve(value)
      })
      .catch(err => reject(err))
  })
}
