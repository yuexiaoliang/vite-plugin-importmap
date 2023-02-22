export type Mark = string

export interface ImportConfig {
  [key: string]: Record<string, string[]>
}

export interface FileTree {
  path: string
  files: Record<string, string>
  children: Record<string, FileTree>
  importConfig?: ImportConfig
}