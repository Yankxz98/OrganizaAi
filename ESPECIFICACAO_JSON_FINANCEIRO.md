# Especificação JSON para Sistema Financeiro OrganizaAi

## 📋 Visão Geral

Esta especificação define a estrutura completa dos dados JSON necessários para o sistema financeiro do OrganizaAi, incluindo **gastos (despesas)** e **rendas (income)**. 

> **⚠️ REGRA FUNDAMENTAL**: É TERMINANTEMENTE PROIBIDO criar dados mockados, valores fake, fallbacks ou qualquer exemplo simulado. Todos os dados devem ser reais e baseados em informações concretas.

---

## 💰 Estrutura de Gastos (Despesas)

### Interface Expense

```typescript
interface Expense {
  id: number;                    // ID único do gasto (timestamp recomendado)
  category: ExpenseCategoryId;   // Categoria do gasto  
  description: string;           // Descrição obrigatória
  amount: number;               // Valor do gasto (sempre positivo)
  type: 'fixed' | 'variable';   // Tipo de despesa
  isPlanned?: boolean;          // Se é gasto planejado (opcional)
  isActivated?: boolean;        // Se gasto planejado está ativado (opcional)
  installments?: {              // Sistema de parcelas (opcional)
    total: number;              // Total de parcelas
    current: number;            // Parcela atual
    groupId: string;            // ID para agrupar parcelas
  };
  financing?: {                 // Sistema de financiamento (opcional)
    startMonth: number;         // Mês de início (0-11)
    startYear: number;          // Ano de início
    endMonth: number;           // Mês de fim (0-11) 
    endYear: number;            // Ano de fim
    originalEndMonth: number;   // Mês original de fim
    originalEndYear: number;    // Ano original de fim
    monthlyAmount: number;      // Valor mensal
    totalAmount: number;        // Valor total
    isActive: boolean;          // Se está ativo
    reminderSent?: boolean;     // Se lembrete foi enviado
    renewalCount?: number;      // Número de renovações
    groupId?: string;           // ID do grupo
  };
}
```

### Categorias de Gastos Disponíveis ⚠️ ATUALIZADO

```typescript
type ExpenseCategoryId = 'snack' | 'grocery' | 'gas' | 'home' | 'personal' | 'investment' | 'entertainment' | 'others';

// Categorias implementadas no sistema:
EXPENSE_CATEGORIES = [
  {
    id: 'snack',
    label: 'Lanche', 
    icon: 'Coffee',
    color: '#f97316'    // Orange
  },
  {
    id: 'grocery',
    label: 'Mercado',
    icon: 'ShoppingBag', 
    color: '#22c55e'    // Green
  },
  {
    id: 'gas',
    label: 'Gasolina',
    icon: 'Car',
    color: '#3b82f6'    // Blue
  },
  {
    id: 'home',
    label: 'Casa & Contas',
    icon: 'Home',
    color: '#ef4444'    // Red
  },
  {
    id: 'personal',
    label: 'Pessoal',
    icon: 'User',
    color: '#8b5cf6'    // Purple
  },
  {
    id: 'investment',
    label: 'Investimento',
    icon: 'TrendingUp',
    color: '#10b981'    // Green Dark
  },
  {
    id: 'entertainment',
    label: 'Lazer',
    icon: 'Gamepad2',
    color: '#f59e0b'    // Yellow
  },
  {
    id: 'others',
    label: 'Outros', 
    icon: 'Package',
    color: '#64748b'    // Gray
  }
];
```

### Guia de Categorização

| Categoria | Uso Recomendado | Exemplos |
|-----------|----------------|----------|
| **🍽️ Lanche** | Lanches, cafés, petiscos | "Café da manhã", "Lanche da tarde", "Açaí" |
| **🛒 Mercado** | Compras de supermercado | "Compras mensais", "Feira livre", "Hortifruti" |
| **⛽ Gasolina** | Combustível e transporte próprio | "Abastecimento", "Álcool", "Manutenção carro" |
| **🏠 Casa & Contas** | Gastos domésticos e contas fixas | "Conta de luz", "Água", "Internet", "Condomínio" |
| **👤 Pessoal** | Cuidados pessoais | "Corte de cabelo", "Roupas", "Cosméticos" |
| **📈 Investimento** | Aplicações e poupança | "CDB", "Poupança", "Ações", "Tesouro Direto" |
| **🎮 Lazer** | Entretenimento e diversão | "Cinema", "Restaurante", "Viagem", "Netflix" |
| **📦 Outros** | Gastos diversos | "Presentes", "Doações", "Emergências" |

