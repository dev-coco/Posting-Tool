let imageBlob = null
let hasPastedText = false

/**
 * @description 将 base64 编码的 Data URL 字符串转换为 Blob 对象
 * @param {string} base64Data - base64 编码的字符串
 * @returns {Blob} 解码后的 Blob 对象，包含原始二进制数据及 MIME 类型
 */
const base64ToBlob = base64Data => {
  // dataURL 格式：data:[mimeType];base64,[data]
  const [header, base64String] = base64Data.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'

  // 解码 base64
  const byteString = atob(base64String)
  const len = byteString.length
  const uint8Array = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }
  return new Blob([uint8Array], { type: mime })
}

chrome.runtime.onMessage.addListener(async message => {
  if (message.type === 'START_PROCESS') {
    // 重置状态
    hasPastedText = false
    try {
      // 将 base64 格式的图片转换成 blob
      imageBlob = base64ToBlob(message.imagebase64)
    } catch (error) {
      console.error('图片加载失败', error.message)
    }
  }
})

window.addEventListener('paste', async () => {
  if (!hasPastedText && imageBlob) {
    // 第一次检测到粘贴文本事件
    try {
      // 将图片写入剪贴板
      const item = new ClipboardItem({ [imageBlob.type]: imageBlob })
      await navigator.clipboard.write([item])
      hasPastedText = true
    } catch (error) {
      console.error('写入图片失败', error.message)
    }
  }
})
