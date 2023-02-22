import fs from 'fs'
import minimatch from 'minimatch'
import path from 'path'
import { FileTree } from './typings'

export const getDirChildren = (p:string) => {
  const files = fs.readdirSync(p)
  return files.map((e) => path.join(p, e))
}

export const isFile = (p:string) => {
  const stat = fs.statSync(p)
  return stat.isFile()
}

export const isDir = (p:string) => {
  const stat = fs.statSync(p)
  return stat.isDirectory()
}

export const filterDir = (paths: string[]) => {
  return paths.filter((p) => isDir(p))
}

export const filterFile = (paths:string[]) => {
  return paths.filter((p) => isFile(p))
}

export const getFileTreeCache = (root:string) => {
  const result = {
    root: gen(root)
  }

  return result

  function gen(dir:string) {
    if (['*/**/node_modules', '*/**/.+(git|vscode|husky)', '*/**/dist'].some((e) => minimatch(dir, e))) return

    const result: FileTree = {
      path: dir,
      files: {},
      children: {}
    }

    const direntList = fs.readdirSync(dir, { withFileTypes: true })

    direntList.forEach((dirent) => {
      const { name } = dirent

      const p = path.join(dir, name)

      if (dirent.isFile()) {
        result.files[name] = p
        if (name === 'import.config.json') {
          const _path = path.resolve(dir, name)
          try {
            const importConfig = JSON.parse(fs.readFileSync(_path, 'utf8'))
            if (importConfig) result.importConfig = importConfig
          } catch (error) {
            console.error(`请注意 ${_path} 解析错误`)
          }
        }
      }

      if (dirent.isDirectory()) {
        const r = gen(p)
        if (r) result.children[name] = r
      }
    })

    return result
  }
}

export const createFile = (p:string, data: string) => {
  const dirname = path.dirname(p)
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname)
  }

  fs.writeFileSync(p, data)
}
