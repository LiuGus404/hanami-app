'use client';

import React, { useState } from 'react';
import { ReferenceImageAnalysis, ParticleConfig } from '@/components/chat/ReferenceImageAnalysis';
import { ArrowPathIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ParticipateAnalysisTestPage() {
    const [key, setKey] = useState(0); // To force remount/restart
    const [config, setConfig] = useState<ParticleConfig>({
        samplingStride: 5,
        baseSpeed: 1,
        returnSpeed: 0.1,
        mouseRadius: 100,
        mouseForce: 20,
        noiseScale: 1,
        particleSize: 1.5
    });

    const [showControls, setShowControls] = useState(true);

    const handleRestart = () => {
        setKey(prev => prev + 1);
    };

    const handleCopyConfig = () => {
        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
        toast.success('Config copied to clipboard!');
    };

    // Dummy file for preview
    // In a real scenario, we might want to actually upload an image or provide a default one.
    // Since we can't easily fetch a local file in browser without user input, allow user to upload.
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* Animation Component */}
            <div key={key} className="absolute inset-0">
                {selectedImage ? (
                    <ReferenceImageAnalysis
                        images={[selectedImage]}
                        onComplete={() => console.log('Animation Complete')}
                        config={config}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-white">
                        <label className="cursor-pointer bg-white/10 px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                            <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                            <span>Upload Test Image</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Controls Panel */}
            <div className={`absolute top-4 right-4 z-[200] bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl w-80 max-h-[90vh] overflow-y-auto transition-transform ${showControls ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Gemini Particles</h2>
                    <button onClick={() => setShowControls(false)} className="text-gray-500 hover:text-gray-700">Hide</button>
                </div>

                <div className="space-y-4">
                    {/* Image Upload in Panel */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Image</label>
                        <input type="file" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>

                    {/* Sampling Stride */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Density (Stride: {config.samplingStride})</label>
                        <span className="text-xs text-gray-400 block mb-1">Lower = More Particles (Heavy!)</span>
                        <input
                            type="range" min="2" max="15" step="1"
                            value={config.samplingStride}
                            onChange={(e) => setConfig({ ...config, samplingStride: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Particle Size */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Particle Size: {config.particleSize}</label>
                        <input
                            type="range" min="0.5" max="5" step="0.1"
                            value={config.particleSize}
                            onChange={(e) => setConfig({ ...config, particleSize: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Base Speed (Noise) */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Jitter/Speed: {config.baseSpeed}</label>
                        <input
                            type="range" min="0" max="5" step="0.1"
                            value={config.baseSpeed}
                            onChange={(e) => setConfig({ ...config, baseSpeed: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Return Speed */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Form Strength: {config.returnSpeed}</label>
                        <span className="text-xs text-gray-400 block mb-1">How fast they return to shape</span>
                        <input
                            type="range" min="0.01" max="0.5" step="0.01"
                            value={config.returnSpeed}
                            onChange={(e) => setConfig({ ...config, returnSpeed: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Mouse Radius */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Mouse Radius: {config.mouseRadius}</label>
                        <input
                            type="range" min="50" max="500" step="10"
                            value={config.mouseRadius}
                            onChange={(e) => setConfig({ ...config, mouseRadius: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Mouse Force */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Mouse Force: {config.mouseForce}</label>
                        <input
                            type="range" min="0" max="100" step="1"
                            value={config.mouseForce}
                            onChange={(e) => setConfig({ ...config, mouseForce: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    {/* Noise Scale */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Noise Scale: {config.noiseScale}</label>
                        <input
                            type="range" min="0" max="10" step="0.1"
                            value={config.noiseScale}
                            onChange={(e) => setConfig({ ...config, noiseScale: Number(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={handleRestart}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        Restart
                    </button>
                    <button
                        onClick={handleCopyConfig}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        <ClipboardDocumentIcon className="w-5 h-5" />
                        Copy
                    </button>
                </div>
            </div>

            {/* Show controls button */}
            {!showControls && (
                <button
                    onClick={() => setShowControls(true)}
                    className="absolute top-4 right-4 z-[200] p-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30"
                >
                    Show Config
                </button>
            )}
        </div>
    );
}
