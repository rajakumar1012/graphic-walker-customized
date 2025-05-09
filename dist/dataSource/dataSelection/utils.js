export function jsonReader(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!Array.isArray(data)) {
                    throw new Error('Invalid JSON file');
                }
                resolve(data);
            }
            catch (e) {
                reject(e);
            }
        };
        reader.readAsText(file);
    });
}
//# sourceMappingURL=utils.js.map