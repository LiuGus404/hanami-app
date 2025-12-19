'use client';

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function SceneEffects() {
    return (
        <EffectComposer>
            <Bloom
                intensity={0.5}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                mipmapBlur
            />

        </EffectComposer>
    );
}