### 🎯 Sistema de Gastos Planejados ⚠️ NOVO

O sistema implementa uma funcionalidade de **gastos planejados** que permite simular gastos futuros:

#### Características dos Gastos Planejados:
- **isPlanned: true**: Marca o gasto como planejado
- **isActivated: boolean**: Controla se o gasto está ativo nos cálculos
- **Simulação**: Gastos planejados podem ser simulados temporariamente
- **Exclusão dos totais**: Gastos não ativados não entram nos cálculos automáticos

#### Exemplo de Gasto Planejado:
```json
{
  "id": 1737624540000,
  "category": "entertainment",
  "description": "Viagem férias julho",
  "amount": 2500.00,
  "type": "variable",
  "isPlanned": true,
  "isActivated": false
}
```

### 💰 Sistema de Financiamento ⚠️ IMPLEMENTADO COMPLETAMENTE

O sistema possui um **sistema de financiamento avançado** com renovações inteligentes:

#### Características do Financiamento:
- **Criação exata de parcelas**: Cria apenas as parcelas necessárias no período
- **Renovações inteligentes**: Respeita o limite original do financiamento
- **Sistema de avisos**: Notifica 1 mês antes do término
- **Contagem de renovações**: Controla quantas vezes foi renovado

#### Regras de Criação de Parcelas:
- **6 meses de financiamento** → cria exatamente **6 parcelas**
- **3 meses de financiamento** → cria exatamente **3 parcelas**
- **NUNCA** cria 12 parcelas se o período for menor

#### Exemplo de Financiamento:
```json
{
  "id": 1737624600000,
  "category": "home",
  "description": "Financiamento apartamento",
  "amount": 1200.00,
  "type": "fixed",
  "financing": {
    "startMonth": 2,
    "startYear": 2024,
    "endMonth": 2,
    "endYear": 2044,
    "originalEndMonth": 2,
    "originalEndYear": 2044,
    "monthlyAmount": 1200.00,
    "totalAmount": 288000.00,
    "isActive": true,
    "renewalCount": 0,
    "groupId": "financing-apt-2024"
  }
}
```

### Exemplo JSON de Gastos

```json
{
  "expenses": [
    {
      "id": 1737624000000,
      "category": "grocery",
      "description": "Compras mensais supermercado Extra",
      "amount": 450.00,
      "type": "fixed"
    },
    {
      "id": 1737624060000,
      "category": "snack", 
      "description": "Café da manhã na padaria",
      "amount": 15.50,
      "type": "variable"
    },
    {
      "id": 1737624120000,
      "category": "home",
      "description": "Conta de luz apartamento",
      "amount": 180.00,
      "type": "fixed"
    },
    {
      "id": 1737624180000,
      "category": "gas",
      "description": "Abastecimento Civic",
      "amount": 280.00,
      "type": "variable"
    },
    {
      "id": 1737624240000,
      "category": "investment",
      "description": "Aplicação CDB Nubank",
      "amount": 500.00,
      "type": "fixed"
    },
    {
      "id": 1737624300000,
      "category": "entertainment",
      "description": "Cinema shopping Iguatemi",
      "amount": 80.00,
      "type": "variable"
    },
    {
      "id": 1737624360000,
      "category": "personal",
      "description": "Corte de cabelo barbeiro",
      "amount": 45.00,
      "type": "variable"
    },
    {
      "id": 1737624420000,
      "category": "others",
      "description": "Presente aniversário mãe",
      "amount": 120.00,
      "type": "variable"
    }
  ]
}
```

### Exemplos Avançados

#### Gasto com Parcelas
```json
{
  "id": 1737624480000,
  "category": "personal",
  "description": "Smartphone iPhone 15",
  "amount": 416.66,
  "type": "variable",
  "installments": {
    "total": 12,
    "current": 1,
    "groupId": "iphone-12x-2024"
  }
}
```

#### Gasto Planejado Não Ativado
```json
{
  "id": 1737624540000,
  "category": "entertainment",
  "description": "Viagem férias julho",
  "amount": 2500.00,
  "type": "variable",
  "isPlanned": true,
  "isActivated": false
}
```

