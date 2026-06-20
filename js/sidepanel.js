// 功能切换
const switchToRandomBtn = document.getElementById('random-mode-btn')
const switchToListBtn = document.getElementById('list-mode-btn')
const repostRecordBtn = document.getElementById('repost-mode-btn')

// 随机生成-选择话题
const topicSelect = document.getElementById('topic-select')
// 随机生成-随机生成按钮
const generateBtn = document.getElementById('generate-btn')

// 自定模版-选择话题
const topicSelectCustom = document.getElementById('topic-select-custom')
// 自定模版-引导语列表
const listModeContainer = document.getElementById('list-mode-container')
// 自定模版-引导语列表
const promptList = document.getElementById('prompt-list')

// 复制内容按钮
const copyBtn = document.getElementById('copy-btn')
// 填表链接
const postLinkInput = document.getElementById('post-link')
// 提交按钮
const submitBtn = document.getElementById('submit-post-link')

// 预览图片
const previewImage = document.getElementById('preview-image')
// 预览引导语
const previewTextDisplay = document.getElementById('preview-text-display')

// 正在使用的内容
let activeContent = {}
// 配置信息
let config
// 发帖资源
const source = {}

// 图片清单
let imageList
// 当前图片索引
let currentImageIndex = 0

/**
 * @description 通知
 * @param {string} text - 文本
 */
const notify = text => {
  Toastify({
    text,
    duration: 2000,
    close: true,
    gravity: 'bottom',
    position: 'left',
    style: {
      background: '#FF69B4',
      color: 'white',
      fontSize: '18px'
    }
  }).showToast()
}

/**
 * @description 创建 tooltip
 * @param {HTMLElement} element - 需要绑定的元素
 * @param {string} content - 显示文本
 */
const show = (element, content, imageUrl) => {
  tippy(element, {
    content: content + `<hr><img style="display: block; margin: 0 auto;" src="${imageUrl}">`,
    allowHTML: true,
    onShow (instance) {
      const contentEl = instance.popper.querySelector('.tippy-content')
      contentEl.style.whiteSpace = 'pre-line'
    }
  })
}

/**
 * @description 图片链接格式化
 * @param {string} url - 图片链接
 * @param {number} type - 格式化类型
 *   1 - 预览图片链接
 *   2 - 原始图片链接
 *   3 - 图片末尾 6 位
 *   其它 - 图片 ID
 * @returns {string} 格式化后的链接（根据 type 返回不同类型的 URL）
 */
const imageUrlFormat = (url, type) => {
  const imageId = url.replace(/.+\/d\/|\/view.*|\?usp.+|.usp.+|.+\?id=/g, '')
  if (type === 1) {
    // 预览链接
    return `https://drive.google.com/thumbnail?id=${imageId}`
  } else if (type === 2) {
    return `https://lh3.googleusercontent.com/d/${imageId}`
  } else if (type === 3) {
    return imageId.slice(-6)
  } else {
    return imageId
  }
}

/**
 * @description 随机生成数字
 * @param {number} n - 最小值
 * @param {number} m - 最大值
 * @returns {number} 随机数
 */
const getRandom = (n, m) => Math.floor(Math.random() * (m - n + 1) + n)

/**
 * @description 将任意图片格式的 Blob 转换为 PNG 格式的 Blob
 * @param {Blob} blob - 原始图片 Blob 数据
 * @returns {Promise<Blob>} 转换后的 PNG 格式 Blob
 */
const convertBlobToPng = async blob => {
  return new Promise((resolve, reject) => {
    // 创建 FileReader 读取 Blob
    const reader = new FileReader()
    reader.onload = () => {
      // 创建 Image 加载读取的数据
      const img = new Image()
      img.onload = () => {
        // 创建 Canvas 并绘制图像
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        // 导出 PNG Blob
        canvas.toBlob(pngBlob => {
          if (pngBlob) {
            resolve(pngBlob)
          } else {
            reject(new Error('PNG 转换失败'))
          }
        }, 'image/png')
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('读取 Blob 失败'))
    reader.readAsDataURL(blob)
  })
}

/**
 * @description 将 Blob 数据转换为 base64 编码的 Data URL 字符串
 * @param {Blob} blob - 要转换的 Blob 对象
 * @returns {Promise<string>} base64 编码的 Data URL
 */
const blobToBase64 = blob => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result) // 结果是类似 data:xxx/xxx;base64,xxxx
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * @description 获取转发帖原始贴文链接
 * @param {string} postLink - 贴文链接
 * @returns {Promise<string>} 原帖链接或“不是转发帖”的提示
 */
