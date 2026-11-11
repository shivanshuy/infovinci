import type { RichArticleDoc } from './types'

import webServerArticle from './content/webServerContent.js'
import elasticContent from './content/elasticContent.js'
import capArticle from './content/capContent.js'
import cudaContent from './content/cudaContent.js'
import mcpContent from './content/mcpContent.js'
import transformersContent from './content/transformersContent.js'
import neuralNetsContent from './content/neuralNetsContent.js'
import ggufContent from './content/ggufContent.js'
import lmFromScratchContent from './content/lmFromScratchContent.js'
import promptEngineeringContent from './content/promptEngineeringContent.js'
import datasetsContent from './content/datasetsContent.js'
import peftPhiMiniContent from './content/peftPhiMiniContent.js'
import peftUsingUnslothContent from './content/peftUsingUnslothContent.js'
import installUnslothContent from './content/installUnslothContent.js'
import developmentInPythonContent from './content/developmentInPythonContent.js'
import aiAgentContentM from './content/aiAgentContent.js'
import langChainLangGraphAIAgentContent from './content/langChainLangGraphAIAgentContent.js'
import llamaCppContent from './content/llamaCppContent.js'
import peftContent from './content/peftContent.js'
import instructionTuningContent from './content/instructionTuningContent.js'
import developmentInLangChainContent from './content/developmentInLangChainContent.js'
import functionCallingContent from './content/functionCallingContent.js'
import llmTrainingContent from './content/llmTrainingContent.js'
import edgeStackContent from './content/edgeStackContent.js'
import piiAgentsContent from './content/piiAgentsContent.js'
import a2aContent from './content/a2aContent.js'
import a2uiContent from './content/a2uiContent.js'

export const EDGE_STACK_SLUG = 'edge-stack'
export const PII_AGENTS_SLUG = 'pii-in-agents'
export const A2A_SLUG = 'a2a'
export const A2UI_SLUG = 'a2ui'

export type BundledArticle = {
  slug: string
  dateISO: string
  category: string
  doc: RichArticleDoc
}

/** Offline / demo articles shipped with the app (used when the API is unavailable). */
export const BUNDLED_ARTICLES: BundledArticle[] = [
  { slug: A2UI_SLUG, dateISO: '2026-10-31', category: 'Guide', doc: a2uiContent as RichArticleDoc },
  { slug: A2A_SLUG, dateISO: '2026-10-31', category: 'Guide', doc: a2aContent as RichArticleDoc },
  { slug: PII_AGENTS_SLUG, dateISO: '2026-10-31', category: 'Guide', doc: piiAgentsContent as RichArticleDoc },
  { slug: EDGE_STACK_SLUG, dateISO: '2026-10-31', category: 'Guide', doc: edgeStackContent as RichArticleDoc },
  { slug: 'elastic', dateISO: '2026-05-20', category: 'Article', doc: elasticContent as RichArticleDoc },
  { slug: 'web-server', dateISO: '2026-05-19', category: 'Article', doc: webServerArticle as RichArticleDoc },
  { slug: 'mcp', dateISO: '2026-05-18', category: 'Article', doc: mcpContent as RichArticleDoc },
  { slug: 'transformers', dateISO: '2026-05-17', category: 'Article', doc: transformersContent as RichArticleDoc },
  { slug: 'neural-nets', dateISO: '2026-05-16', category: 'Article', doc: neuralNetsContent as RichArticleDoc },
  { slug: 'cuda', dateISO: '2026-05-15', category: 'Article', doc: cudaContent as RichArticleDoc },
  { slug: 'cap', dateISO: '2026-05-14', category: 'Article', doc: capArticle as RichArticleDoc },
  { slug: 'gguf', dateISO: '2026-05-13', category: 'Article', doc: ggufContent as RichArticleDoc },
  { slug: 'create-lm', dateISO: '2026-05-12', category: 'Article', doc: lmFromScratchContent as RichArticleDoc },
  { slug: 'prompt', dateISO: '2026-05-11', category: 'Article', doc: promptEngineeringContent as RichArticleDoc },
  { slug: 'function-call', dateISO: '2026-05-10', category: 'Article', doc: functionCallingContent as RichArticleDoc },
  { slug: 'dev-python', dateISO: '2026-05-09', category: 'Article', doc: developmentInPythonContent as RichArticleDoc },
  { slug: 'dev-langchain', dateISO: '2026-05-08', category: 'Article', doc: developmentInLangChainContent as RichArticleDoc },
  { slug: 'llm-training', dateISO: '2026-05-07', category: 'Article', doc: llmTrainingContent as RichArticleDoc },
  { slug: 'instruct-tuning', dateISO: '2026-05-06', category: 'Article', doc: instructionTuningContent as RichArticleDoc },
  { slug: 'peft', dateISO: '2026-05-05', category: 'Article', doc: peftContent as RichArticleDoc },
  { slug: 'install-unsloth', dateISO: '2026-05-04', category: 'Article', doc: installUnslothContent as RichArticleDoc },
  { slug: 'peft-unsloth', dateISO: '2026-05-03', category: 'Article', doc: peftUsingUnslothContent as RichArticleDoc },
  { slug: 'data-sets', dateISO: '2026-05-02', category: 'Article', doc: datasetsContent as RichArticleDoc },
  { slug: 'install-llamacpp', dateISO: '2026-05-01', category: 'Article', doc: llamaCppContent as RichArticleDoc },
  { slug: 'ai-agent', dateISO: '2026-04-30', category: 'Article', doc: aiAgentContentM as RichArticleDoc },
  {
    slug: 'ai-agent-langchain',
    dateISO: '2026-04-29',
    category: 'Article',
    doc: langChainLangGraphAIAgentContent as RichArticleDoc,
  },
  {
    slug: 'tune-phi3.5-mini',
    dateISO: '2026-04-28',
    category: 'Article',
    doc: peftPhiMiniContent as RichArticleDoc,
  },
]

export const ARTICLES_BY_SLUG = Object.fromEntries(
  BUNDLED_ARTICLES.map((p) => [p.slug, p.doc]),
) as Record<string, RichArticleDoc>