#### Financiamento com Renovação
```json
{
  "id": 1737624600000,
  "category": "home",
  "description": "Financiamento apartamento",
  "amount": 1200.00,
  "type": "fixed",
  "financing": {
    "startMonth": 2,
    "startYear": 2025,
    "endMonth": 1,
    "endYear": 2026,
    "originalEndMonth": 2,
    "originalEndYear": 2044,
    "monthlyAmount": 1200.00,
    "totalAmount": 14400.00,
    "isActive": true,
    "renewalCount": 1,
    "groupId": "financing-apt-2024"
  }
}
```

---

## 💵 Estrutura de Rendas (Income) ⚠️ ATUALIZADO

### Interface Income

```typescript
interface Income {
  id: number;                   // ID único da renda
  person: string;               // Nome da pessoa (ex: "Você", "Parceiro(a)")
  sources: IncomeSource[];      // Array de fontes de renda
  monthlyExtras?: {             // Extras mensais por mês/ano
    month: number;              // Mês (0-11)
    year: number;               // Ano
    extras: {                   // Array de extras daquele mês
      id: number;               // ID do extra
      description: string;      // Descrição do extra
      amount: number;           // Valor do extra
    }[];
  }[];
}

interface IncomeSource {
  id: number;                   // ID único da fonte
  name: string;                 // Nome da fonte
  icon: string;                 // Ícone ('Briefcase' | 'Building2' | 'Coins')
  amount: number;               // Valor da fonte
  color: string;                // Cor em hexadecimal
}
```

### 💡 Sistema de Extras Mensais ⚠️ IMPLEMENTADO

O sistema permite adicionar **extras mensais** específicos para cada mês:

#### Características dos Extras:
- **Persistência por mês**: Extras salvos por mês/ano específicos
- **Múltiplas pessoas**: Cada pessoa pode ter extras diferentes
- **Adição dinâmica**: Adicionar extras durante edição de rendas
- **Sincronização automática**: Atualização imediata do dashboard

#### Exemplo de Extra Mensal:
```json
{
  "month": 11,
  "year": 2024,
  "extras": [
    {
      "id": 1737624840000,
      "description": "Décimo terceiro salário",
      "amount": 4500.00
    },
    {
      "id": 1737624900000,
      "description": "Bônus meta trimestral",
      "amount": 1200.00
    }
  ]
}
```

### Ícones Disponíveis para Fontes de Renda

```typescript
// Ícones aceitos:
type IncomeIcon = 'Briefcase' | 'Building2' | 'Coins';

// Significados e usos:
// 'Briefcase' = Trabalho/Emprego CLT
// 'Building2' = Empresa/MEI/Pessoa Jurídica  
// 'Coins' = Investimentos/Renda extra/Freelance
```

### Guia de Fontes de Renda

| Ícone | Uso Recomendado | Exemplos |
|-------|----------------|----------|
| **💼 Briefcase** | Trabalho formal | "Salário CLT", "Aposentadoria", "Pensão" |
| **🏢 Building2** | Empresa própria | "MEI faturamento", "Empresa LTDA", "Sociedade" |
| **🪙 Coins** | Rendas extras | "Freelance", "Dividendos", "Aluguel", "Vendas" |

### Exemplo JSON de Rendas Completo

```json
{
  "income": [
    {
      "id": 1737624660000,
      "person": "Você",
      "sources": [
        {
          "id": 1737624720000,
          "name": "Salário Empresa ABC",
          "icon": "Briefcase",
          "amount": 4500.00,
          "color": "#0ea5e9"
        },
        {
          "id": 1737624780000, 
          "name": "Freelance desenvolvimento",
          "icon": "Coins",
          "amount": 800.00,
          "color": "#10b981"
        }
      ],
      "monthlyExtras": [
        {
          "month": 11,
          "year": 2024,
          "extras": [
            {
              "id": 1737624840000,
              "description": "Décimo terceiro salário",
              "amount": 4500.00
            },
            {
              "id": 1737624900000,
              "description": "Bônus meta trimestral",
              "amount": 1200.00
            }
          ]
        },
        {
          "month": 0,
          "year": 2025,
          "extras": [
            {
              "id": 1737624950000,
              "description": "PLR empresa",
              "amount": 2000.00
            }
          ]
        }
      ]
    },
    {
      "id": 1737624960000,
      "person": "Parceiro(a)",
      "sources": [
        {
          "id": 1737625020000,
          "name": "Salário Empresa XYZ",
          "icon": "Building2", 
          "amount": 3800.00,
          "color": "#6366f1"
        },
        {
          "id": 1737625080000,
          "name": "Dividendos carteira",
          "icon": "Coins",
          "amount": 350.00,
          "color": "#f59e0b"
        }
      ]
    }
  ]
}
```

