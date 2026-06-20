chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

chrome.action.onClicked.addListener(() => {
  chrome.sidePanel.setOptions({
    path: '/html/sidepanel.html',
    enabled: true
  })
})