async function repostLink (postLink) {
  const text = await fetch(postLink, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
    }
  }).then(response => response.text())
  const postId = text.match(/(?<=post_id":").*?(?=")/g)[0]
  const ids = text.match(/(?<=is_synced_qa_post":false,"subscription_target_id":").*?(?=")/g) || []
  const repostId = ids.filter(x => x !== postId)
  if (repostId.length === 0) {
    return '不是转发帖'
  } else {
    return `https://www.facebook.com/${repostId[0]}`
  }
}

// 模式切换
function switchMode (mode) {
  ;['random-mode', 'list-mode', 'repost-mode'].forEach(item => {
    document.getElementById(`${item}-btn`).classList.remove('active')
    ;[...document.getElementsByClassName(item)].map(x => x.classList.add('hidden'))
  })
  document.getElementById(`${mode}-btn`).classList.add('active')
  ;[...document.getElementsByClassName(mode)].map(x => x.classList.remove('hidden'))
  populatePromptList()
}

// 初始化
async function init () {
  // 获取配置
  config = await new Promise(resolve => chrome.storage.local.get(null, c => resolve(c)))
  // 检查配置是否完善
  if (!config.team || !config.nameCode || !config.apiUrl || !(config.customSheetUrl || config.publicSheetUrl) || !config.postSheetUrl) {
    return notify('请先到通用设置里配置完成后再使用。')
  }
  // 解决 Toastify 样式 bug
  await new Promise(resolve => setTimeout(resolve, 10))
  // 自定义资源表
  if (config.customSheetUrl) {
    const param = {
      action: 'customSheet',
      sheetUrl: config.customSheetUrl
    }
    notify('正在个人获取资源表')
    fetch(config.apiUrl, {
      body: JSON.stringify(param),
      method: 'POST'
    })
      .then(response => response.json())
      .then(json => {
        notify('个人资源表获取完成')
        // 储存数据
        source.customTopic = json
        // 设置菜单
        Object.keys(json).forEach(item => {
          const option = document.createElement('option')
          option.value = item
          option.text = item
          topicSelectCustom.appendChild(option)
        })
      })
  }
  // 公用资源表
  if (config.publicSheetUrl) {
    const param = {
      action: 'publicSheet',
      sheetUrl: config.publicSheetUrl
    }
    notify('正在公用获取资源表')
    fetch(config.apiUrl, {
      body: JSON.stringify(param),
      method: 'POST'
    })
      .then(response => response.json())
      .then(json => {
        notify('公用资源表获取完成')
        // 储存资源
        source.publicTopic = json
        Object.keys(json).forEach(item => {
          const option = document.createElement('option')
          option.value = item
          option.text = item
          topicSelect.appendChild(option)
        })
      })
  }
}
init()

// 加载引导语列表
function populatePromptList () {
  // 自定义类型
  const topic = topicSelectCustom.value
  if (!topic) return
  // 获取指定类型的内容
  const templatesForTopic = source.customTopic[topic] || []
  // 清空引导语列表
  promptList.innerHTML = ''

  if (templatesForTopic.length === 0) {
    promptList.innerHTML = '<div class="prompt-item"><div class="prompt-text">该话题下暂无模板</div></div>'
    return
  }

  templatesForTopic.forEach(template => {
    const [sourceDate, link, type, title, transText, origText, imageUrl] = template
    // 创建元素
    const item = document.createElement('div')
    item.className = 'prompt-item'
    const text = document.createElement('div')
    text.className = 'prompt-text'
    text.textContent = transText
    item.appendChild(text)
    // 显示 tooltip
    show(item, `${title}\n${transText}`, imageUrlFormat(imageUrl[0], 1))
    // 设置点击监听事件
    item.addEventListener('click', () => {
      // 记录当前正在使用的内容
      activeContent = { sourceDate, link, type, title, transText, origText, imageUrl }
      // 引导语预览
      previewTextDisplay.textContent = transText
      // 引导语清单
      imageList = imageUrl
      currentImageIndex = 0
      activeContent.imageUrl = imageList[0]
      // 图片预览
      previewImage.src = imageUrlFormat(imageUrl[0], 1)
      document.querySelectorAll('.prompt-item.selected').forEach(el => el.classList.remove('selected'))
      item.classList.add('selected')
    })
    promptList.appendChild(item)
  })
}

// 生成随机内容
function generateContent () {
  // 选择的类型
  const topic = topicSelect.value
  // 获取指定类型的内容
  const templates = source.publicTopic[topic]
  if (!templates || templates.length === 0) {
    return
  }

  // 如果只有 1 条数据，直接使用这条数据
  if (templates.length === 1) {
    const randomTemplate = templates[0]
    // 解构数组，分别获取各个字段
    const [sourceDate, link, type, title, transText, origText, imageUrl] = randomTemplate
    // 记录当前正在使用的内容
    activeContent = { sourceDate, link, type, title, transText, origText, imageUrl }
    // 引导语预览
    previewTextDisplay.textContent = transText
    // 图片清单
    imageList = imageUrl
    // 默认显示第一张图片
    currentImageIndex = 0
    activeContent.imageUrl = imageList[0]
    // 家在预览图片
    previewImage.src = imageUrlFormat(imageList[0], 1)
    return
  }

  // 如果模板有多条，根据日期进行加权抽取
  const today = new Date()
  // 存储每个内容的权重
  const weights = []
  // 权重总和
  let totalWeight = 0

  // 遍历每一个内容，计算权重
  templates.forEach(template => {
    // 引导语日期
    const contentDate = new Date(template[0])

    if (isNaN(contentDate.getTime())) {
      // 如果日期无效，给最低权重
      const defaultWeight = 0.01
      weights.push(defaultWeight)
      totalWeight += defaultWeight
      return
    }

    // 计算当前日期与引导语日期之间的天数差
    const diffTime = today.getTime() - contentDate.getTime()
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

    /**
     * 权重算法
     * 1 / (天数 + 1) ^ 2
     * 越新的引导语权重越高，越容易被选中
     */
    const weight = 1 / Math.pow(diffDays + 1, 2)
    weights.push(weight)
    totalWeight += weight
  })

  /**
   * 抽取逻辑
   * 根据权重选中一个权重登记
   * 再从该权重登记的引导语中随机抽取一条
   */
  // 在总权重范围内取一个随机数
  const randomNumber = Math.random() * totalWeight
  // 保存同一权重的所有引导语索引
  const selectedIndices = []
  // 累积权重
  let cumulativeWeight = 0

  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i]
    if (randomNumber <= cumulativeWeight) {
      // 找到第一个符合条件的引导语索引
      const selectedWeight = weights[i]
      // 收集所有与当前权重相同的索引
      // 可能有浮点数误差，给定一个极小容差 1e-9
      for (let j = 0; j < weights.length; j++) {
        if (Math.abs(weights[j] - selectedWeight) < 1e-9) {
          selectedIndices.push(j)
        }
      }
      break
    }
  }

  let finalIndex
  if (selectedIndices.length > 0) {
    // 在同一权重等级中随机挑选一个索引
    const randomIndex = Math.floor(Math.random() * selectedIndices.length)
    finalIndex = selectedIndices[randomIndex]
  } else {
    // 容错处理：如果没找到合适的索引，就随便抽一个
    finalIndex = Math.floor(Math.random() * templates.length)
  }

  // 最终选中的引导语
  const randomTemplate = templates[finalIndex]
  const [sourceDate, link, type, title, transText, origText, imageUrl] = randomTemplate

  // 记录当前正在使用的内容
  activeContent = { sourceDate, link, type, title, transText, origText, imageUrl }
  // 引导语预览
  previewTextDisplay.textContent = transText
  imageList = imageUrl
  currentImageIndex = 0
  activeContent.imageUrl = imageList[0]
  // 图片预览
  previewImage.src = imageUrlFormat(imageList[0], 1)
}

// 事件监听
switchToRandomBtn.addEventListener('click', () => switchMode('random-mode'))
switchToListBtn.addEventListener('click', () => switchMode('list-mode'))
repostRecordBtn.addEventListener('click', () => switchMode('repost-mode'))
generateBtn.addEventListener('click', generateContent)

topicSelectCustom.addEventListener('change', () => {
  if (!listModeContainer.classList.contains('hidden')) {
    populatePromptList()
  }
})

// 切换图片按钮
document.getElementById('prev-image').addEventListener('click', () => {
  if (imageList.length <= 1) return
  currentImageIndex = (currentImageIndex - 1 + imageList.length) % imageList.length
  const imageUrl = imageUrlFormat(imageList[currentImageIndex], 1)
  activeContent.imageUrl = imageUrl
  previewImage.src = imageUrl
})

document.getElementById('next-image').addEventListener('click', () => {
  if (imageList.length <= 1) return
  currentImageIndex = (currentImageIndex + 1) % imageList.length
  const imageUrl = imageUrlFormat(imageList[currentImageIndex], 1)
  activeContent.imageUrl = imageUrl
  previewImage.src = imageUrl
})

// 复制内容按钮
copyBtn.addEventListener('click', async () => {
  // 获取当前正在使用的分页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  try {
    const param = {
      source: config.nameCode, // 用户代码
      img: imageUrlFormat(activeContent.imageUrl, 3), // 图片代码
      num: getRandom(0, 1000000), // 随机代码
      team: config.team
    }
    // 完整链接
    const fullLink = `${activeContent.link.trim()}?${new URLSearchParams(param).toString()}`
    const messageFullLink = `${config.messengerUrl.trim()}${new URLSearchParams(param).toString()}`.replaceAll('&', '-')
    // 储存到正在使用的内容
    activeContent.fullLink = fullLink
    let fullContent = activeContent.origText
    if (config.obfuscation) {
      fullContent = encodeText(fullContent, uuid())
    }
    // 拼接完整内容
    if (fullContent.includes('{messenger}')) {
      fullContent = fullContent.replace('{messenger}', ` ${messageFullLink} `)
      // fullContent = fullContent.replace('{messenger}', ` ${config.messengerUrl} `)
    }
    if (fullContent.includes('{website}')) {
      fullContent = fullContent.replace('{website}', ` ${fullLink} `)
    } else {
      fullContent = `${fullContent.trim()}\n${fullLink}`
    }
    // 将文本写入剪切板
    const textItem = new ClipboardItem({
      'text/plain': new Blob([fullContent], { type: 'text/plain' })
    })
    await navigator.clipboard.write([textItem])
    // 下载图片
    const res = await fetch(imageUrlFormat(activeContent.imageUrl, 2))
    // 获取图片 Blob，转换 png 格式
    const imageBlob = await convertBlobToPng(await res.blob())
    // 转换 base64
    const imagebase64 = await blobToBase64(imageBlob)
    // 发送文本和图片链接给 content script
    chrome.tabs.sendMessage(tab.id, {
      type: 'START_PROCESS',
      text: fullContent,
      imagebase64
    })
    notify('已复制')
  } catch (error) {
    console.error(error.message)
    notify(`❌ 复制文本失败\n${error.message}`)
  }
})

