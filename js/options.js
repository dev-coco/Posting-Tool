const publicSheetUrl = document.getElementById('public-sheet-url')
const customSheetUrl = document.getElementById('custom-sheet-url')
const postSheetUrl = document.getElementById('post-sheet-url')
const apiUrl = document.getElementById('api-url')
const messengerUrl = document.getElementById('messenger-url')
const nameSelect = document.getElementById('name-select')
const team = document.getElementById('team')
const getUserListBtn = document.getElementById('get-user-list')
const obfuscation = document.getElementById('obfuscation')

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

getUserListBtn.addEventListener('click', async () => {
  if (!postSheetUrl.value) {
    notify('请先设置填表链接')
    return
  }
  const param = {
    action: 'getList',
    sheetUrl: postSheetUrl.value
  }
  notify('正在获取名单')
  fetch(apiUrl.value, {
    body: JSON.stringify(param),
    method: 'POST'
  })
    .then(response => response.json())
    .then(json => {
      notify('已获取名单')
      nameSelect.innerHTML = ''
      const option = document.createElement('option')
      option.value = ''
      option.text = '请选择名字'
      nameSelect.appendChild(option)

      json.forEach(item => {
        const option = document.createElement('option')
        option.value = item[0]
        option.text = item[1]
        nameSelect.appendChild(option)
      })
      notify('请选择你的名字')
    })
})

publicSheetUrl.addEventListener('change', () => {
  chrome.storage.local.set({ publicSheetUrl: publicSheetUrl.value })
})
customSheetUrl.addEventListener('change', () => {
  chrome.storage.local.set({ customSheetUrl: customSheetUrl.value })
})
postSheetUrl.addEventListener('change', () => {
  chrome.storage.local.set({ postSheetUrl: postSheetUrl.value })
})
apiUrl.addEventListener('change', () => {
  chrome.storage.local.set({ apiUrl: apiUrl.value })
})
messengerUrl.addEventListener('change', () => {
  chrome.storage.local.set({ messengerUrl: messengerUrl.value })
})
team.addEventListener('change', () => {
  chrome.storage.local.set({ team: team.value })
})
obfuscation.addEventListener('change', () => {
  chrome.storage.local.set({ obfuscation: obfuscation.checked })
})
nameSelect.addEventListener('change', () => {
  chrome.storage.local.set({
    nameCode: nameSelect.value,
    nameSelect: nameSelect.options[nameSelect.selectedIndex].text
  })
})

chrome.storage.local.get(null, config => {
  publicSheetUrl.value = config.publicSheetUrl || ''
  customSheetUrl.value = config.customSheetUrl || ''
  postSheetUrl.value = config.postSheetUrl || ''
  apiUrl.value = config.apiUrl || ''
  messengerUrl.value = config.messengerUrl || ''
  obfuscation.checked = config.obfuscation || false
  team.value = config.team || ''
  if (config.nameSelect) {
    const option = document.createElement('option')
    option.value = config.nameCode
    option.text = config.nameSelect
    nameSelect.appendChild(option)
    nameSelect.value = config.nameCode
  }
})
