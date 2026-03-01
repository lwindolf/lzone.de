export default {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 'current'
            }
        }]
    ],
    // Preserve symlinks during transformation
    sourceMaps: 'inline',
    retainLines: true
};
