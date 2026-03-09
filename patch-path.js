process.stderr.write('[patch-path.js] Installing error trap\n');

// Intercept uncaught errors and errors containing "path" argument
const origEmit = process.emit.bind(process);
process.emit = function(event, ...args) {
  if (event === 'uncaughtException' || event === 'unhandledRejection') {
    const err = args[0];
    if (err && err.message && err.message.includes('path')) {
      process.stderr.write('\n=== CAUGHT PATH ERROR ===\n');
      process.stderr.write(err.stack || String(err));
      process.stderr.write('\n=== END PATH ERROR ===\n\n');
    }
  }
  return origEmit(event, ...args);
};

// Also intercept the native path validation by patching the binding
// The native error comes from internal/validators.js validatePath()
// We can intercept it by patching path.join before the native addon runs
const path = require('path');

// Wrap every path function that could get undefined
Object.getOwnPropertyNames(path).forEach(fn => {
  if (typeof path[fn] === 'function' && fn !== 'constructor') {
    const orig = path[fn].bind(path);
    path[fn] = function(...args) {
      const hasUndef = args.some(a => a === undefined || a === null);
      if (hasUndef) {
        const err = new Error(`PATH.${fn} got undefined: [${args.map(a => JSON.stringify(a)).join(', ')}]`);
        process.stderr.write('\n=== PATH UNDEFINED ===\n' + err.stack + '\n=== END ===\n\n');
      }
      try {
        return orig(...args);
      } catch(e) {
        process.stderr.write('\n=== PATH THREW ===\n' + e.stack + '\n=== END ===\n\n');
        throw e;
      }
    };
  }
});

// Patch ALL fs functions via Module._resolveFilename hooking won't work
// Instead use a Proxy to catch the actual fs calls
const Module = require('module');
const origLoad = Module._load.bind(Module);
Module._load = function(request, parent, isMain) {
  const result = origLoad(request, parent, isMain);
  if (request === 'fs' || request === 'fs/promises') {
    return new Proxy(result, {
      get(target, prop) {
        const val = target[prop];
        if (typeof val === 'function' && (
          prop === 'existsSync' || prop === 'copyFile' || prop === 'writeFile' || 
          prop === 'readFile' || prop === 'mkdir' || prop === 'unlink' || prop === 'stat'
        )) {
          return function(...args) {
            if (args[0] === undefined || args[0] === null) {
              const err = new Error(`FS.${prop} arg[0] is ${args[0]}`);
              process.stderr.write('\n=== FS UNDEFINED ===\n' + err.stack + '\n=== END ===\n\n');
            }
            return val.apply(target, args);
          };
        }
        return val;
      }
    });
  }
  return result;
};

process.stderr.write('[patch-path.js] Done\n');
