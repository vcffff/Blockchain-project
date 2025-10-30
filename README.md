# Submission to 2025 Solana Colosseum Submission by:

Roman Jaishibekov (https://www.instagram.com/mrromenion/) 

Batumukhammed Beksultan (https://x.com/cil_mann41719) (https://github.com/BATU994)

Kanat Aldabek (https://www.instagram.com/kaneke_design/) (https://www.behance.net/45ba0a97)

Galymbek Muratbay (https://www.behance.net/galymbemuratba) (https://smart-directions-578401.framer.app/)

Magzhan Skakov (https://github.com/vcffff) (https://x.com/MagzhanSka21914)

# Resources

figma presentation:
https://www.figma.com/proto/UGZgBUPgD1J84hAntjveDQ/Agrolink-Presentation?page-id=0%3A1&node-id=2026-41&p=f&viewport=-316%2C-614%2C0.7&t=Ub8YYz8KGP0mKT0r-1&scaling=contain&content-scaling=fixed

platform AGROLINK:
https://blockchain-project-lilac.vercel.app (https://blockchain-project-lilac.vercel.app/)

Landing Page:
YouTube Video:


```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [

      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,

    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```
