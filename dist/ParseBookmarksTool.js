"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParseBookmarksTool = void 0;

var _minimist = _interopRequireDefault(require("minimist"));

var _version = require("./version");

var _fs = _interopRequireDefault(require("fs"));

var _promises = _interopRequireDefault(require("fs/promises"));

var _util = _interopRequireDefault(require("util"));

var _parseBookmarks = require("@johnls/parse-bookmarks");

var _streamUtils = require("@johnls/stream-utils");

var _xmldom = _interopRequireDefault(require("xmldom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ParseBookmarksTool {
  constructor(container) {
    this.toolName = container.toolName;
    this.log = container.log;
    this.debug = container.debug;
  }

  async run(argv) {
    const options = {
      string: [],
      boolean: ["help", "version", "debug"],
      alias: {},
      default: {}
    };
    const args = (0, _minimist.default)(argv, options);
    this.debug = args.debug;

    if (args.version) {
      this.log.info(`v${_version.fullVersion}`);
      return 0;
    }

    if (args.help) {
      this.log.info(`
Usage: ${this.toolName} [options] <bookmarks-file> [<json-file>]

options:
  --help          Shows this help.
  --version       Shows the tool version.
`);
      return 0;
    }

    if (!args._[0]) {
      throw new Error("Specify bookmarks file to convert");
    }

    const bookmarkHtml = await _promises.default.readFile(args._[0], {
      encoding: "utf-8"
    });
    const items = (0, _parseBookmarks.parseBookmarks)(bookmarkHtml, {
      DOMParser: _xmldom.default.DOMParser,
      flatten: true
    });
    const readable = (0, _streamUtils.stringToStream)(JSON.stringify(items));
    const writeable = args._[1] ? _fs.default.createWriteStream(args._[1]) : process.stdout;
    await (0, _streamUtils.pipeToPromise)(readable, writeable);
    return 0;
  }

}

exports.ParseBookmarksTool = ParseBookmarksTool;
//# sourceMappingURL=ParseBookmarksTool.js.map