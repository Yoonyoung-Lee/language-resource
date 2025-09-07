// Plugin UI logic that runs in the browser context
// This file handles UI interactions and API communication

// Configuration
const API_BASE_URL = 'http://localhost:3001/api' // Change to production URL when deployed

// UI state management
let currentMode: 'suggest' | 'audit' = 'suggest'
let currentSelection: any[] = []
let currentSuggestions: any[] = []

// DOM elements
const suggestModeBtn = document.getElementById('suggest-mode') as HTMLButtonElement
const auditModeBtn = document.getElementById('audit-mode') as HTMLButtonElement
const suggestPanel = document.getElementById('suggest-panel') as HTMLDivElement
const auditPanel = document.getElementById('audit-panel') as HTMLDivElement
const analyzeBtn = document.getElementById('analyze-selection') as HTMLButtonElement
const auditBtn = document.getElementById('audit-document') as HTMLButtonElement
const selectionStatus = document.getElementById('selection-status') as HTMLDivElement
const auditStatus = document.getElementById('audit-status') as HTMLDivElement
const suggestionsContainer = document.getElementById('suggestions-container') as HTMLDivElement
const suggestionsList = document.getElementById('suggestions-list') as HTMLDivElement
const auditResults = document.getElementById('audit-results') as HTMLDivElement
const auditIssues = document.getElementById('audit-issues') as HTMLDivElement
const totalIssuesEl = document.getElementById('total-issues') as HTMLDivElement
const auditScoreEl = document.getElementById('audit-score') as HTMLDivElement

// Event listeners
suggestModeBtn.addEventListener('click', () => setMode('suggest'))
auditModeBtn.addEventListener('click', () => setMode('audit'))
analyzeBtn.addEventListener('click', handleAnalyzeSelection)
auditBtn.addEventListener('click', handleAuditDocument)

// Initialize plugin
init()

function init() {
  console.log('Language Resource Manager UI loaded')
  
  // Listen for messages from the main plugin code
  window.onmessage = (event) => {
    const message = event.data.pluginMessage
    if (message) {
      handlePluginMessage(message)
    }
  }
}

// Handle messages from the main plugin code
function handlePluginMessage(message: any) {
  console.log('Received plugin message:', message)
  
  switch (message.type) {
    case 'set-mode':
      setMode(message.mode)
      break
    case 'selection-data':
      handleSelectionData(message.data, message.message)
      break
    case 'document-data':
      handleDocumentData(message.data)
      break
    case 'suggestion-applied':
      handleSuggestionApplied(message)
      break
    case 'error':
      showError(message.message)
      break
    default:
      console.warn('Unknown plugin message type:', message.type)
  }
}

// Set plugin mode (suggest or audit)
function setMode(mode: 'suggest' | 'audit') {
  currentMode = mode
  
  // Update UI
  if (mode === 'suggest') {
    suggestModeBtn.classList.add('active')
    auditModeBtn.classList.remove('active')
    suggestPanel.classList.remove('hidden')
    auditPanel.classList.add('hidden')
  } else {
    auditModeBtn.classList.add('active')
    suggestModeBtn.classList.remove('active')
    auditPanel.classList.remove('hidden')
    suggestPanel.classList.add('hidden')
  }
}

// Handle selection analysis
async function handleAnalyzeSelection() {
  showStatus(selectionStatus, '선택 요소 확인 중...', 'info')
  analyzeBtn.disabled = true
  suggestionsContainer.classList.add('hidden')
  
  // Request selection data from plugin
  parent.postMessage({ pluginMessage: { type: 'get-selection' } }, '*')
}

// Handle document audit
async function handleAuditDocument() {
  showStatus(auditStatus, '문서 분석 중...', 'info')
  auditBtn.disabled = true
  auditResults.classList.add('hidden')
  
  // Request document data from plugin
  parent.postMessage({ pluginMessage: { type: 'get-document' } }, '*')
}

// Handle selection data received from plugin
async function handleSelectionData(data: any[], message?: string) {
  currentSelection = data
  
  if (data.length === 0) {
    showStatus(selectionStatus, message || '선택된 요소가 없습니다', 'info')
    analyzeBtn.disabled = false
    return
  }
  
  showStatus(selectionStatus, `${data.length}개의 선택된 요소를 분석 중...`, 'info')
  
  try {
    // Call suggest API
    const response = await fetch(`${API_BASE_URL}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection: data, locale: 'ko-KR' })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      currentSuggestions = result.suggestions
      displaySuggestions(result.suggestions)
      showStatus(selectionStatus, `${result.suggestions.length}개의 제안을 찾았습니다`, 'success')
    } else {
      throw new Error(result.error || '제안을 가져오는데 실패했습니다')
    }
  } catch (error) {
    console.error('Failed to get suggestions:', error)
    showStatus(selectionStatus, '선택 요소 분석에 실패했습니다', 'error')
  }
  
  analyzeBtn.disabled = false
}

// Handle document data received from plugin
async function handleDocumentData(data: any) {
  showStatus(auditStatus, '검토 분석 실행 중...', 'info')
  
  try {
    // Call audit API
    const response = await fetch(`${API_BASE_URL}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document: data, locale: 'ko-KR' })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      displayAuditResults(result)
      showStatus(auditStatus, `검토 완료 - ${result.stats.issuesFound}개의 이슈를 발견했습니다`, 'success')
    } else {
      throw new Error(result.error || '검토에 실패했습니다')
    }
  } catch (error) {
    console.error('Failed to audit document:', error)
    showStatus(auditStatus, '문서 검토에 실패했습니다', 'error')
  }
  
  auditBtn.disabled = false
}

