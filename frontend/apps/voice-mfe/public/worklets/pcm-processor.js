/**
 * PCM AudioWorklet processor — converts float32 mic input to 16-bit PCM
 * and posts each 128-sample frame to the main thread for streaming.
 *
 * Runs in the AudioWorklet scope (separate thread, no DOM access).
 */
class PcmProcessor extends AudioWorkletProcessor {
  /** Accumulator for assembling 4096-sample chunks before sending */
  _buffer = new Float32Array(4096);
  _bufLen = 0;

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // mono input, 128 samples per frame

    // Accumulate frames until we reach 4096 samples (~256 ms at 16 kHz)
    let srcOffset = 0;
    while (srcOffset < channelData.length) {
      const needed = 4096 - this._bufLen;
      const available = channelData.length - srcOffset;
      const copy = Math.min(needed, available);

      this._buffer.set(channelData.subarray(srcOffset, srcOffset + copy), this._bufLen);
      this._bufLen += copy;
      srcOffset += copy;

      if (this._bufLen === 4096) {
        // Convert float32 → int16
        const int16 = new Int16Array(4096);
        for (let i = 0; i < 4096; i++) {
          const s = Math.max(-1, Math.min(1, this._buffer[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Transfer the ArrayBuffer to the main thread (zero-copy)
        this.port.postMessage(int16.buffer, [int16.buffer]);
        this._bufLen = 0;
      }
    }

    return true; // keep processor alive
  }
}

registerProcessor('pcm-processor', PcmProcessor);
