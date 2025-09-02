---
📱 Documentação de Telas - App Financeiro
## 🔹 Regras Globais de Layout

- O **app não deve ocupar a tela inteira**.
- Deve-se **reservar espaço na parte superior** para a **Status Bar do sistema operacional**
(área onde ficam hora, bateria, wifi, bluetooth).
- Esse espaço é tratado como **Safe Area** em dispositivos móveis (iOS/Android).
- Nenhum elemento da UI pode se sobrepor a essa área(essa regra é fundamental para o funcionamento do sistema,revise todas as telas para q todas tenham esse comportamento).

---

# 🏠 Tela: **Dashboard** (Tela Inicial)

📍 **Primeira tela exibida ao abrir o app.**

**Objetivo:** apresentar visão consolidada das finanças e permitir acesso rápido às principais funcionalidades.

---

### 🔝 Header (Topo)

1. **Botão Menu Hambúrguer** (📍 canto superior esquerdo, dentro da Safe Area)
    - **Objetivo:** abrir/fechar menu lateral de navegação.
    - **Funcionalidade:** exibe as opções:
        - Dashboard
        - Gastos
        - Rendas
        - Viagens
        - Configurações
2. **Seta Esquerda (⬅️)** (📍 à esquerda do nome do mês)
    - **Objetivo:** navegar para o **mês anterior**.
    - **Funcionalidade:** atualiza todos os valores exibidos na tela para os dados do mês anterior.
3. **Nome do Mês (dinâmico)** (📍 centralizado no header)
    - **Objetivo:** exibir o mês atual.
    - **Funcionalidade:** atualizado dinamicamente conforme a navegação entre meses.
4. **Seta Direita (➡️)** (📍 à direita do nome do mês)
    - **Objetivo:** navegar para o **próximo mês**.
    - **Funcionalidade:** atualiza os valores para o mês seguinte.
5. **Botão de Mais Opções (⋮)** (📍 canto superior direito)
    - **Objetivo:** abrir menu extra de funcionalidades.
    - **Funcionalidade:** vazio por enquanto.

---

### 📊 Indicadores Principais

📍 Localização: logo abaixo do Header.

1. **Segmented Control (3 botões lado a lado: Inicial | Saldo | Previsto)**
    - **Objetivo:** alterar o cálculo e exibição dos valores do dashboard.
    - **Funcionalidade:**
        - *Inicial:* exibe saldo inicial (rendas acumuladas no início do mês).
        - *Saldo:* exibe saldo atual (rendas - gastos no momento).
        - *Previsto:* exibe projeção futura (considerando rendas futuras - gastos já planejados).
2. **Gráfico de Linha** (📍 abaixo do segmented control)
    - **Objetivo:** mostrar a evolução das finanças ao longo do tempo.
    - **Funcionalidade:** exibe entradas e saídas diárias, com possibilidade de tooltip ao toque.

---

### 📋 Seção: Visão Geral

📍 Localização: abaixo do gráfico.

1. **Título da Seção:** *Visão Geral*
2. **Lista de Categorias (linhas dinâmicas):**
    - Ícone da categoria
    - Nome da categoria (*Receitas, Despesas, Balanço de Transferências, Cartões de Crédito*)
    - Valor (📍 alinhado à direita)
    - **Funcionalidade:**
        - Ao clicar em *Receitas* → abre tela **Rendas**.
        - Ao clicar em *Despesas* → abre tela **Gastos**.
        - Ao clicar nos demais → abre a tela específica da categoria.

---

### 🏦 Seção: Contas

📍 Localização: abaixo da seção Visão Geral.

1. **Título da Seção:** *Contas*
2. **Lista de Contas (linhas dinâmicas):**
    - Ícone da conta
    - Nome da conta (*Investimentos, Carteira, Conta Corrente, etc.*)
    - Valor (📍 alinhado à direita)
    - **Funcionalidade:** ao clicar → abre extrato detalhado da conta.
3. **Rodapé da Seção (linha fixa):**
    - Texto: *Total*
    - Valor somado de todas as contas.
    - Apenas exibição, não clicável.

---

### ➕ Floating Action Button (FAB)

📍 Localização: canto inferior direito, acima da barra de navegação do sistema.

- **Botão Flutuante Azul com “+”**
    - **Objetivo:** adicionar movimentações.
    - **Funcionalidade:** ao clicar → abre popup com duas opções:
        - *Renda* → abre tela de **Nova Receita**.
        - *Despesa* → abre tela de **Nova Despesa**.

---

# 💰 Tela: **Rendas**

📍 Pode ser acessada via:

- Menu lateral (*Rendas*), ou
- Atalho na seção *Visão Geral*, ou
- Botão flutuante (opção *Renda*).

**Objetivo:** gerenciar todas as receitas cadastradas no app.

---

### 🔝 Header (Topo)

1. **Botão Voltar (⬅️)** (📍 canto superior esquerdo, respeitando Safe Area)
    - **Objetivo:** retornar para a tela anterior.
2. **Título da Tela: "Rendas"** (📍 centralizado no header)
    - **Objetivo:** identificar a tela atual.
3. **Botão de Mais Opções (⋮)** (📍 canto superior direito)
    - **Objetivo:** exibir opções extras (filtrar, exportar, ordenar).

---

### 📋 Lista de Rendas

📍 Localização: abaixo do header.

1. **Itens de Renda (linhas dinâmicas):**
    - Ícone da categoria (💼 salário, 💸 extra, 🎁 presente, etc.)
    - Nome/descrição da renda
    - Valor (📍 alinhado à direita)
    - **Funcionalidade:** ao clicar em uma linha → abre tela **Detalhes da Renda** com opções de *editar ou excluir*.

