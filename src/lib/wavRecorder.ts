
export class WavRecorder {
    private mediaStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private input: MediaStreamAudioSourceNode | null = null;
    private chunks: Float32Array[] = [];
    private startTime: number = 0;
    private isRecording: boolean = false;

    public onStop?: (blob: Blob) => void;

    async start(): Promise<void> {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.input = this.audioContext.createMediaStreamSource(this.mediaStream);

        // Create script processor with buffer size 4096, 1 input channel, 1 output channel
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.chunks = [];
        this.startTime = Date.now();
        this.isRecording = true;

        this.processor.onaudioprocess = (e) => {
            if (!this.isRecording) return;
            const channelData = e.inputBuffer.getChannelData(0);
            this.chunks.push(new Float32Array(channelData));
        };

        this.input.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
    }

    async stop(): Promise<void> {
        if (!this.isRecording) return;
        this.isRecording = false;

        // Cleanup nodes
        if (this.input && this.processor) {
            this.input.disconnect();
            this.processor.disconnect();
        }

        // Stop tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }

        // Close context
        if (this.audioContext) {
            await this.audioContext.close();
        }

        // Merge chunks
        const totalLength = this.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const resultBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.chunks) {
            resultBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // Encode to WAV
        const wavBlob = this.encodeWAV(resultBuffer, this.audioContext?.sampleRate || 44100);

        if (this.onStop) {
            this.onStop(wavBlob);
        }
    }

    cancel(): void {
        this.isRecording = false;
        // Cleanup nodes
        if (this.input && this.processor) {
            this.input.disconnect();
            this.processor.disconnect();
        }

        // Stop tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }

        // Close context
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.chunks = [];
    }

    private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        // RIFF identifier
        writeString(view, 0, 'RIFF');
        // RIFF chunk length
        view.setUint32(4, 36 + samples.length * 2, true);
        // RIFF type
        writeString(view, 8, 'WAVE');
        // format chunk identifier
        writeString(view, 12, 'fmt ');
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (raw)
        view.setUint16(20, 1, true);
        // channel count
        view.setUint16(22, 1, true);
        // sample rate
        view.setUint32(24, sampleRate, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, sampleRate * 2, true);
        // block align (channel count * bytes per sample)
        view.setUint16(32, 2, true);
        // bits per sample
        view.setUint16(34, 16, true);
        // data chunk identifier
        writeString(view, 36, 'data');
        // data chunk length
        view.setUint32(40, samples.length * 2, true);

        // Write samples
        const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
            for (let i = 0; i < input.length; i++, offset += 2) {
                const s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        };

        floatTo16BitPCM(view, 44, samples);

        return new Blob([view], { type: 'audio/wav' });
    }
}