// 提交按钮
submitBtn.addEventListener('click', async () => {
  const postLink = postLinkInput.value
  const type = document.getElementsByClassName('mode-btn active')[0].outerText

  // 检测链接是否规范
  if (!postLink) return
  if (/profile\.php|\/l\.php/gi.test(postLink)) {
    return notify('贴文链接格式错误')
  }
  if (!/facebook\.com|pfbid|\/posts\/|permalinks|pending_posts/gi.test(postLink)) {
    return notify('贴文链接格式错误')
  }

  const param = {
    action: 'postSheet',
    sheetUrl: config.postSheetUrl,
    content: {
      user: config.nameSelect,
      origText: '',
      transText: '',
      fullLink: '',
      title: '',
      type: '',
      postLink,
      origPostLink: ''
    }
  }
  if (type === '转发') {
    notify('正在获取原帖链接')
    const origPostLink = await repostLink(postLink)
    if (origPostLink === '不是转发帖') {
      return notify('不是转发帖')
    }
    param.content.origPostLink = origPostLink
  } else {
    if (!activeContent.fullLink) return
    param.content.origText = activeContent.origText.trim()
    param.content.transText = activeContent.transText.trim()
    param.content.fullLink = activeContent.fullLink
    param.content.title = activeContent.title
    param.content.type = activeContent.type
    param.content.postLink = postLink
  }

  notify('正在填表')

  await fetch(config.apiUrl, {
    body: JSON.stringify(param),
    method: 'POST'
  })
    .then(response => response.json())
    .then(json => {
      if (json.status === 'success') {
        notify('填表成功')
        postLinkInput.value = ''
      } else {
        notify('填表失败')
        console.error('填表失败', param)
      }
    })
})