---

### ➕ Floating Action Button (FAB)

📍 Localização: canto inferior direito.

- **Botão Flutuante Azul com “+”**
    - **Objetivo:** cadastrar nova renda.
    - **Funcionalidade:** ao clicar → abre tela **Nova Receita** com os campos:
        - **Descrição** → campo de texto
        - **Valor** → campo numérico
        - **Recorrência** → opções: não recorrente | parcelar/repetir | fixa mensal
        - **Data de vencimento** → seletor de data (date picker)
        - **Efetivada** → switch (true/false)

---

## 💸 Tela: **Despesas**

📍 Acessada via menu lateral ou atalho da Visão Geral.

Objetivo: listar todas as despesas registradas, permitindo consulta, navegação por mês e adição de novas despesas.

### 📌 Regra Geral de Layout

- A tela **não deve ocupar 100% da altura da tela do dispositivo**.
- É obrigatório reservar espaço para a **barra de status do sistema operacional** (onde ficam hora, ícone de bateria, sinal de rede, Wi-Fi, Bluetooth etc.).
- Esse espaço deve ser respeitado em todas as telas do aplicativo.

---

### 🔝 Header (Topo)

1. **Botão Voltar (⬅️)** (📍 canto superior esquerdo)
    - **Objetivo:** retornar à tela anterior.
2. **Título da Tela: “Despesas”** (📍 centralizado no header)
    - **Objetivo:** identificar a tela atual.
3. **Valor Total de Despesas** (📍 logo abaixo do título, alinhado à esquerda)
    - **Objetivo:** exibir a soma de todas as despesas do mês atual.
4. **Ícone de Filtro/Ordenação (📑)** (📍 à direita do botão de pesquisa)
    - **Objetivo:** alterar forma de exibição da lista (ordenação por valor, data, categoria, etc.).
5. **Botão de Mais Opções (⋮)** (📍 canto superior direito)
    - **Objetivo:** abrir menu com opções extras relacionadas a despesas.

---

### Navegação por Mês

1. **Seta Esquerda (⬅️)** (📍 logo abaixo do header, canto esquerdo)
    - **Objetivo:** navegar para despesas do mês anterior.
2. **Nome do Mês Atual** (📍 centralizado)
    - **Objetivo:** indicar em qual mês o usuário está navegando.
    - **Dinâmico:** altera ao trocar de mês.
3. **Seta Direita (➡️)** (📍 logo abaixo do header, canto direito)
    - **Objetivo:** navegar para despesas do próximo mês.

### 📋 Listagem de Despesas

📍 Localização: abaixo da navegação de meses.

- Cada linha de despesa contém:
    - ✅ **Ícone de status** (círculo com check) → indica se a despesa já foi efetivada.
    - 🏦 **Conta vinculada** (ex: Conta Corrente).
    - 📝 **Descrição da despesa** (texto livre inserido pelo usuário).
    - 🏷️ **Tag de Categoria** (ex: Alimentação, Transporte, Outros).
    - 📅 **Data da despesa** (dia + dia da semana).
    - 💰 **Valor da despesa** (📍 alinhado à direita).

**Funcionalidade:** ao clicar em uma linha → abre a tela **“Detalhes da Despesa”** com opções de *editar ou excluir*.

### ➕ Floating Action Button (FAB)

1. **Botão Flutuante Vermelho com “+”** (📍 canto inferior direito)
    - **Objetivo:** cadastrar uma nova despesa.
    - **Funcionalidade:** ao clicar → abre tela **“Nova Despesa”**.

## 📝 Tela: **Nova Despesa**

📍 Aberta ao clicar no botão **FAB** na tela de despesas.

Objetivo: permitir ao usuário registrar manualmente uma nova despesa.

---

### 🔝 Header (Topo)

1. **Botão Fechar (❌)** (📍 canto superior esquerdo)
    - **Objetivo:** cancelar cadastro e retornar sem salvar.
2. **Título da Tela: “Nova Despesa”** (📍 centralizado).
3. **Botão Salvar (💾)** (📍 canto superior direito, cor vermelha).
    - **Objetivo:** salvar a despesa cadastrada.
4. **Botão de Mais Opções (⋮)** (📍 canto superior direito, ao lado do botão salvar).
    - **Objetivo:** abrir opções adicionais

---

### 📋 Formulário de Cadastro

1. **Campo Descrição (texto livre)**
    - 📍 Localização: primeira linha do formulário.
    - **Objetivo:** inserir nome/descrição da despesa.
2. **Campo Valor (números)**
    - 📍 Logo abaixo da descrição.
    - **Objetivo:** inserir valor da despesa.
3. **Campo Recorrência**
    - 📍 Abaixo do valor.
    - **Opções:** *Não recorrente, Parcelado, Repetir, Fixa mensal*.
4. **Campo Data de Vencimento (Date Picker)**
    - 📍 Abaixo do toggle multicategorias.
    - **Objetivo:** selecionar data em que a despesa deve ser paga.
5. **Alternador Efetivada (toggle)**
    - 📍 Abaixo do vencimento.
    - **Objetivo:** marcar se a despesa já foi paga/efetivada ou nao.

---

### 📂 Seção Categoria

1. **Campo Categoria (dropdown + ícone)**
    - **Objetivo:** selecionar categoria principal da despesa.
2. **Campo Subcategoria (dropdown + ícone)**
    - **Objetivo:** selecionar subcategoria específica.

---

### 🏦 Seção Conta

1. **Campo Conta (dropdown + ícone)**
    - **Objetivo:** selecionar em qual conta/carteira será debitada a despesa.

---

### ⚙️ Opções Extras

1. **Alternador “Salvar e Continuar”**
