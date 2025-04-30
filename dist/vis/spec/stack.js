export function channelStack(encoding, stackMode) {
    if (stackMode === 'stack' || stackMode === 'zero')
        return;
    let stackValue = stackMode === 'none' ? null : stackMode;
    const stackableChannels = ['x', 'y', 'theta', 'radius'];
    for (let ch of stackableChannels) {
        if (encoding[ch] && encoding[ch].type === 'quantitative') {
            encoding[ch].stack = stackValue;
        }
    }
}
//# sourceMappingURL=stack.js.map