// 生成一个随机的 UUID
function uuid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (str) {
    const randomInt = (Math.random() * 16) | 0
    if (str === 'x') {
      str = randomInt
    } else {
      str = (randomInt & 3) | 8
    }
    return str.toString(16)
  })
}

/**
 * @description 将字节码转换为 Unicode 变体选择符
 * @param {number} byte - 字节码 (0–255)
 * @returns {string|null} - 对应的变体选择符，超出范围时返回 null
 */
function variationSelector (byte) {
  if (byte >= 0 && byte < 16) {
    return String.fromCodePoint(65024 + byte)
  } else if (byte >= 16 && byte < 256) {
    return String.fromCodePoint(917760 + byte - 16)
  } else {
    return null
  }
}

/**
 * @description Fisher-Yates 洗牌算法
 *  - 从数组末尾依次选一个随机位置 j（0 ≤ j ≤ i)
 *  - 将当前位置 i 的元素与 j 位置的元素交换
 *  - 使用按位异或 XOR 交换法
 *  - 元素相同则跳过，避免 XOR 把值变为 0
 * @param {any[]} array - 要打乱的数组
 * @returns {void} - 直接修改原数组，不返回新数组
 */
function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    // 使用位运算交换
    if (array[i] !== array[j]) {
      array[i] ^= array[j]
      array[j] ^= array[i]
      array[i] ^= array[j]
    }
  }
}

