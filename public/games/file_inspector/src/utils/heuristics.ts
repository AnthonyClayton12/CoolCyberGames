export const heuristicsForName = (fileName: string) => {
    const suspiciousPatterns = [
        /\.exe$/,
        /\.scr$/,
        /\.bat$/,
        /\.cmd$/,
        /\.com$/,
        /\.js$/,
        /\.vbs$/,
        /\.wsf$/,
        /\.pif$/,
        /\.msi$/,
        /\.jar$/,
        /\.apk$/,
    ];

    const reasons: string[] = [];

    suspiciousPatterns.forEach(pattern => {
        if (pattern.test(fileName)) {
            reasons.push(`File name matches suspicious pattern: ${pattern}`);
        }
    });

    return {
        verdict: reasons.length > 0 ? 'suspicious' : 'clean',
        reasons,
    };
};

export const evaluateFile = (file: { name: string; size: number; type: string }) => {
    const { verdict, reasons } = heuristicsForName(file.name);

    return {
        verdict,
        reasons,
        file,
    };
};