// Display suggestions in the UI
function displaySuggestions(suggestions: any[]) {
  suggestionsList.innerHTML = ''
  
  if (suggestions.length === 0) {
    suggestionsList.innerHTML = '<div class="status info">선택한 요소에서 이슈를 발견하지 못했습니다!</div>'
  } else {
    suggestions.forEach(suggestion => {
      const suggestionEl = createSuggestionElement(suggestion)
      suggestionsList.appendChild(suggestionEl)
    })
  }
  
  suggestionsContainer.classList.remove('hidden')
}

// Display audit results in the UI  
function displayAuditResults(audit: any) {
  // Update stats
  totalIssuesEl.textContent = audit.stats.issuesFound.toString()
  auditScoreEl.textContent = audit.summary.overallScore.toString()
  
  // Display issues
  auditIssues.innerHTML = ''
  
  if (audit.issues.length === 0) {
    auditIssues.innerHTML = '<div class="status success">문서에서 이슈를 발견하지 못했습니다!</div>'
  } else {
    audit.issues.forEach((issue: any) => {
      const issueEl = createIssueElement(issue)
      auditIssues.appendChild(issueEl)
    })
  }
  
  auditResults.classList.remove('hidden')
}

// Create a suggestion UI element
function createSuggestionElement(suggestion: any): HTMLElement {
  const el = document.createElement('div')
  el.className = 'suggestion-item'
  
  el.innerHTML = `
    <div class="suggestion-header">
      <div class="suggestion-title">${suggestion.title}</div>
      <div class="suggestion-priority priority-${suggestion.priority}">${suggestion.priority}</div>
    </div>
    <div class="suggestion-description">${suggestion.description}</div>
    ${suggestion.before && suggestion.after ? `
      <div style="font-size: 10px; color: #666; margin: 6px 0;">
        <strong>Before:</strong> "${suggestion.before}"<br>
        <strong>After:</strong> "${suggestion.after}"
      </div>
    ` : ''}
    <div class="suggestion-actions">
          ${suggestion.after ? `
      <button class="button secondary" onclick="applySuggestion('${suggestion.id}', '${suggestion.after}')">
        수정하기
      </button>
    ` : ''}
    <button class="button secondary" onclick="dismissSuggestion('${suggestion.id}')">
      무시
    </button>
    </div>
  `
  
  return el
}

// Create an audit issue UI element
function createIssueElement(issue: any): HTMLElement {
  const el = document.createElement('div')
  el.className = 'suggestion-item'
  
  el.innerHTML = `
    <div class="suggestion-header">
      <div class="suggestion-title">${issue.title}</div>
      <div class="suggestion-priority priority-${issue.priority}">${issue.priority}</div>
    </div>
    <div class="suggestion-description">${issue.description}</div>
    <div style="font-size: 10px; color: #666; margin-top: 6px;">
      <strong>Location:</strong> ${issue.location}<br>
      <strong>Recommendation:</strong> ${issue.recommendation}
    </div>
  `
  
  return el
}

// Apply a suggestion
function applySuggestion(suggestionId: string, newText: string) {
  // Find the suggestion and extract the node ID
  const suggestion = currentSuggestions.find(s => s.id === suggestionId)
  if (!suggestion) return
  
  // Extract node ID from suggestion ID (format: nodeId-type)
  const nodeId = suggestion.id.split('-')[0]
  
  // Send apply message to plugin
  parent.postMessage({ 
    pluginMessage: { 
      type: 'apply-suggestion',
      data: { nodeId, newText }
    }
  }, '*')
}

// Dismiss a suggestion
function dismissSuggestion(suggestionId: string) {
  // Remove from current suggestions
  currentSuggestions = currentSuggestions.filter(s => s.id !== suggestionId)
  displaySuggestions(currentSuggestions)
}

// Handle suggestion applied response
function handleSuggestionApplied(message: any) {
  if (message.success) {
    showStatus(selectionStatus, '제안이 성공적으로 적용되었습니다!', 'success')
  } else {
    showStatus(selectionStatus, `제안 적용에 실패했습니다: ${message.error}`, 'error')
  }
}

// Show status message
function showStatus(element: HTMLElement, message: string, type: 'info' | 'success' | 'error') {
  element.className = `status ${type}`
  element.textContent = message
  element.classList.remove('hidden')
}

// Show error message
function showError(message: string) {
  console.error('Plugin error:', message)
  const statusEl = currentMode === 'suggest' ? selectionStatus : auditStatus
  showStatus(statusEl, message, 'error')
}

// Make functions available globally for onclick handlers
(window as any).applySuggestion = applySuggestion;
(window as any).dismissSuggestion = dismissSuggestion;