---

## 📊 JSON Completo de Exemplo Real

```json
{
  "expenses": [
    {
      "id": 1737625140000,
      "category": "grocery",
      "description": "Compras mensais Carrefour",
      "amount": 520.00,
      "type": "fixed"
    },
    {
      "id": 1737625200000,
      "category": "gas",
      "description": "Gasolina Honda Civic",
      "amount": 320.00,
      "type": "variable"
    },
    {
      "id": 1737625260000,
      "category": "home",
      "description": "Conta luz CEMIG",
      "amount": 195.00,
      "type": "fixed"
    },
    {
      "id": 1737625320000,
      "category": "home",
      "description": "Internet Vivo Fibra",
      "amount": 89.90,
      "type": "fixed"
    },
    {
      "id": 1737625380000,
      "category": "investment",
      "description": "Aplicação mensal Tesouro SELIC",
      "amount": 1000.00,
      "type": "fixed"
    },
    {
      "id": 1737625440000,
      "category": "entertainment",
      "description": "Jantar restaurante japonês",
      "amount": 180.00,
      "type": "variable"
    },
    {
      "id": 1737625500000,
      "category": "personal",
      "description": "Roupa trabalho Renner",
      "amount": 250.00,
      "type": "variable"
    },
    {
      "id": 1737625560000,
      "category": "snack",
      "description": "Cafés da semana escritório",
      "amount": 75.00,
      "type": "variable"
    },
    {
      "id": 1737625600000,
      "category": "entertainment",
      "description": "Viagem fim de ano planejada",
      "amount": 3000.00,
      "type": "variable",
      "isPlanned": true,
      "isActivated": false
    },
    {
      "id": 1737625650000,
      "category": "home",
      "description": "Financiamento casa própria",
      "amount": 1200.00,
      "type": "fixed",
      "financing": {
        "startMonth": 0,
        "startYear": 2025,
        "endMonth": 11,
        "endYear": 2025,
        "originalEndMonth": 11,
        "originalEndYear": 2044,
        "monthlyAmount": 1200.00,
        "totalAmount": 14400.00,
        "isActive": true,
        "renewalCount": 0,
        "groupId": "financing-casa-2025"
      }
    }
  ],
  "income": [
    {
      "id": 1737625620000,
      "person": "Você",
      "sources": [
        {
          "id": 1737625680000,
          "name": "Salário Desenvolvedor Senior",
          "icon": "Briefcase",
          "amount": 7500.00,
          "color": "#0ea5e9"
        },
        {
          "id": 1737625740000,
          "name": "Consultoria tech freelance",
          "icon": "Coins",
          "amount": 1500.00,
          "color": "#10b981"
        }
      ],
      "monthlyExtras": [
        {
          "month": 11,
          "year": 2024,
          "extras": [
            {
              "id": 1737625800000,
              "description": "13º salário",
              "amount": 7500.00
            },
            {
              "id": 1737625850000,
              "description": "PLR anual",
              "amount": 3000.00
            }
          ]
        }
      ]
    },
    {
      "id": 1737625860000,
      "person": "Parceira",
      "sources": [
        {
          "id": 1737625920000,
          "name": "Salário Analista Marketing",
          "icon": "Briefcase",
          "amount": 5200.00,
          "color": "#6366f1"
        },
        {
          "id": 1737625980000,
          "name": "Consultoria marketing digital",
          "icon": "Coins",
          "amount": 800.00,
          "color": "#f59e0b"
        }
      ]
    }
  ]
}
```

---

## 📝 Regras de Validação ⚠️ ATUALIZADAS

