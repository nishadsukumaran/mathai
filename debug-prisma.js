// Patch path.join to catch undefined args
const path = require('path');
const origJoin = path.join.bind(path);
path.join = function(...args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === undefined || args[i] === null) {
      const err = new Error(`path.join arg[${i}] is ${args[i]}! Args: ${JSON.stringify(args)}`);
      process.stderr.write('PATH_JOIN_UNDEFINED: ' + err.stack + '\n');
    }
  }
  return origJoin(...args);
};

const origResolve = path.resolve.bind(path);
path.resolve = function(...args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === undefined || args[i] === null) {
      const err = new Error(`path.resolve arg[${i}] is ${args[i]}! Args: ${JSON.stringify(args)}`);
      process.stderr.write('PATH_RESOLVE_UNDEFINED: ' + err.stack + '\n');
    }
  }
  return origResolve(...args);
};

const origDirname = path.dirname.bind(path);
path.dirname = function(p) {
  if (p === undefined || p === null) {
    const err = new Error(`path.dirname arg is ${p}!`);
    process.stderr.write('PATH_DIRNAME_UNDEFINED: ' + err.stack + '\n');
  }
  return origDirname(p);
};

// Now run prisma generate
process.argv = ['node', 'prisma', 'generate', '--schema=database/schema/schema.prisma'];
require('./node_modules/prisma/build/index.js');
