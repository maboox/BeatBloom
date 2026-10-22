export function encodeWav(buffer) {
  const channels = buffer.numberOfChannels,
    length = buffer.length * channels * 2;
  const data = new ArrayBuffer(44 + length),
    v = new DataView(data);
  const text = (offset, s) => [...s].forEach((c, i) => v.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + length, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, buffer.sampleRate, true);
  v.setUint32(28, buffer.sampleRate * channels * 2, true);
  v.setUint16(32, channels * 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, length, true);
  const arrays = Array.from({ length: channels }, (_, i) => buffer.getChannelData(i));
  let offset = 44;
  for (let i = 0; i < buffer.length; i++)
    for (const channel of arrays) {
      const n = Math.max(-1, Math.min(1, channel[i] || 0));
      v.setInt16(offset, n < 0 ? n * 32768 : n * 32767, true);
      offset += 2;
    }
  return data;
}
