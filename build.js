await Bun.build({
	entrypoints: ['src/index.ts'],
	outdir: 'dist',
	target: 'node',
	packages: 'external',
	drop: ['console'],
});
