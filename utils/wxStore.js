/*
 * @Author: shunjinchan
 * @Date: 2018-10-03 07:18:38
 * @Last Modified by: shunjinchan
 * @Last Modified time: 2018-10-07 23:31:33
 * 全局状态管理
 * 目的：同步一下全局变量所绑定的视图
 * 为什么要加找个模块：
 * 1、app 里面的数据无法与其他引用该数据的页面联动
 * 2、无论是 redux、mobx 都过于复杂，改造成本过大。且与小程序本身的开发范式差别比较大
 * 3、痛点主要是：跨页通讯与状态联动更新
 * 注意：这里只保存应用全局数据，页面数据不要放这里
 * 用法：在页面的 onload 事件中使用 link 方法进行数据关联，这样页面就可以拿到全局数据，并且当使用 setState 改变全局数据时，做了绑定操作的页面的数据与视图也会相应发生变化
 */

let linkId = 0

/**
 * 将对象字符串路径转换成数组形式
 * @param {string} path
 */
const getPath = path => {
  let arr = path.replace(/\[|(].)|\]/g, '.').split('.')
  if (arr[arr.length - 1] === '') arr.pop() // 处理空白字符
  return arr
}

/**
 * 更新 state
 * @param {object} object state
 * @param {string} path state path
 * @param {any} value val
 */
const updateByPath = (object, path, value) => {
  let current = object

  for (let i = 0, len = path.length; i < len; i++) {
    if (i === len - 1) {
      current[path[i]] = JSON.parse(JSON.stringify(value))
    } else {
      current = current[path[i]]
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
  constructor(initState) {
    this.state = initState
    this.subs = [] // 页面对象数组
  }

  /**
   * 关联页面，默认将所有全局数据映射给页面 data
   * 如果页面 data 对象中的属性与 state 对象中的属性相同，使用 state 对象中的属性覆盖
   * @param {object} ctx 小程序页面对象
   * @param {array} 要映射的状态的 key 值数组
   */
  mapState(ctx, keys = []) {
    // 避免重复关联
    if (ctx && !ctx.data.__linkId__) {
      linkId = linkId + 1
      ctx.setData({ __linkId__: linkId })
      // 选择性映射状态
      if (keys && keys.length > 0) {
        const data = {}
        keys.forEach(stateKey => {
          Object.assign(data, { [stateKey]: this.state[stateKey] })
        })
        this.subs.push({ ctx: ctx, keys: keys, __linkId__: linkId })
        setState(ctx, data)
      } else {
        this.subs.push({ ctx: ctx, __linkId__: linkId })
        setState(ctx, this.state)
      }
    }
  }

  /**
   * 更新状态，想要更新全局对象，必须通过 setState 方法
   * @param {object} param
   */
  setState(param) {
    Object.keys(param).forEach(key => {
      const path = getPath(key)
      // 检查初始化时有没有该状态
      if (this.state.hasOwnProperty(path[0])) {
        const value = param[key]
        console.log(`set「${path}」state: `, value)
        updateByPath(this.state, path, value) // 更新全局 state，保证新的页面关联时能够得到最新的 state
      } else {
        delete param[path]
        throw new Error(
          `状态（第一级属性）必须在初始化时就已经声明好：key path：${path}`
        )
      }
    })

    // 同步各页面的状态
    this.subs.forEach(sub => {
      // 选择性映射
      if (sub.keys && sub.keys.length > 0) {
        const data = {}
        // 当前更新的状态与每个页面所映射的状态做比对，有映射关系的页面就更新
        sub.keys.forEach(stateKey => {
          Object.keys(param).forEach(key => {
            if (getPath(key)[0] === stateKey) {
              Object.assign(data, { [key]: param[key] })
            }
          })
        })
        setState(sub.ctx, data)
      } else {
        setState(sub.ctx, param)
      }
    })
  }
}
