// figma-plugin/src/code.ts  (예시 최소본)
/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 380, height: 520, themeColors: true });

// 선택 텍스트 가져오기
async function getSelectedText(): Promise<string | null> {
  const sel = figma.currentPage.selection;
  for (const node of sel) {
    if ("characters" in node) return (node as TextNode).characters;
  }
  return null;
}

// 현재 페이지의 모든 텍스트 수집
function getAllTextsOnPage(): string[] {
  const out: string[] = [];
  function walk(n: SceneNode) {
    if ("characters" in n) out.push((n as TextNode).characters);
    if ("children" in n) n.children.forEach(walk);
  }
  figma.currentPage.children.forEach(walk);
  return out;
}

// UI → Code 메시지 핸들링
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "GET_SELECTION": {
      const text = await getSelectedText();
      figma.ui.postMessage({ type: "SELECTION", text });
      break;
    }
    case "GET_DOCUMENT": {
      const texts = getAllTextsOnPage();
      figma.ui.postMessage({ type: "DOCUMENT_TEXTS", texts });
      break;
    }
    case "APPLY_SUGGESTION": {
      const sel = figma.currentPage.selection;
      if (sel[0] && "characters" in sel[0]) {
        (sel[0] as TextNode).characters = msg.text ?? "";
      }
      break;
    }
    default:
      // no-op
      break;
  }
};
