# OrganizaAi

Aplicativo de gestão financeira pessoal desenvolvido com React Native e Expo.

## 🚀 Melhorias Recentes

### ✅ Solução Universal para Problemas de Rolagem

Implementamos uma **solução centralizada** que resolve todos os problemas de rolagem no app:

- **Componente `AppContainer`**: Container reutilizável que padroniza layout em todas as telas
- **Configuração automática**: SafeAreaView, KeyboardAvoidingView e ScrollView configurados automaticamente
- **Compatibilidade universal**: Funciona corretamente em iOS e Android
- **Padding inteligente**: Espaço adequado para evitar corte de conteúdo

**Resultado**: Nunca mais conteúdo cortado ou inacessível no final das telas! 🎉

📖 **Documentação completa**: [SOLUCAO_ROLAGEM.md](./SOLUCAO_ROLAGEM.md)

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── screens/        # Telas do aplicativo
├── hooks/          # Custom hooks
├── utils/          # Funções utilitárias
├── services/       # Serviços e APIs
├── constants/      # Constantes e configurações
├── types/          # Definições de tipos TypeScript
├── assets/         # Recursos estáticos (imagens, fontes, etc)
└── styles/         # Estilos globais e temas
```

## Scripts Disponíveis

- `npm start` - Inicia o aplicativo em modo de desenvolvimento
- `npm run android` - Inicia o aplicativo no Android
- `npm run ios` - Inicia o aplicativo no iOS
- `npm run web` - Inicia o aplicativo na web
- `npm test` - Executa os testes
- `npm run lint` - Verifica problemas de código
- `npm run type-check` - Verifica tipos TypeScript
- `npm run build` - Gera build de produção
- `npm run clean` - Limpa arquivos temporários
- `npm run doctor` - Verifica problemas no projeto

## Tecnologias

- Expo
- React Native
- TypeScript
- Jest
- ESLint
- Prettier

## Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o projeto:
   ```bash
   npm start
   ```

## Desenvolvimento

- Use `npm run lint` antes de commitar para verificar problemas de código
- Use `npm test` para executar os testes
- Use `npm run type-check` para verificar tipos TypeScript

## Build

- Android: `npm run build:android`
- iOS: `npm run build:ios`
- Web: `npm run build:web`

## Otimizações

O projeto inclui várias otimizações para melhor performance:

- Compilação incremental com TypeScript
- Cache otimizado do Metro bundler
- Remoção de código morto em produção
- Otimização de assets
- Lazy loading de componentes 