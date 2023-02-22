import fs from 'fs'
import path from 'path'
import { normalizePath, PluginOption } from 'vite'
import { FileTree, Mark } from './typings'
import { createFile, getFileTreeCache } from './utils'


function plugin(mark: Mark): PluginOption {
  let FILE_TREE_CACHE_PATH
  let root:string
  let cache:any

  return {
    name: 'vite-plugin-importmap',
    enforce: 'pre',

    async configResolved({ root: _root }) {
      FILE_TREE_CACHE_PATH = path.join(__dirname, '.cache', 'FILE_TREE.json')
      root = path.normalize(_root)

      cache = getFileTreeCache(_root)
      createFile(FILE_TREE_CACHE_PATH, JSON.stringify(cache))
    },

    async resolveId(source, importer, resolveOptions) {
      const getResolveId = async (src:string) => {
        const res = await this.resolve(src, importer, { skipSelf: true, ...resolveOptions })
        return res?.id
      }

      const getDir = (p:string): FileTree | undefined => {
        const pathFragment = p
          .replace(root, '')
          .split(path.sep)
          .filter((e) => e.length > 0)

        let dir = cache?.root
        let result
        if (p === root) return dir

        pathFragment.forEach((el, index) => {
          if (!dir) return

          const { children } = dir
          if (!children) return
          dir = children[el]

          if (index === pathFragment.length - 1) {
            result = dir
            return
          }
        })

        return result
      }

      const handleSourceID = (filename: string) => {
        if (!mark || typeof mark !== 'string') return filename

        const { name, dir, ext, base } = path.parse(filename)
        const _dir = getDir(dir)
        if (!_dir) return null
        const { files, importConfig } = _dir

        // 匹配 Test.v1.vue 命名的文件
        const formatted = path.format({ dir, name: `${name}.${mark}`, ext })
        const basename = path.basename(formatted)
        if (files[basename]) return files[basename]

        // 匹配 Test[v1,v2,v3].vue 命名的文件
        const find = Object.keys(files).find((file) => {
          return file.match(new RegExp(`${name}\\[.*${mark}.*\\]${ext}`, 'i'));
        });
        if (find) return files[find]

        // 使用 import.config.json 匹配
        if (importConfig?.[base]) {
          const fileImportConfig = importConfig[base]
          const findName = Object.keys(fileImportConfig).find((key) => {
            const val = fileImportConfig[key]

            if (!Array.isArray(val)) {
              throw new Error(`${dir}中 import.config.json 格式错误`)
            }

            return val.includes(mark)
          })
          return findName ? files[findName] : null
        }

        return null
      }

      if (!importer) return null
      if (importer.includes('node_modules')) return null
      if (source.includes('node_modules')) return null

      const id = await getResolveId(source)
      if (!id) return null
      if (id.includes('node_modules')) return null
      if (id.includes('?vue')) return null
      if (id.includes('plugin-vue:export-helper')) return null
      if (id.includes('vite/preload-helper')) return null
      if (importer.endsWith('index.html')) return null

      const newID = handleSourceID(path.normalize(id))
      if (!newID) return null

      const resultID = await getResolveId(newID)
      if (!resultID) return null
      if (!path.isAbsolute(resultID)) return null
      if (resultID.includes('node_modules')) return null
      if (!fs.existsSync(resultID)) return null

      return normalizePath(resultID)
    }
  }
}

export default plugin
