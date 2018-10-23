/*
 * @Author: shunjinchan
 * @Date: 2018-10-03 07:18:38
 * @Last Modified by: shunjinchan
 * @Last Modified time: 2018-10-17 15:15:40
 * 全局状态管理
 */

let linkId = 0

/**
 * 将对象字符串路径转换成数组形式
 * @param {string} path
 */
const getPath = path => {
  // 替换 [、].、] 为 .
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
  let data = {}
  // 多次调用 setData 合并为一次
  Object.keys(state).forEach(key => {
    data = Object.assign(data, {
      [key]: JSON.parse(JSON.stringify(state[key]))
    })
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
    this.pages = [] // 页面对象数组
  }

  /**
   * 关联页面，默认将所有全局数据映射给页面 data
   * 如果页面 data 对象中的属性与 state 对象中的属性相同，使用 state 对象中的属性覆盖
   * @param {object} ctx 小程序页面对象
   * @param {[string]} 要映射的状态的 key 值数组，不传该参数的话，默认是将所有的状态都映射到页面数据中
   */
  mapState(ctx, keys = []) {
    if (typeof ctx === 'undefined') {
      throw new Error('mapState 方法的第一个参数必传')
    }

    if (typeof ctx.onLoad !== 'function') {
      throw new Error('请确定 mapState 方法的第一个参数是页面对象')
    }

    // 避免重复关联
    if (ctx && !ctx.data.__linkId__) {
      linkId = linkId + 1
      // 选择性映射状态
      if (keys && keys.length > 0) {
        let data = { __linkId__: linkId }
        this.pages.push({ ctx: ctx, keys: keys })
        keys.forEach(stateKey => {
          data = Object.assign(data, { [stateKey]: this.state[stateKey] })
        })
        setState(ctx, data)
      } else {
        this.pages.push({ ctx: ctx })
        setState(ctx, Object.assign({ __linkId__: linkId }, this.state))
      }
    }
  }

  /**
   * 更新状态，想要更新全局对象，必须通过 setState 方法
   * @param {object} newState
   */
  setState(newState) {
    Object.keys(newState).forEach(key => {
      const path = getPath(key)
      // 检查初始化时有没有该状态
      if (this.state.hasOwnProperty(path[0])) {
        const value = newState[key]
        updateByPath(this.state, path, value) // 更新全局 state，保证新的页面关联时能够得到最新的 state
        console.log(
          `%c===== set「${path}」state: ===== %o`,
          'color: #00896c',
          value
        )
      } else {
        delete newState[path]
        throw new Error(
          `状态（第一级属性）必须在初始化时就已经声明好：key path：${path}`
        )
      }
    })

    // 同步各页面的状态
    this.pages.forEach(page => {
      // 选择性映射的页面
      if (page.keys && page.keys.length > 0) {
        let data = {}
        // 当前更新的状态与每个页面所映射的状态做比对，有映射关系的页面就更新
        page.keys.forEach(pageStateKey => {
          Object.keys(newState).forEach(key => {
            // 路径的第一级属性值与 pageStateKey(页面映射的状态 key) 对比
            if (getPath(key)[0] === pageStateKey) {
              data = Object.assign(data, { [key]: newState[key] })
            }
          })
        })
        setState(page.ctx, data)
      } else {
        // 没选择性映射的页面直接将所有的新状态赋值过去
        setState(page.ctx, newState)
      }
    })
  }
}
