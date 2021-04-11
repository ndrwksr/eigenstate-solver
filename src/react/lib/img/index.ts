export const scaleBuff = (origBuff: Uint8ClampedArray, size: number, scale: number) => {
	const scaled = size * scale;
	const scaledBuff = new Uint8ClampedArray(scaled * scaled * 4);

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			for (let yi = 0; yi < scale; yi++) {
				for (let xi = 0; xi < scale; xi++) {
					const origMemOffset = (y * size + x) * 4;
					const scaledMemOffset = ((y * scaled * scale) + (yi * scaled) + (x * scale) + xi) * 4;
					scaledBuff[scaledMemOffset] = origBuff[origMemOffset];
					scaledBuff[scaledMemOffset + 1] = origBuff[origMemOffset + 1];
					scaledBuff[scaledMemOffset + 2] = origBuff[origMemOffset + 2];
					scaledBuff[scaledMemOffset + 3] = origBuff[origMemOffset + 3];
				}
			}
		}
	}

	// console.log(scaledBuff);
	return scaledBuff;
};