import { nArr } from '../arr';
import type { Matrix } from 'mathjs';

type RecArr<T> = T[] | RecArr<T>[]

export const spaces = (args: { start?: number, end?: number, n?: number }): { X: Matrix, Y: Matrix } => {
	const { start = -1, end = 1, n = 51 } = args;
	const nA = nArr(n), spec = nA.map(i => (i * ((end - start) / (n - 1))) + start);

	const X = nA.map(() => spec);
	const Y_c = nA.map(i => (i * ((end - start) / (n - 1))) + start);
	const Y = nA.map(i => Array.from(Array(n).keys()).map(() => Y_c[i]));

	// @ts-ignore
	return { X, Y };
};

export const mat2Mk = (n: number, func: (x, y) => number) => nArr(n).map(y => nArr(n).map(x => func(x, y)));
export const mat2Sum2 = (matA: Matrix, matB: Matrix): Matrix => mat2Trans2(matA, matB, (a, b) => a + b);
export const mat2Scale = (mat: Matrix, scalar: number): Matrix => mat2Trans1(mat, val => val * scalar);
export const mat2Trans1 = (mat: Matrix, func: (val, i) => number): Matrix => mat.map(matR => matR.map(func));
export const mat2Trans2 = (matA: Matrix, matB: Matrix, func: (a, b, x, y) => number): Matrix =>
	matA.map((matAR, y) => matAR.map((matAC, x) => func(matAC, matB[y][x], x, y)));