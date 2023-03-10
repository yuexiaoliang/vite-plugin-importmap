import fs from 'fs'
import path from 'path'
import { normalizePath, PluginOption } from 'vite'
import { FileTree, Mark } from './typings'
import {cleanUrl, createFile, getFileTreeCache } from './utils'


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

      const handleSourceID = _handleSourceID(mark, root, cache)

      if (source.includes('node_modules')) return

      if (!importer) return
      if (importer.includes('node_modules')) return
      if (importer.endsWith('index.html')) return


      const id = await getResolveId(source)
      if (!id) return
      if (id.includes('node_modules')) return

      const isVirtual = cleanUrl(id).includes('\0')
      if (isVirtual) return

      const newID = handleSourceID(path.normalize(id))
      if (!newID) return

      const resultID = await getResolveId(newID)
      if (!resultID) return
      if (resultID.includes('node_modules')) return
      if (!path.isAbsolute(resultID)) return
      if (!fs.existsSync(resultID)) return

      return normalizePath(resultID)
    }
  }
}

export default plugin

function _handleSourceID(mark: string, root: string, cache: any) {
  const getDir = _getDir(root, cache)

  return (filename: string) => {
    if (!mark || typeof mark !== 'string')
      return filename

    const { name, dir, ext, base } = path.parse(filename)
    const _dir = getDir(dir)
    if (!_dir)
      return
    const { files, importConfig } = _dir

    // ?????? Test.v1.vue ???????????????
    const formatted = path.format({ dir, name: `${name}.${mark}`, ext })
    const basename = path.basename(formatted)
    if (files[basename])
      return files[basename]

    // ?????? Test[v1,v2,v3].vue ???????????????
    const find = Object.keys(files).find((file) => {
      return file.match(new RegExp(`${name}\\[.*${mark}.*\\]${ext}`, 'i'))
    })
    if (find)
      return files[find]

    // ?????? import.config.json ??????
    if (importConfig?.[base]) {
      const fileImportConfig = importConfig[base]
      const findName = Object.keys(fileImportConfig).find((key) => {
        const val = fileImportConfig[key]

        if (!Array.isArray(val)) {
          throw new Error(`${dir}??? import.config.json ????????????`)
        }

        return val.includes(mark)
      })
      return findName ? files[findName] : null
    }

    return
  }
}

function _getDir(root: string, cache: any) {
  return (p: string): FileTree | undefined => {
    const pathFragment = p
      .replace(root, '')
      .split(path.sep)
      .filter((e) => e.length > 0)

    let dir = cache?.root
    let result
    if (p === root)
      return dir

    pathFragment.forEach((el, index) => {
      if (!dir)
        return

      const { children } = dir
      if (!children)
        return
      dir = children[el]

      if (index === pathFragment.length - 1) {
        result = dir
        return
      }
    })

    return result
  }
}

