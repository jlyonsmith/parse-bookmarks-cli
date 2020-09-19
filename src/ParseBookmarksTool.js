import parseArgs from "minimist"
import { fullVersion } from "./version"
import fs from "fs"
import fsPromise from "fs/promises"
import util from "util"
import { parseBookmarks } from "@johnls/parse-bookmarks"
import { stringToStream, pipeToPromise } from "@johnls/stream-utils"
import xmldom from "xmldom"

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
    const items = parseBookmarks(bookmarkHtml, {
      DOMParser: xmldom.DOMParser,
      flatten: true,
    })

    const readable = stringToStream(JSON.stringify(items))
    const writeable = args._[1]
      ? fs.createWriteStream(args._[1])
      : process.stdout

    await pipeToPromise(readable, writeable)

    return 0
  }
}
