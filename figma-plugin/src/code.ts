// Main plugin code that runs in the Figma sandbox
// This file handles Figma API interactions and communication with the UI

/// <reference types="@figma/plugin-typings" />

// Plugin configuration
const API_BASE_URL = 'http://localhost:3000/api' // Change to production URL when deployed

// Show plugin UI
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  themeColors: true 
})

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log('Received message:', msg)
  
  try {
    switch (msg.type) {
      case 'get-selection':
        await handleGetSelection()
        break
      
      case 'get-document':
        await handleGetDocument()
        break
      
      case 'apply-suggestion':
        await handleApplySuggestion(msg.data)
        break
        
      case 'resize-plugin':
        figma.ui.resize(msg.width, msg.height)
        break
        
      default:
        console.warn('Unknown message type:', msg.type)
    }
  } catch (error) {
    console.error('Error handling message:', error)
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

// Get current selection and extract relevant data
async function handleGetSelection() {
  const selection = figma.currentPage.selection
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'selection-data',
      data: [],
      message: 'No elements selected. Please select some text or design elements.'
    })
    return
  }
  
  // Extract data from selected nodes
  const selectionData = selection.map(node => extractNodeData(node))
  
  figma.ui.postMessage({
    type: 'selection-data',
    data: selectionData
  })
}

// Get entire document structure for audit
async function handleGetDocument() {
  const document = {
    name: figma.root.name,
    pages: figma.root.children.map(page => ({
      id: page.id,
      name: page.name,
      children: extractPageNodes(page as PageNode)
    }))
  }
  
  figma.ui.postMessage({
    type: 'document-data',
    data: document
  })
}

// Apply suggestion to a specific node
async function handleApplySuggestion(data: any) {
  const { nodeId, newText } = data
  
  try {
    // Find the node by ID
    const node = figma.getNodeById(nodeId)
    
    if (!node) {
      throw new Error('Node not found')
    }
    
    // Apply suggestion based on node type
    if (node.type === 'TEXT' && newText) {
      const textNode = node as TextNode
      
      // Load font before changing text
      await figma.loadFontAsync(textNode.fontName as FontName)
      textNode.characters = newText
      
      figma.ui.postMessage({
        type: 'suggestion-applied',
        nodeId,
        success: true
      })
    } else {
      throw new Error('Cannot apply suggestion to this node type')
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'suggestion-applied',
      nodeId,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply suggestion'
    })
  }
}

// Extract relevant data from a Figma node
function extractNodeData(node: SceneNode): any {
  const baseData = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible
  }
  
  // Extract text-specific data
  if (node.type === 'TEXT') {
    const textNode = node as TextNode
    return {
      ...baseData,
      text: textNode.characters,
      fontSize: typeof textNode.fontSize === 'number' ? textNode.fontSize : 16,
      fontName: textNode.fontName,
      textAlignHorizontal: textNode.textAlignHorizontal,
      textAlignVertical: textNode.textAlignVertical
    }
  }
  
  // Extract frame/group data
  if ('children' in node && node.children.length > 0) {
    return {
      ...baseData,
      children: node.children.map(child => extractNodeData(child))
    }
  }
  
  return baseData
}

// Extract nodes from a page (recursive)
function extractPageNodes(page: PageNode): any[] {
  return page.children.map(node => extractNodeDataRecursive(node))
}

// Recursively extract node data for document audit
function extractNodeDataRecursive(node: SceneNode): any {
  const nodeData = extractNodeData(node)
  
  // Continue recursing for container nodes
  if ('children' in node && node.children.length > 0) {
    nodeData.children = node.children.map(child => extractNodeDataRecursive(child))
  }
  
  return nodeData
}

// Handle plugin commands from the menu
switch (figma.command) {
  case 'suggest':
    figma.ui.postMessage({ type: 'set-mode', mode: 'suggest' })
    break
  case 'audit':
    figma.ui.postMessage({ type: 'set-mode', mode: 'audit' })
    break
  default:
    figma.ui.postMessage({ type: 'set-mode', mode: 'suggest' })
}

// Log plugin start
console.log('Language Resource Manager plugin loaded')
