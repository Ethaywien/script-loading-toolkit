import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.main,
                format: 'cjs',
            },
            {
                file: pkg.module,
                format: 'es',
            },
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
        ],
        plugins: [
            typescript({
                typescript: require('typescript'),
            }),
        ],
    },
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.browser,
                format: 'umd',
                name: 'scriptToolkit'
            },
        ],
        external: [
            ...Object.keys(pkg.peerDependencies || {}),
        ],
        plugins: [
            resolve({
                browser: true,
            }),
            typescript({
                typescript: require('typescript'),
            }),
            terser()
        ],
    }
]