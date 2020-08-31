import parseArgs from "minimist"
import { fullVersion } from "./version"
import fs from "fs"
import fsPromise from "fs/promises"
import util from "util"
import parse from "bookmarks-parser"
import { stringToStream, pipeToPromise } from "@johnls/stream-utils"

export class ParseBookmarksTool {
  constructor(container) {
    this.toolName = container.toolName
    this.log = container.log
    this.debug = container.debug
  }

  async run(argv) {
    const options = {
      string: [],
      boolean: ["help", "version", "debug"],
      alias: {},
      default: {},
    }

    const args = parseArgs(argv, options)

    this.debug = args.debug

    if (args.version) {
      this.log.info(`v${fullVersion}`)
      return 0
    }

    if (args.help) {
      this.log.info(`
Usage: ${this.toolName} [options] <bookmarks-file> [<json-file>]

options:
  --help          Shows this help.
  --version       Shows the tool version.
`)
      return 0
    }

    if (!args._[0]) {
      throw new Error("Specify bookmarks file to convert")
    }

    const bookmarkHtml = await fsPromise.readFile(args._[0], {
      encoding: "utf-8",
    })
    const asyncParseBookmarks = util.promisify(parse)
    const result = await asyncParseBookmarks(bookmarkHtml)
    const bookmarks = []

    const processBookmark = (bookmark, path) => {
      if (bookmark.type === "folder") {
        bookmark.children.forEach((child) => {
          processBookmark(child, path + "/" + bookmark.title)
        })
      } else {
        bookmarks.push({
          title: bookmark.title,
          url: bookmark.url,
          path,
          addedDate: bookmark.add_date,
          icon: bookmark.icon,
        })
      }
    }

    result.bookmarks.forEach((child) => {
      processBookmark(child, child.ns_root)
    })

    this.log.info(`Parsed & flattened ${bookmarks.length} bookmarks`)

    const readable = stringToStream(JSON.stringify(bookmarks))
    const writeable = args._[1]
      ? fs.createWriteStream(args._[1])
      : process.stdout

    await pipeToPromise(readable, writeable)

    return 0
  }
}