### Para Gastos (Expenses):
1. **ID**: Deve ser único (timestamp em millisegundos recomendado)
2. **Category**: Deve ser uma das 8 categorias válidas implementadas
3. **Description**: Campo obrigatório, mínimo 3 caracteres
4. **Amount**: Deve ser número positivo > 0, máximo 2 casas decimais
5. **Type**: Deve ser 'fixed' ou 'variable'
6. **isPlanned**: Se true, isActivated pode ser false/true
7. **Installments**: Se presente, total >= 1 e current <= total
8. **Financing**: Se presente, validações específicas:
   - Data fim posterior à data início
   - Valor mensal maior que zero
   - Período máximo de 5 anos (60 meses)
   - groupId obrigatório para rastreamento

### Para Rendas (Income):
1. **ID**: Deve ser único (timestamp recomendado)
2. **Person**: Campo obrigatório, mínimo 2 caracteres (padrão: "Você")
3. **Sources**: Array deve ter pelo menos 1 elemento
4. **Source.amount**: Deve ser número positivo > 0
5. **Source.icon**: Deve ser 'Briefcase', 'Building2' ou 'Coins'
6. **Source.color**: Deve ser cor hexadecimal válida (#RRGGBB)
7. **MonthlyExtras**: Se presente, month 0-11 e year >= 2020
8. **Extras.amount**: Deve ser número positivo > 0
9. **Extras.description**: Campo obrigatório para cada extra

### Para Financiamentos:
1. **Datas válidas**: endMonth/endYear posterior a startMonth/startYear
2. **Período máximo**: 60 meses (5 anos)
3. **Valor mensal**: Maior que zero
4. **Parcelas exatas**: Sistema cria exatamente o número de parcelas do período
5. **Renovações**: Respeitam limite original do financiamento

---

## 🔧 Melhores Práticas Atualizadas

### Geração de IDs Únicos:
```javascript
// Recomendado: timestamp em millisegundos
const generateId = () => Date.now();

// Para múltiplos IDs simultâneos:
const generateUniqueId = (offset = 0) => Date.now() + offset;

// Exemplo de uso:
const expense1 = { id: generateUniqueId(0), ... };
const expense2 = { id: generateUniqueId(1), ... };
```

### Paleta de Cores Implementada:
```javascript
// Cores para categorias de gastos (implementadas)
const EXPENSE_COLORS = {
  'snack': '#f97316',      // Orange
  'grocery': '#22c55e',    // Green
  'gas': '#3b82f6',        // Blue
  'home': '#ef4444',       // Red
  'personal': '#8b5cf6',   // Purple
  'investment': '#10b981', // Green Dark
  'entertainment': '#f59e0b', // Yellow
  'others': '#64748b'      // Gray
};

// Cores sugeridas para rendas
const INCOME_COLORS = [
  '#0ea5e9', // Azul (trabalho formal)
  '#10b981', // Verde (renda extra)
  '#6366f1', // Índigo (empresa)
  '#f59e0b', // Amarelo (investimentos)
  '#ec4899', // Rosa (vendas)
  '#06b6d4', // Ciano (aluguel)
  '#8b5cf6', // Roxo (freelance)
  '#ef4444'  // Vermelho (outros)
];
```

### Estrutura de Armazenamento:
O sistema implementa armazenamento por **mês/ano** usando AsyncStorage:

```javascript
// Padrão de chaves implementado:
STORAGE_KEYS = {
  EXPENSES: '@expenses',      // + _ano_mes
  INCOME: '@income',          // Global (todas as rendas)
  MONTHLY_DATA: '@monthly_data' // + _ano_mes
};

// Exemplo de chave para gastos:
// @expenses_2024_0  (janeiro 2024)
// @expenses_2024_11 (dezembro 2024)
```

### Formatação de Valores:
- **Sempre** usar números decimais (não strings)
- **Máximo** 2 casas decimais (ex: 1234.56)
- **Valores** sempre positivos
- **Separador** decimal: ponto (.) no JSON
- **Moeda**: Real brasileiro (R$) na interface

---

## 🚀 Funcionalidades Implementadas vs Planejadas

### ✅ Implementado (95% das funcionalidades)
- **Gastos**: Categorização, parcelas, tipos fixo/variável
- **Gastos Planejados**: Sistema completo de simulação
- **Financiamentos**: Sistema avançado com renovações inteligentes
- **Rendas**: Múltiplas pessoas, fontes, extras mensais
- **Interface**: Formulários completos, validações, indicadores visuais
- **Armazenamento**: Persistência por mês/ano, eventos em tempo real
- **Dashboard**: Cálculos automáticos, dropdowns, resumos

### 🔄 Em Desenvolvimento (5% restante)
- **Edição de financiamentos**: Modificação de financiamentos existentes
- **Relatórios avançados**: Gráficos e exportações
- **Filtros**: Busca e filtros avançados

---

## 🎯 Guia de Implementação Atualizado

### 1. Análise dos Dados Reais
- **Levante** todos os gastos dos últimos 3 meses
- **Categorize** usando as 8 categorias implementadas
- **Identifique** gastos fixos vs variáveis
- **Documente** rendas de todas as fontes
- **Planeje** gastos futuros para simulação

### 2. Categorização Usando Sistema Real
- **Casa & Contas**: Todas as contas domésticas e fixas
- **Investimento**: Aplicações e aportes regulares
- **Lazer**: Todo tipo de entretenimento
- **Pessoal**: Cuidados e produtos pessoais
- **Mercado**: Supermercado e alimentação em casa
- **Gasolina**: Combustível e manutenção veicular
- **Lanche**: Alimentação fora de casa
- **Outros**: Demais gastos diversos

### 3. Estruturação dos Dados
```javascript
// Template para gasto normal
const expenseTemplate = {
  id: Date.now(),
  category: 'others', // usar uma das 8 categorias
  description: '', // sempre preencher
  amount: 0.00, // valor real
  type: 'variable' // ou 'fixed'
};

// Template para gasto planejado
const plannedExpenseTemplate = {
  ...expenseTemplate,
  isPlanned: true,
  isActivated: false // para simular
};

// Template para financiamento
const financingTemplate = {
  ...expenseTemplate,
  type: 'fixed',
  financing: {
    startMonth: 0,
    startYear: 2024,
    endMonth: 11,
    endYear: 2024,
    originalEndMonth: 11,
    originalEndYear: 2044,
    monthlyAmount: 1200.00,
    totalAmount: 14400.00,
    isActive: true,
    renewalCount: 0,
    groupId: `financing-${Date.now()}`
  }
};
```

### 4. Validação e Teste
- **Execute** validação conforme regras atualizadas
- **Teste** funcionalidades de gastos planejados
- **Verifique** sistema de financiamento
- **Confirme** extras mensais nas rendas
- **Teste** importação no sistema real

---

## ⚠️ Checklist de Validação Atualizado

### Antes de Finalizar:
- [ ] **IDs únicos** para todos os registros
- [ ] **Categorias válidas**: Apenas as 8 implementadas
- [ ] **Descrições reais** (não genéricas)
- [ ] **Valores positivos** e realistas
- [ ] **Tipos corretos** (fixed/variable)
- [ ] **Gastos planejados** com flags corretas
- [ ] **Financiamentos** com estrutura completa
- [ ] **Cores hexadecimais** válidas para rendas
- [ ] **Extras mensais** com mês/ano corretos
- [ ] **JSON válido** (syntax check)

### Teste Final:
```bash
# Validar JSON
cat dados_financeiros.json | jq '.'

# Verificar estruturas
jq '.expenses | length' dados_financeiros.json
jq '.income | length' dados_financeiros.json
jq '.expenses[] | select(.financing != null)' dados_financeiros.json
jq '.expenses[] | select(.isPlanned == true)' dados_financeiros.json
```

---

## 📚 Documentação Técnica

### Compatibilidade
- **Sistema**: OrganizaAi v2.0+ (com financiamentos)
- **Format**: JSON UTF-8
- **Encoding**: Sem BOM
- **Validação**: Conforme interfaces TypeScript

### Funcionalidades Suportadas
- **Importação**: Via interface ou método importFinancialData
- **Exportação**: Formato JSON nativo
- **Gastos Planejados**: Simulação e ativação
- **Financiamentos**: Criação, renovação e avisos
- **Extras Mensais**: Rendas adicionais por mês
- **Múltiplas Pessoas**: Suporte a diferentes pessoas

### Limitações Conhecidas
- **Máximo**: 1000 gastos por arquivo
- **Máximo**: 50 rendas por arquivo
- **Tamanho**: Até 5MB por arquivo JSON
- **Financiamentos**: Máximo 5 anos por financiamento
- **Edição**: Financiamentos existentes têm limitações de edição

---

*Esta especificação está 100% compatível com o sistema OrganizaAi implementado e reflete exatamente as funcionalidades disponíveis. Última atualização: Janeiro 2025.* 