/**
 * @description 将文本隐藏在原始文本里（跳过 {website} 和 {messenger}）
 * @param {string} origText - 原始文本
 * @param {string} hiddenText - 要隐藏的文本
 * @returns {string} - 包含隐藏文本的字符串
 */
function encodeText (origText, hiddenText) {
  if (!origText || !hiddenText) return

  const bytes = new TextEncoder().encode(hiddenText)
  const origTextChars = Array.from(origText)
  const origTextLength = origTextChars.length
  const bytesLength = bytes.length

  const selectors = new Array(bytesLength)
  for (let i = 0; i < bytesLength; i++) {
    selectors[i] = variationSelector(bytes[i])
  }

  const skipRanges = []
  const placeholders = ['{website}', '{messenger}']
  for (const ph of placeholders) {
    const phChars = Array.from(ph)
    for (let i = 0; i <= origTextChars.length - phChars.length; i++) {
      let match = true
      for (let j = 0; j < phChars.length; j++) {
        if (origTextChars[i + j] !== phChars[j]) {
          match = false
          break
        }
      }
      if (match) {
        skipRanges.push([i, i + phChars.length - 1])
        i += phChars.length - 1
      }
    }
  }
  function isInSkipRange (idx) {
    return skipRanges.some(([s, e]) => idx >= s && idx <= e)
  }

  if (bytesLength <= origTextLength) {
    const positions = []
    for (let i = 0; i < origTextLength; i++) {
      if (!isInSkipRange(i)) positions.push(i)
    }
    shuffleArray(positions)
    const selectedPositions = positions.slice(0, bytesLength).sort((a, b) => a - b)
    const positionSet = new Set(selectedPositions)

    const result = []
    let byteIndex = 0

    for (let i = 0; i < origTextLength; i++) {
      result.push(origTextChars[i])
      if (positionSet.has(i) && byteIndex < bytesLength) {
        if (selectors[byteIndex]) {
          result.push(selectors[byteIndex])
        }
        byteIndex++
      }
    }
    return result.join('')
  } else {
    const result = []
    let byteIndex = 0

    for (let i = 0; i < origTextLength; i++) {
      result.push(origTextChars[i])
      if (!isInSkipRange(i) && byteIndex < bytesLength) {
        if (selectors[byteIndex]) {
          result.push(selectors[byteIndex])
        }
        byteIndex++
      }
    }

    while (byteIndex < bytesLength) {
      if (selectors[byteIndex]) {
        result.push(selectors[byteIndex])
      }
      byteIndex++
    }

    return result.join('')
  }
}
