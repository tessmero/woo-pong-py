"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLutAsNpy = exportLutAsNpy;
exports.exportLutAsPython = exportLutAsPython;
const fs_1 = require("fs");
/**
 * Exports the LUT data as a NumPy .npy file (binary format).
 * @param lut The LUT instance
 * @param filePath The output .npy file path
 */
function exportLutAsNpy(lut, filePath) {
    // Write a .npy file using the numpy format spec
    // This is a minimal implementation for float32/float64/int32 arrays
    // For large LUTs, float32 is usually sufficient
    const shape = lut.detail.concat([lut.reg.leafLength]);
    const flatData = Array.from(lut.data);
    // Write as float32
    const dtype = '<f4'; // little-endian float32
    const magic = Buffer.from([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59]); // \x93NUMPY
    const version = Buffer.from([0x01, 0x00]);
    const headerObj = {
        descr: dtype,
        fortran_order: false,
        shape: shape,
    };
    let header = JSON.stringify(headerObj);
    header = header.replace(/"/g, "'");
    // Pad header to 16-byte alignment
    const padLen = 16 - ((magic.length + version.length + 2 + header.length + 1) % 16);
    const totalHeader = magic.length + version.length + 2 + header.length + padLen + 1;
    header = header + ' '.repeat(padLen) + '\n';
    const headerLen = Buffer.alloc(2);
    headerLen.writeUInt16LE(header.length, 0);
    const headerBuf = Buffer.concat([magic, version, headerLen, Buffer.from(header)]);
    // Data
    const dataBuf = Buffer.alloc(flatData.length * 4);
    for (let i = 0; i < flatData.length; i++) {
        dataBuf.writeFloatLE(flatData[i], i * 4);
    }
    // Write file
    (0, fs_1.writeFileSync)(filePath, Buffer.concat([headerBuf, dataBuf]));
}
/**
 * Escapes a JS string for use as a Python string literal.
 */
function pyString(str) {
    return `'${str.replace(/'/g, "\\'")}'`;
}
/**
 * Converts a JS value to a Python literal (number, array, or object).
 */
function toPyLiteral(val) {
    if (Array.isArray(val)) {
        return '[' + val.map(toPyLiteral).join(', ') + ']';
    }
    if (typeof val === 'object' && val !== null) {
        // Dict of field: value
        const entries = Object.entries(val);
        return '{' + entries.map(([k, v]) => `${pyString(k)}: ${toPyLiteral(v)}`).join(', ') + '}';
    }
    return String(val);
}
/**
 * Exports the LUT data as a Python object (nested list or dict).
 * @param lut The LUT instance
 * @param pyName The Python variable name to assign
 * @param asDict If true, export as dict-of-dicts; else as nested lists (default: false)
 * @returns Python code as a string
 */
function exportLutAsPython(lut, pyName, asDict = false) {
    // Gather all leaf values
    const depth = lut.reg.depth;
    const detail = lut.detail;
    const indices = [];
    function gather(idx, d) {
        if (d === depth) {
            indices.push([...idx]);
            return;
        }
        for (let i = 0; i < detail[d]; i++) {
            idx.push(i);
            gather(idx, d + 1);
            idx.pop();
        }
    }
    gather([], 0);
    // Export as a flat list for fast parsing, plus shape/leafLength info
    const flatData = Array.from(lut.data);
    const shape = detail;
    const leafLength = lut.reg.leafLength;
    // Output Python code to reshape
    const pyObj = `[${flatData.join(', ')}]`;
    return `# ${pyName}: shape=${JSON.stringify(shape)}, leafLength=${leafLength}\n` +
        `${pyName}_flat = ${pyObj}\n` +
        // `${pyName}_shape = ${JSON.stringify(shape)}\n` +
        // `${pyName}_leafLength = ${leafLength}\n` +
        // `\n` +
        // `# Example: reshape in Python (using numpy)\n` +
        // `# import numpy as np\n` +
        // `# arr = np.array(${pyName}_flat).reshape(${shape.map(s => s).join(', ')}, ${leafLength})\n`;
        `import numpy as np\n` +
        `lut = np.array(${pyName}_flat).reshape(${shape.map(s => s).join(', ')}, ${leafLength})\n`;
}
/**
 * Example Python accessor for dict-of-dicts export:
 *
 * def get_leaf(lut, *indices):
 *     key = str(tuple(indices))
 *     return lut.get(key)
 *
 * Example Python accessor for nested-list export:
 *
 * def get_leaf(lut, *indices):
 *     node = lut
 *     for i in indices:
 *         node = node[i]
 *     return node
 */
