import assert from "node:assert";
import { generateQrMatrix, generateQrSvgPath } from "./qr";

// Self-check: QR matrix generation and dimensions
const otpauth = "otpauth://totp/ejecuta.tech:user%40example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=ejecuta.tech&algorithm=SHA1&digits=6&period=30";
const matrix = generateQrMatrix(otpauth);

// Matrix must be square and larger than 21x21
assert.ok(Array.isArray(matrix), "Matrix should be an array");
assert.ok(matrix.length > 21, "Matrix size should match version > 1");
assert.strictEqual(matrix.length, matrix[0].length, "Matrix should be square");

// Top-left finder pattern must be dark at (0, 0)
assert.strictEqual(matrix[0][0], true, "Finder top-left (0,0) should be dark");
assert.strictEqual(matrix[1][1], false, "Finder ring (1,1) should be light");
assert.strictEqual(matrix[3][3], true, "Finder center (3,3) should be dark");

// SVG path generation
const svg = generateQrSvgPath(matrix);
assert.ok(svg.path.length > 0, "SVG path should not be empty");
assert.strictEqual(svg.size, matrix.length + 8, "SVG size should include border");

console.log("QR self-check passed.");
