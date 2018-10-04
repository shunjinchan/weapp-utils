/*
 * @Author: shunjinchan
 * @Date: 2018-10-03 07:18:38
 * @Last Modified by: shunjinchan
 * @Last Modified time: 2018-10-04 15:35:03
 * 全局状态管理
 * 目的：同步一下全局变量所绑定的视图
 * 为什么要加找个模块：
 * 1、app 里面的数据无法与其他引用该数据的页面联动
 * 2、无论是 redux、mobx 都过于复杂，改造成本过大。且与小程序本身的开发范式差别比较大
 * 3、痛点主要是：跨页通讯与状态联动更新
 * 注意：这里只保存应用全局数据，页面数据不要放这里
 * 用法：在页面的 onload 事件中使用 link 方法进行数据关联，这样页面就可以拿到全局数据，并且当使用 setState 改变全局数据时，做了绑定操作的页面的数据与视图也会相应发生变化
 */

let linkId = 1
let state = {}
const subs = [] // 页面对象数组

/**
 * 更新 state
 * @param {object} object state
 * @param {string} path state path
 * @param {any} value val
 */
const updateByPath = (object, path, value) => {
  let arr = path.replace(/\[|(].)|\]/g, '.').split('.')
  let current = object

  if (arr[arr.length - 1] === '') arr.pop() // 处理空白字符
  // 要求在创建实例之前，就声明所有的根级属性
  if (!object.hasOwnProperty(arr[0])) {
    throw new Error('setState 方法只允许设置初始化 store 中的第一级已提前定义好的数据')
  }

  for (let i = 0, len = arr.length; i < len; i++) {
    if (i === len - 1) {
      current[arr[i]] = JSON.parse(JSON.stringify(value))
    } else {
      current = current[arr[i]]
    }
  }
}

/**
 * 同步状态
 * @param {object} ctx 小程序页面对象
 * @param {object} state 全局状态
 */
const setState = (ctx, state) => {
  const data = {}
  // 多次调用 setData 合并为一次
  Object.keys(state).forEach(key => {
    Object.assign(data, { [key]: JSON.parse(JSON.stringify(state[key])) })
  })
  ctx.setData(data)
}

export default class Store {
  /**
   * 初始化
   * @param {object} state 全局状态
   */
  constructor (initState) {
    state = initState
  }

  /**
   * 关联页面
   * 如果页面 data 对象中的属性与 state 对象中的属性相同，使用 state 对象中的属性覆盖
   * @param {object} ctx 小程序页面对象
   */
  link (ctx) {
    // 避免重复关联
    if (ctx && !ctx.data.__linkId__) {
      subs.push(ctx)
      ctx.setData({ __linkId__: linkId++ })
      subs.forEach(ctx => setState(ctx, state)) // 同步各页面的状态
    }
  }

  /**
   * 取消关联
   * @param {object} ctx 小程序页面对象
   */
  unlink (ctx) {
    subs.forEach((sub, index) => {
      if (ctx.data.__linkId__ === sub.data.__linkId__) {
        subs.splice(index, 1)
        ctx.setData({ __linkId__: null })
      }
    })
  }

  /**
   * 更新状态，想要更新全局对象，必须通过 setState 方法
   * @param {object} param
   */
  setState (param) {
    Object.keys(param).forEach((key) => {
      const path = key
      const value = param[key]
      if (
        path !== undefined &&
        value !== undefined &&
        typeof path === 'string'
      ) {
        console.log(`set「${path}」state: `, value)
        updateByPath(state, path, value) // 更新全局 state，保证新的页面关联时能够得到最新的 state
      } else {
        delete param[path]
      }
    })
    subs.forEach(ctx => setState(ctx, param)) // 同步各页面的状态
  }
}
